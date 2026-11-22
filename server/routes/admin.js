const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { getDb, mutateDb, uid, slugify } = require('../db');
const {
  verifyPassword,
  hashPassword,
  signToken,
  requireAdmin,
  setAuthCookie,
  clearAuthCookie,
} = require('../auth');
const { uploadProjectImage, uploadClientLogo } = require('../upload');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
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
    // ignore file deletion errors
  }
}

// --- AUTH ---
router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const db = getDb();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (cleanEmail !== db.admin.email.toLowerCase() || !verifyPassword(password, db.admin.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = signToken({ email: db.admin.email, name: db.admin.name, role: 'admin' });
  setAuthCookie(res, token);

  res.json({
    ok: true,
    token,
    admin: { email: db.admin.email, name: db.admin.name },
  });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  const db = getDb();
  res.json({
    admin: { email: db.admin.email, name: db.admin.name },
  });
});

// Protect all subsequent admin routes
router.use(requireAdmin);

// --- DASHBOARD ---
router.get('/dashboard', (_req, res) => {
  const db = getDb();
  res.json({
    counts: {
      projects: db.projects.length,
      publishedProjects: db.projects.filter((p) => p.published !== false).length,
      clients: db.clients.length,
      jobs: db.jobs.length,
      openJobs: db.jobs.filter((j) => j.status === 'open').length,
      applications: db.applications.length,
      newApplications: db.applications.filter((a) => a.status === 'new').length,
      inquiries: db.inquiries.length,
      unreadInquiries: db.inquiries.filter((i) => !i.read || i.status === 'new').length,
    },
    recentApplications: db.applications.slice(0, 6),
    recentInquiries: db.inquiries.slice(0, 6),
  });
});

// --- FILE UPLOADS ---
router.post('/upload/project-image', uploadProjectImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  res.json({ url: `/uploads/projects/${req.file.filename}`, filename: req.file.filename });
});

router.post('/upload/client-logo', uploadClientLogo.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No logo file provided.' });
  res.json({ url: `/uploads/clients/${req.file.filename}`, filename: req.file.filename });
});

// --- PROJECTS / PORTFOLIO CRUD ---
router.get('/projects', (_req, res) => {
  const db = getDb();
  const projects = [...db.projects].sort((a, b) => (a.order || 999) - (b.order || 999));
  res.json({ projects });
});

router.post('/projects', async (req, res) => {
  const body = req.body || {};
  if (!body.title || String(body.title).trim().length < 2) {
    return res.status(400).json({ error: 'Project title is required.' });
  }
  const now = new Date().toISOString();
  const project = await mutateDb((db) => {
    const baseSlug = slugify(body.slug || body.title);
    const exists = db.projects.some((p) => p.slug === baseSlug);
    const item = {
      id: uid('prj'),
      slug: exists ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug,
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
      order: Number(body.order) || db.projects.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(item);
    return item;
  });
  res.status(201).json({ project });
});

router.put('/projects/:id', async (req, res) => {
  const body = req.body || {};
  const updated = await mutateDb((db) => {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return null;
    const prev = db.projects[idx];
    const next = {
      ...prev,
      title: body.title !== undefined ? String(body.title).trim() : prev.title,
      slug: body.slug !== undefined ? slugify(body.slug) : prev.slug,
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
    };
    db.projects[idx] = next;
    return next;
  });

  if (!updated) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project: updated });
});

router.delete('/projects/:id', async (req, res) => {
  const removed = await mutateDb((db) => {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return null;
    const [deleted] = db.projects.splice(idx, 1);
    return deleted;
  });
  if (!removed) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
});

// --- CLIENTS CRUD ---
router.get('/clients', (_req, res) => {
  const db = getDb();
  const clients = [...db.clients].sort((a, b) => (a.order || 999) - (b.order || 999));
  res.json({ clients });
});

router.post('/clients', async (req, res) => {
  const body = req.body || {};
  if (!body.name || String(body.name).trim().length < 2) {
    return res.status(400).json({ error: 'Client name is required.' });
  }
  const client = await mutateDb((db) => {
    const item = {
      id: uid('cli'),
      name: String(body.name).trim(),
      industry: String(body.industry || 'Technology').trim(),
      website: String(body.website || '').trim(),
      logoUrl: String(body.logoUrl || '').trim(),
      featured: body.featured !== false,
      quote: String(body.quote || '').trim(),
      authorName: String(body.authorName || '').trim(),
      authorRole: String(body.authorRole || '').trim(),
      impactMetric: String(body.impactMetric || '').trim(),
      order: Number(body.order) || db.clients.length + 1,
      createdAt: new Date().toISOString(),
    };
    db.clients.push(item);
    return item;
  });
  res.status(201).json({ client });
});

router.put('/clients/:id', async (req, res) => {
  const body = req.body || {};
  const updated = await mutateDb((db) => {
    const idx = db.clients.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return null;
    const prev = db.clients[idx];
    const next = {
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
    };
    db.clients[idx] = next;
    return next;
  });
  if (!updated) return res.status(404).json({ error: 'Client not found.' });
  res.json({ client: updated });
});

router.delete('/clients/:id', async (req, res) => {
  const removed = await mutateDb((db) => {
    const idx = db.clients.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return null;
    const [deleted] = db.clients.splice(idx, 1);
    return deleted;
  });
  if (!removed) return res.status(404).json({ error: 'Client not found.' });
  safeUnlinkUpload(removed.logoUrl);
  res.json({ ok: true });
});

// --- JOBS / CAREERS CRUD ---
router.get('/jobs', (_req, res) => {
  const db = getDb();
  const jobs = [...db.jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ jobs });
});

router.post('/jobs', async (req, res) => {
  const body = req.body || {};
  if (!body.title || String(body.title).trim().length < 2) {
    return res.status(400).json({ error: 'Job title is required.' });
  }
  const now = new Date().toISOString();
  const job = await mutateDb((db) => {
    const item = {
      id: uid('job'),
      title: String(body.title).trim(),
      department: String(body.department || 'Engineering').trim(),
      location: String(body.location || 'Colombo, Sri Lanka').trim(),
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
    };
    db.jobs.unshift(item);
    return item;
  });
  res.status(201).json({ job });
});

router.put('/jobs/:id', async (req, res) => {
  const body = req.body || {};
  const updated = await mutateDb((db) => {
    const idx = db.jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return null;
    const prev = db.jobs[idx];
    const next = {
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
    };
    db.jobs[idx] = next;
    return next;
  });
  if (!updated) return res.status(404).json({ error: 'Job not found.' });
  res.json({ job: updated });
});

router.delete('/jobs/:id', async (req, res) => {
  const removed = await mutateDb((db) => {
    const idx = db.jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return null;
    const [deleted] = db.jobs.splice(idx, 1);
    return deleted;
  });
  if (!removed) return res.status(404).json({ error: 'Job not found.' });
  res.json({ ok: true });
});

// --- APPLICATIONS ---
router.get('/applications', (_req, res) => {
  const db = getDb();
  res.json({ applications: db.applications });
});

router.patch('/applications/:id', async (req, res) => {
  const { status, notes } = req.body || {};
  const updated = await mutateDb((db) => {
    const item = db.applications.find((a) => a.id === req.params.id);
    if (!item) return null;
    if (status && ['new', 'reviewing', 'shortlisted', 'interview', 'rejected'].includes(status)) {
      item.status = status;
    }
    if (notes !== undefined) item.notes = String(notes);
    return item;
  });
  if (!updated) return res.status(404).json({ error: 'Application not found.' });
  res.json({ application: updated });
});

router.get('/applications/:id/resume', (req, res) => {
  const db = getDb();
  const app = db.applications.find((a) => a.id === req.params.id);
  if (!app || !app.resumeFile) {
    return res.status(404).json({ error: 'Resume not found.' });
  }
  const safeName = path.basename(app.resumeFile);
  const fullPath = path.join(config.UPLOADS_DIR, 'resumes', safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Resume file missing on disk.' });
  }
  res.download(fullPath, app.resumeOriginalName || safeName);
});

router.delete('/applications/:id', async (req, res) => {
  const removed = await mutateDb((db) => {
    const idx = db.applications.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return null;
    const [deleted] = db.applications.splice(idx, 1);
    return deleted;
  });
  if (!removed) return res.status(404).json({ error: 'Application not found.' });
  if (removed.resumeFile) {
    const fullPath = path.join(config.UPLOADS_DIR, 'resumes', path.basename(removed.resumeFile));
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      // ignore
    }
  }
  res.json({ ok: true });
});

// --- INQUIRIES ---
router.get('/inquiries', (_req, res) => {
  const db = getDb();
  res.json({ inquiries: db.inquiries });
});

router.patch('/inquiries/:id', async (req, res) => {
  const { status, read, notes } = req.body || {};
  const updated = await mutateDb((db) => {
    const item = db.inquiries.find((i) => i.id === req.params.id);
    if (!item) return null;
    if (status && ['new', 'contacted', 'in_discussion', 'archived'].includes(status)) {
      item.status = status;
    }
    if (read !== undefined) item.read = Boolean(read);
    if (notes !== undefined) item.notes = String(notes);
    return item;
  });
  if (!updated) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ inquiry: updated });
});

router.delete('/inquiries/:id', async (req, res) => {
  const removed = await mutateDb((db) => {
    const idx = db.inquiries.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return null;
    const [deleted] = db.inquiries.splice(idx, 1);
    return deleted;
  });
  if (!removed) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ ok: true });
});

// --- SETTINGS & SECURITY ---
router.get('/settings', (_req, res) => {
  const db = getDb();
  const safeSmtp = db.settings.smtp
    ? { ...db.settings.smtp, pass: db.settings.smtp.pass ? '••••••••' : '' }
    : {};
  res.json({
    settings: { ...db.settings, smtp: safeSmtp },
    admin: { email: db.admin.email, name: db.admin.name },
  });
});

router.put('/settings', async (req, res) => {
  const body = req.body || {};
  const updated = await mutateDb((db) => {
    const prev = db.settings;
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

    db.settings = {
      ...prev,
      companyName: body.companyName !== undefined ? String(body.companyName).trim() : prev.companyName,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : prev.tagline,
      email: body.email !== undefined ? String(body.email).trim() : prev.email,
      careersEmail: body.careersEmail !== undefined ? String(body.careersEmail).trim() : prev.careersEmail,
      phone: body.phone !== undefined ? String(body.phone).trim() : prev.phone,
      whatsapp: body.whatsapp !== undefined ? String(body.whatsapp).trim() : prev.whatsapp,
      address: body.address !== undefined ? String(body.address).trim() : prev.address,
      globalReach: body.globalReach !== undefined ? String(body.globalReach).trim() : prev.globalReach,
      linkedin: body.linkedin !== undefined ? String(body.linkedin).trim() : prev.linkedin,
      github: body.github !== undefined ? String(body.github).trim() : prev.github,
      x: body.x !== undefined ? String(body.x).trim() : prev.x,
      instagram: body.instagram !== undefined ? String(body.instagram).trim() : prev.instagram,
      stats: Array.isArray(body.stats) ? body.stats : prev.stats,
      smtp: nextSmtp,
    };
    return db.settings;
  });
  res.json({ ok: true, settings: { ...updated, smtp: { ...updated.smtp, pass: updated.smtp?.pass ? '••••••••' : '' } } });
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword, newEmail, newName } = req.body || {};
  const db = getDb();

  if (!currentPassword || !verifyPassword(currentPassword, db.admin.passwordHash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (newPassword && String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  await mutateDb((store) => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(newEmail).trim())) {
      store.admin.email = String(newEmail).trim().toLowerCase();
    }
    if (newName && String(newName).trim()) {
      store.admin.name = String(newName).trim();
    }
    if (newPassword) {
      store.admin.passwordHash = hashPassword(newPassword);
    }
    store.admin.updatedAt = new Date().toISOString();
  });

  const refreshed = getDb();
  const token = signToken({ email: refreshed.admin.email, name: refreshed.admin.name, role: 'admin' });
  setAuthCookie(res, token);

  res.json({
    ok: true,
    token,
    admin: { email: refreshed.admin.email, name: refreshed.admin.name },
  });
});

router.get('/backup', (_req, res) => {
  const db = getDb();
  const sanitized = {
    ...db,
    admin: { email: db.admin.email, name: db.admin.name },
    settings: { ...db.settings, smtp: { ...db.settings.smtp, pass: '' } },
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="fusionlabz-backup-${Date.now()}.json"`);
  res.send(JSON.stringify(sanitized, null, 2));
});

module.exports = router;
