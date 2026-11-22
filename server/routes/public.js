const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { uploadResume } = require('../upload');
const { sendNotification } = require('../mailer');
const { validateMagicBytes } = require('../security');

const router = express.Router();

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again in a few minutes.' },
});

function sanitizeSettings(settings) {
  if (!settings) return {};
  const { smtp, ...publicSettings } = settings;
  return publicSettings;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/bootstrap', async (_req, res, next) => {
  try {
    const [settings, projects, clients, jobs] = await Promise.all([
      db.getSettings(),
      db.listProjects(true),
      db.listClients(),
      db.listJobs(true),
    ]);

    res.json({
      settings: sanitizeSettings(settings),
      projects,
      clients,
      jobs,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/projects', async (req, res, next) => {
  try {
    const { category, type, featured } = req.query;
    let items = await db.listProjects(true);
    if (category && category !== 'All') items = items.filter((p) => p.category === category);
    if (type && type !== 'All') items = items.filter((p) => p.type === type);
    if (featured === 'true') items = items.filter((p) => p.featured);
    res.json({ projects: items });
  } catch (err) {
    next(err);
  }
});

router.get('/projects/:slug', async (req, res, next) => {
  try {
    const project = await db.getProjectBySlug(req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

router.get('/clients', async (_req, res, next) => {
  try {
    res.json({ clients: await db.listClients() });
  } catch (err) {
    next(err);
  }
});

router.get('/jobs', async (_req, res, next) => {
  try {
    res.json({ jobs: await db.listJobs(true) });
  } catch (err) {
    next(err);
  }
});

router.post('/contact', submissionLimiter, async (req, res) => {
  try {
    const { fullName, email, company, phone, services, budget, timeline, message, website } = req.body || {};

    if (website) {
      return res.status(200).json({ ok: true, ticketId: 'FLZ-0000' });
    }

    if (!fullName || String(fullName).trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    const emailClean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ error: 'Please tell us briefly about your project (at least 10 characters).' });
    }

    const ticketId = `FLZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const inquiry = {
      id: db.uid('inq'),
      ticketId,
      fullName: String(fullName).trim().slice(0, 120),
      email: emailClean.slice(0, 160),
      company: String(company || '').trim().slice(0, 120),
      phone: String(phone || '').trim().slice(0, 40),
      services: Array.isArray(services)
        ? services.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
        : [],
      budget: String(budget || 'To be discussed').trim().slice(0, 60),
      timeline: String(timeline || 'Flexible').trim().slice(0, 60),
      message: String(message).trim().slice(0, 4000),
      status: 'new',
      read: false,
      notes: '',
      createdAt: new Date().toISOString(),
    };

    await db.createInquiry(inquiry);

    sendNotification({
      subject: `[FusionLabz Inquiry ${ticketId}] ${inquiry.fullName}`,
      replyTo: inquiry.email,
      html: `
        <div style="font-family:sans-serif;background:#f8fbff;color:#09152b;padding:24px;border-radius:12px;">
          <h2 style="color:#0052ff;margin-top:0;">New Project Inquiry (${escapeHtml(ticketId)})</h2>
          <p><strong>Name:</strong> ${escapeHtml(inquiry.fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(inquiry.company || 'N/A')}</p>
          <p><strong>Phone:</strong> ${escapeHtml(inquiry.phone || 'N/A')}</p>
          <p><strong>Services:</strong> ${escapeHtml(inquiry.services.join(', ') || 'General')}</p>
          <p><strong>Budget / Timeline:</strong> ${escapeHtml(inquiry.budget)} | ${escapeHtml(inquiry.timeline)}</p>
          <hr style="border-color:#dce8fa;" />
          <p style="white-space:pre-wrap;">${escapeHtml(inquiry.message)}</p>
        </div>
      `,
    }).catch(() => {});

    res.status(201).json({
      ok: true,
      ticketId,
      message: 'Your inquiry has been received. Our team will respond within 24 hours.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to submit inquiry.' });
  }
});

router.post('/careers/apply', submissionLimiter, uploadResume.single('resume'), async (req, res) => {
  try {
    const { jobId, fullName, email, phone, portfolioUrl, experienceYears, coverNote, website } = req.body || {};

    if (website) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(200).json({ ok: true, applicationId: 'app_ok' });
    }

    // Verify magic bytes on uploaded resume to prevent disguised payloads
    if (req.file?.path) {
      const validSig = validateMagicBytes(req.file.path, 'resume');
      if (!validSig) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'Invalid resume file signature. Please upload a valid PDF, DOC, or DOCX document.',
        });
      }
    }

    if (!fullName || String(fullName).trim().length < 2) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    const emailClean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    let resolvedJobId = 'general';
    let resolvedJobTitle = 'General Application';

    if (jobId && jobId !== 'general') {
      const matched = await db.getJobById(jobId);
      if (matched) {
        resolvedJobId = matched.id;
        resolvedJobTitle = matched.title;
      }
    }

    const application = {
      id: db.uid('app'),
      jobId: resolvedJobId,
      jobTitle: resolvedJobTitle,
      fullName: String(fullName).trim().slice(0, 120),
      email: emailClean.slice(0, 160),
      phone: String(phone || '').trim().slice(0, 40),
      portfolioUrl: String(portfolioUrl || '').trim().slice(0, 300),
      experienceYears: String(experienceYears || '').trim().slice(0, 40),
      coverNote: String(coverNote || '').trim().slice(0, 4000),
      resumeFile: req.file ? req.file.filename : '',
      resumeOriginalName: req.file ? req.file.originalname : '',
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
    };

    await db.createApplication(application);

    sendNotification({
      subject: `[FusionLabz Careers] ${application.fullName} — ${application.jobTitle}`,
      replyTo: application.email,
      html: `
        <div style="font-family:sans-serif;background:#f8fbff;color:#09152b;padding:24px;border-radius:12px;">
          <h2 style="color:#0052ff;margin-top:0;">New Candidate Application</h2>
          <p><strong>Role:</strong> ${escapeHtml(application.jobTitle)}</p>
          <p><strong>Candidate:</strong> ${escapeHtml(application.fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(application.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(application.phone || 'N/A')}</p>
          <p><strong>Experience:</strong> ${escapeHtml(application.experienceYears || 'N/A')}</p>
          <p><strong>Portfolio / LinkedIn:</strong> ${escapeHtml(application.portfolioUrl || 'N/A')}</p>
          <p><strong>Resume:</strong> ${application.resumeFile ? escapeHtml(application.resumeOriginalName) : 'None'}</p>
          <hr style="border-color:#dce8fa;" />
          <p style="white-space:pre-wrap;">${escapeHtml(application.coverNote || 'No note provided.')}</p>
        </div>
      `,
    }).catch(() => {});

    res.status(201).json({
      ok: true,
      applicationId: application.id,
      message: 'Application submitted successfully.',
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message || 'Unable to submit application.' });
  }
});

module.exports = router;
