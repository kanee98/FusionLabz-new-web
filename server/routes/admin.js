const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const db = require('../db');
const {
  verifyPassword,
  hashPassword,
  signToken,
  requireAdmin,
  setAuthCookie,
  clearAuthCookie,
} = require('../auth');
const {
  getClientIp,
  checkLoginLock,
  recordLoginFailure,
  clearLoginFailures,
  verifySameOrigin,
  validateMagicBytes,
} = require('../security');
const { uploadProjectImage, uploadClientLogo } = require('../upload');

const router = express.Router();

// Enforce CSRF same-origin verification on all state-changing admin endpoints
router.use(verifySameOrigin);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

function parseList(input) {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseLines(input) {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    return input
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function safeUnlinkUpload(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return;
  const fullPath = path.resolve(config.ROOT_DIR, relativeUrl.slice(1));
  if (!fullPath.startsWith(config.UPLOADS_DIR)) return;
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // ignore
  }
}

// --- AUTH ---
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const ip = getClientIp(req);
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const lock = checkLoginLock(ip, cleanEmail);
    if (lock.locked) {
      return res.status(429).json({
        error: `Account temporarily locked due to repeated failed attempts. Try again in ${lock.retryMinutes} minute(s).`,
      });
    }

    const admin = await db.getAdmin();
    const valid =
      admin &&
      cleanEmail === admin.email.toLowerCase() &&
      verifyPassword(password, admin.passwordHash);

    if (!valid) {
      const fail = recordLoginFailure(ip, cleanEmail);
      await db.addAuditLog({
        id: db.uid('aud'),
        eventType: fail.locked ? 'LOGIN_LOCKOUT' : 'LOGIN_FAILED',
        actor: cleanEmail.slice(0, 120),
        ipAddress: ip,
        detail: fail.locked ? 'Locked for 15m after 5 failed attempts' : `Failed attempt #${fail.count}`,
        createdAt: new Date().toISOString(),
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    clearLoginFailures(ip, cleanEmail);
    await db.addAuditLog({
      id: db.uid('aud'),
      eventType: 'LOGIN_SUCCESS',
      actor: admin.email,
      ipAddress: ip,
      detail: 'Authenticated admin session issued',
      createdAt: new Date().toISOString(),
    });

    const token = signToken({ email: admin.email, name: admin.name, role: 'admin' });
    setAuthCookie(res, token);

    res.json({
      ok: true,
      token,
      admin: { email: admin.email, name: admin.name },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, async (_req, res, next) => {
  try {
    const admin = await db.getAdmin();
    res.json({
      admin: { email: admin.email, name: admin.name },
      storageEngine: db.engine,
    });
  } catch (err) {
    next(err);
  }
});

// Protect all subsequent admin routes
router.use(requireAdmin);

// --- DASHBOARD ---
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [projects, clients, jobs, applications, inquiries] = await Promise.all([
      db.listProjects(false),
      db.listClients(),
      db.listJobs(false),
      db.listApplications(),
      db.listInquiries(),
    ]);

    res.json({
      storageEngine: db.engine,
      counts: {
        projects: projects.length,
        publishedProjects: projects.filter((p) => p.published !== false).length,
        clients: clients.length,
        jobs: jobs.length,
        openJobs: jobs.filter((j) => j.status === 'open').length,
        applications: applications.length,
        newApplications: applications.filter((a) => a.status === 'new').length,
        inquiries: inquiries.length,
        unreadInquiries: inquiries.filter((i) => !i.read || i.status === 'new').length,
      },
      recentApplications: applications.slice(0, 6),
      recentInquiries: inquiries.slice(0, 6),
    });
  } catch (err) {
    next(err);
  }
});

// --- FILE UPLOADS WITH MAGIC-BYTE VALIDATION ---
router.post('/upload/project-image', uploadProjectImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  if (!validateMagicBytes(req.file.path, 'image')) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid image file content.' });
  }
  res.json({ url: `/uploads/projects/${req.file.filename}`, filename: req.file.filename });
});

router.post('/upload/client-logo', uploadClientLogo.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No logo file provided.' });
  if (!validateMagicBytes(req.file.path, 'image')) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid image file content.' });
  }
  res.json({ url: `/uploads/clients/${req.file.filename}`, filename: req.file.filename });
});

// --- PROJECTS CRUD ---
router.get('/projects', async (_req, res, next) => {
  try {
    res.json({ projects: await db.listProjects(false) });
  } catch (err) {
    next(err);
  }
});

router.post('/projects', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || String(body.title).trim().length < 2) {
      return res.status(400).json({ error: 'Project title is required.' });
    }
    const existing = await db.listProjects(false);
    const baseSlug = db.slugify(body.slug || body.title);
    const slugTaken = existing.some((p) => p.slug === baseSlug);
    const now = new Date().toISOString();

    const item = {
      id: db.uid('prj'),
      slug: slugTaken ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug,
      title: String(body.title).trim(),
      type: String(body.type || 'Portfolio Project').trim(),
      category: String(body.category || 'Web & SaaS').trim(),
      clientName: String(body.clientName || '').trim(),
      year: String(body.year || new Date().getFullYear()).trim(),
      summary: String(body.summary || '').trim(),
      challenge: String(body.challenge || '').trim(),
      solution: String(body.solution || '').trim(),
      impact: String(body.impact || '').trim(),
      techStack: parseList(body.techStack),
      metrics: Array.isArray(body.metrics)
        ? body.metrics
            .filter((m) => m && m.label && m.value)
            .map((m) => ({ label: String(m.label).trim(), value: String(m.value).trim() }))
        : [],
      coverImage: String(body.coverImage || '').trim(),
      liveUrl: String(body.liveUrl || '').trim(),
      featured: Boolean(body.featured),
      published: body.published !== false,
      order: Number(body.order) || existing.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    const project = await db.createProject(item);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

router.put('/projects/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const updated = await db.updateProject(req.params.id, (prev) => ({
      ...prev,
      title: body.title !== undefined ? String(body.title).trim() : prev.title,
      slug: body.slug !== undefined ? db.slugify(body.slug) : prev.slug,
      type: body.type !== undefined ? String(body.type).trim() : prev.type,
      category: body.category !== undefined ? String(body.category).trim() : prev.category,
      clientName: body.clientName !== undefined ? String(body.clientName).trim() : prev.clientName,
      year: body.year !== undefined ? String(body.year).trim() : prev.year,
      summary: body.summary !== undefined ? String(body.summary).trim() : prev.summary,
      challenge: body.challenge !== undefined ? String(body.challenge).trim() : prev.challenge,
      solution: body.solution !== undefined ? String(body.solution).trim() : prev.solution,
      impact: body.impact !== undefined ? String(body.impact).trim() : prev.impact,
      techStack: body.techStack !== undefined ? parseList(body.techStack) : prev.techStack,
      metrics:
        body.metrics !== undefined && Array.isArray(body.metrics)
          ? body.metrics
              .filter((m) => m && m.label && m.value)
              .map((m) => ({ label: String(m.label).trim(), value: String(m.value).trim() }))
          : prev.metrics,
      coverImage: body.coverImage !== undefined ? String(body.coverImage).trim() : prev.coverImage,
      liveUrl: body.liveUrl !== undefined ? String(body.liveUrl).trim() : prev.liveUrl,
      featured: body.featured !== undefined ? Boolean(body.featured) : prev.featured,
      published: body.published !== undefined ? Boolean(body.published) : prev.published,
      order: body.order !== undefined ? Number(body.order) : prev.order,
      updatedAt: new Date().toISOString(),
    }));

    if (!updated) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/projects/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteProject(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Project not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- CLIENTS CRUD ---
router.get('/clients', async (_req, res, next) => {
  try {
    res.json({ clients: await db.listClients() });
  } catch (err) {
    next(err);
  }
});

router.post('/clients', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.name || String(body.name).trim().length < 2) {
      return res.status(400).json({ error: 'Client name is required.' });
    }
    const existing = await db.listClients();
    const client = await db.createClient({
      id: db.uid('cli'),
      name: String(body.name).trim(),
      industry: String(body.industry || 'Technology').trim(),
      website: String(body.website || '').trim(),
      logoUrl: String(body.logoUrl || '').trim(),
      featured: body.featured !== false,
      quote: String(body.quote || '').trim(),
      authorName: String(body.authorName || '').trim(),
      authorRole: String(body.authorRole || '').trim(),
      impactMetric: String(body.impactMetric || '').trim(),
      order: Number(body.order) || existing.length + 1,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
});

router.put('/clients/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const updated = await db.updateClient(req.params.id, (prev) => ({
      ...prev,
      name: body.name !== undefined ? String(body.name).trim() : prev.name,
      industry: body.industry !== undefined ? String(body.industry).trim() : prev.industry,
      website: body.website !== undefined ? String(body.website).trim() : prev.website,
      logoUrl: body.logoUrl !== undefined ? String(body.logoUrl).trim() : prev.logoUrl,
      featured: body.featured !== undefined ? Boolean(body.featured) : prev.featured,
      quote: body.quote !== undefined ? String(body.quote).trim() : prev.quote,
      authorName: body.authorName !== undefined ? String(body.authorName).trim() : prev.authorName,
      authorRole: body.authorRole !== undefined ? String(body.authorRole).trim() : prev.authorRole,
      impactMetric: body.impactMetric !== undefined ? String(body.impactMetric).trim() : prev.impactMetric,
      order: body.order !== undefined ? Number(body.order) : prev.order,
    }));
    if (!updated) return res.status(404).json({ error: 'Client not found.' });
    res.json({ client: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/clients/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteClient(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Client not found.' });
    safeUnlinkUpload(removed.logoUrl);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- JOBS CRUD ---
router.get('/jobs', async (_req, res, next) => {
  try {
    res.json({ jobs: await db.listJobs(false) });
  } catch (err) {
    next(err);
  }
});

router.post('/jobs', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || String(body.title).trim().length < 2) {
      return res.status(400).json({ error: 'Job title is required.' });
    }
    const now = new Date().toISOString();
    const job = await db.createJob({
      id: db.uid('job'),
      title: String(body.title).trim(),
      department: String(body.department || 'Engineering').trim(),
      location: String(body.location || 'Kandy, Sri Lanka').trim(),
      workMode: String(body.workMode || 'Hybrid').trim(),
      employmentType: String(body.employmentType || 'Full-time').trim(),
      experience: String(body.experience || '2+ Years').trim(),
      salaryRange: String(body.salaryRange || 'Competitive').trim(),
      summary: String(body.summary || '').trim(),
      responsibilities: parseLines(body.responsibilities),
      requirements: parseLines(body.requirements),
      techStack: parseList(body.techStack),
      status: ['open', 'paused', 'closed'].includes(body.status) ? body.status : 'open',
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

router.put('/jobs/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const updated = await db.updateJob(req.params.id, (prev) => ({
      ...prev,
      title: body.title !== undefined ? String(body.title).trim() : prev.title,
      department: body.department !== undefined ? String(body.department).trim() : prev.department,
      location: body.location !== undefined ? String(body.location).trim() : prev.location,
      workMode: body.workMode !== undefined ? String(body.workMode).trim() : prev.workMode,
      employmentType: body.employmentType !== undefined ? String(body.employmentType).trim() : prev.employmentType,
      experience: body.experience !== undefined ? String(body.experience).trim() : prev.experience,
      salaryRange: body.salaryRange !== undefined ? String(body.salaryRange).trim() : prev.salaryRange,
      summary: body.summary !== undefined ? String(body.summary).trim() : prev.summary,
      responsibilities: body.responsibilities !== undefined ? parseLines(body.responsibilities) : prev.responsibilities,
      requirements: body.requirements !== undefined ? parseLines(body.requirements) : prev.requirements,
      techStack: body.techStack !== undefined ? parseList(body.techStack) : prev.techStack,
      status: ['open', 'paused', 'closed'].includes(body.status) ? body.status : prev.status,
      updatedAt: new Date().toISOString(),
    }));
    if (!updated) return res.status(404).json({ error: 'Job not found.' });
    res.json({ job: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteJob(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Job not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- APPLICATIONS ---
router.get('/applications', async (_req, res, next) => {
  try {
    res.json({ applications: await db.listApplications() });
  } catch (err) {
    next(err);
  }
});

router.patch('/applications/:id', async (req, res, next) => {
  try {
    const { status, notes } = req.body || {};
    const updated = await db.updateApplication(req.params.id, (prev) => ({
      ...prev,
      status:
        status && ['new', 'reviewing', 'shortlisted', 'interview', 'rejected'].includes(status)
          ? status
          : prev.status,
      notes: notes !== undefined ? String(notes) : prev.notes,
    }));
    if (!updated) return res.status(404).json({ error: 'Application not found.' });
    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/applications/:id/resume', async (req, res, next) => {
  try {
    const app = await db.getApplicationById(req.params.id);
    if (!app || !app.resumeFile) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const safeName = path.basename(app.resumeFile);
    const fullPath = path.join(config.UPLOADS_DIR, 'resumes', safeName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Resume file missing on disk.' });
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(fullPath, app.resumeOriginalName || safeName);
  } catch (err) {
    next(err);
  }
});

router.delete('/applications/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteApplication(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Application not found.' });
    if (removed.resumeFile) {
      const fullPath = path.join(config.UPLOADS_DIR, 'resumes', path.basename(removed.resumeFile));
      try {
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch {}
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- INQUIRIES ---
router.get('/inquiries', async (_req, res, next) => {
  try {
    res.json({ inquiries: await db.listInquiries() });
  } catch (err) {
    next(err);
  }
});

router.patch('/inquiries/:id', async (req, res, next) => {
  try {
    const { status, read, notes } = req.body || {};
    const updated = await db.updateInquiry(req.params.id, (prev) => ({
      ...prev,
      status:
        status && ['new', 'contacted', 'in_discussion', 'archived'].includes(status)
          ? status
          : prev.status,
      read: read !== undefined ? Boolean(read) : prev.read,
      notes: notes !== undefined ? String(notes) : prev.notes,
    }));
    if (!updated) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json({ inquiry: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/inquiries/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteInquiry(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- SETTINGS, AUDIT LOGS & SECURITY ---
router.get('/settings', async (_req, res, next) => {
  try {
    const [settings, admin, auditLogs] = await Promise.all([
      db.getSettings(),
      db.getAdmin(),
      db.listAuditLogs(20),
    ]);
    const safeSmtp = settings.smtp
      ? { ...settings.smtp, pass: settings.smtp.pass ? '••••••••' : '' }
      : {};
    res.json({
      settings: { ...settings, smtp: safeSmtp },
      admin: { email: admin.email, name: admin.name },
      storageEngine: db.engine,
      adminPath: config.ADMIN_PATH,
      auditLogs,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const body = req.body || {};
    const prev = await db.getSettings();
    const nextSmtp = { ...(prev.smtp || {}) };
    if (body.smtp && typeof body.smtp === 'object') {
      if (body.smtp.host !== undefined) nextSmtp.host = String(body.smtp.host).trim();
      if (body.smtp.port !== undefined) nextSmtp.port = Number(body.smtp.port) || 587;
      if (body.smtp.secure !== undefined) nextSmtp.secure = Boolean(body.smtp.secure);
      if (body.smtp.user !== undefined) nextSmtp.user = String(body.smtp.user).trim();
      if (body.smtp.pass !== undefined && body.smtp.pass !== '••••••••') {
        nextSmtp.pass = String(body.smtp.pass);
      }
      if (body.smtp.from !== undefined) nextSmtp.from = String(body.smtp.from).trim();
      if (body.smtp.notifyEmail !== undefined) nextSmtp.notifyEmail = String(body.smtp.notifyEmail).trim();
    }

    const updated = await db.updateSettings({
      ...prev,
      companyName: body.companyName !== undefined ? String(body.companyName).trim() : prev.companyName,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : prev.tagline,
      email: body.email !== undefined ? String(body.email).trim() : prev.email,
      careersEmail: body.careersEmail !== undefined ? String(body.careersEmail).trim() : prev.careersEmail,
      phone: body.phone !== undefined ? String(body.phone).trim() : prev.phone,
      whatsapp: body.whatsapp !== undefined ? String(body.whatsapp).trim() : prev.whatsapp,
      address: body.address !== undefined ? String(body.address).trim() : prev.address,
      globalReach: body.globalReach !== undefined ? String(body.globalReach).trim() : prev.globalReach,
      facebook: body.facebook !== undefined ? String(body.facebook).trim() : prev.facebook,
      instagram: body.instagram !== undefined ? String(body.instagram).trim() : prev.instagram,
      linkedin: body.linkedin !== undefined ? String(body.linkedin).trim() : prev.linkedin,
      github: body.github !== undefined ? String(body.github).trim() : prev.github,
      x: body.x !== undefined ? String(body.x).trim() : prev.x,
      stats: Array.isArray(body.stats) ? body.stats : prev.stats,
      smtp: nextSmtp,
    });

    res.json({
      ok: true,
      settings: { ...updated, smtp: { ...updated.smtp, pass: updated.smtp?.pass ? '••••••••' : '' } },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword, newEmail, newName } = req.body || {};
    const admin = await db.getAdmin();

    if (!currentPassword || !verifyPassword(currentPassword, admin.passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword && String(newPassword).length < 10) {
      return res.status(400).json({ error: 'New password must be at least 10 characters.' });
    }

    const patch = {};
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(newEmail).trim())) {
      patch.email = String(newEmail).trim().toLowerCase();
    }
    if (newName && String(newName).trim()) {
      patch.name = String(newName).trim();
    }
    if (newPassword) {
      patch.passwordHash = hashPassword(newPassword);
    }

    const refreshed = await db.updateAdmin(patch);
    await db.addAuditLog({
      id: db.uid('aud'),
      eventType: 'CREDENTIALS_UPDATED',
      actor: refreshed.email,
      ipAddress: getClientIp(req),
      detail: newPassword ? 'Admin password/profile updated' : 'Admin profile updated',
      createdAt: new Date().toISOString(),
    });

    const token = signToken({ email: refreshed.email, name: refreshed.name, role: 'admin' });
    setAuthCookie(res, token);

    res.json({
      ok: true,
      token,
      admin: { email: refreshed.email, name: refreshed.name },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/backup', async (_req, res, next) => {
  try {
    const snapshot = await db.exportSnapshot();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fusionlabz-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
