const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');
const { createSeedData } = require('./seed');

let pool = null;

function parseJsonCol(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapProject(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    category: row.category,
    clientName: row.client_name || '',
    year: row.year || '',
    summary: row.summary || '',
    challenge: row.challenge || '',
    solution: row.solution || '',
    impact: row.impact || '',
    techStack: parseJsonCol(row.tech_stack, []),
    metrics: parseJsonCol(row.metrics, []),
    coverImage: row.cover_image || '',
    liveUrl: row.live_url || '',
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    order: row.sort_order ?? 999,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClient(row) {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    featured: Boolean(row.featured),
    quote: row.quote || '',
    authorName: row.author_name || '',
    authorRole: row.author_role || '',
    impactMetric: row.impact_metric || '',
    order: row.sort_order ?? 999,
    createdAt: row.created_at,
  };
}

function mapJob(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department || '',
    location: row.location || '',
    workMode: row.work_mode || '',
    employmentType: row.employment_type || '',
    experience: row.experience || '',
    salaryRange: row.salary_range || '',
    summary: row.summary || '',
    responsibilities: parseJsonCol(row.responsibilities, []),
    requirements: parseJsonCol(row.requirements, []),
    techStack: parseJsonCol(row.tech_stack, []),
    status: row.status || 'open',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || '',
    portfolioUrl: row.portfolio_url || '',
    experienceYears: row.experience_years || '',
    coverNote: row.cover_note || '',
    resumeFile: row.resume_file || '',
    resumeOriginalName: row.resume_original_name || '',
    status: row.status || 'new',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function mapInquiry(row) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    fullName: row.full_name,
    email: row.email,
    company: row.company || '',
    phone: row.phone || '',
    services: parseJsonCol(row.services, []),
    budget: row.budget || '',
    timeline: row.timeline || '',
    message: row.message || '',
    status: row.status || 'new',
    read: Boolean(row.is_read),
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

const adapter = {
  engine: 'mysql',

  async init() {
    pool = mysql.createPool({
      host: config.MYSQL_CONFIG.host,
      port: config.MYSQL_CONFIG.port,
      database: config.MYSQL_CONFIG.database,
      user: config.MYSQL_CONFIG.user,
      password: config.MYSQL_CONFIG.password,
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      multipleStatements: true,
    });

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);

    // Seed initial FusionLabz data only if admin_users table is empty
    const [admins] = await pool.query('SELECT id FROM admin_users LIMIT 1');
    if (admins.length === 0) {
      const seed = createSeedData();
      await pool.query(
        'INSERT INTO admin_users (id, email, name, password_hash, updated_at) VALUES (1, ?, ?, ?, ?)',
        [seed.admin.email, seed.admin.name, seed.admin.passwordHash, seed.admin.updatedAt]
      );
      await pool.query(
        'INSERT INTO site_settings (id, payload, updated_at) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)',
        [JSON.stringify(seed.settings), seed.meta.updatedAt]
      );
      for (const p of seed.projects) await adapter.createProject(p);
      for (const c of seed.clients) await adapter.createClient(c);
      for (const j of seed.jobs) await adapter.createJob(j);
      console.log('  [FusionLabz DB] MySQL schema initialized and seeded.');
    }
  },

  async getAdmin() {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE id = 1 LIMIT 1');
    if (!rows[0]) return null;
    return {
      email: rows[0].email,
      name: rows[0].name,
      passwordHash: rows[0].password_hash,
      updatedAt: rows[0].updated_at,
    };
  },

  async updateAdmin(patch) {
    const prev = await adapter.getAdmin();
    const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    await pool.query(
      'UPDATE admin_users SET email = ?, name = ?, password_hash = ?, updated_at = ? WHERE id = 1',
      [next.email, next.name, next.passwordHash, next.updatedAt]
    );
    return next;
  },

  async getSettings() {
    const [rows] = await pool.query('SELECT payload FROM site_settings WHERE id = 1 LIMIT 1');
    return rows[0] ? parseJsonCol(rows[0].payload, {}) : createSeedData().settings;
  },

  async updateSettings(nextSettings) {
    await pool.query(
      'INSERT INTO site_settings (id, payload, updated_at) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)',
      [JSON.stringify(nextSettings), new Date().toISOString()]
    );
    return nextSettings;
  },

  async listProjects(onlyPublished = false) {
    const sql = onlyPublished
      ? 'SELECT * FROM projects WHERE published = 1 ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await pool.query(sql);
    return rows.map(mapProject);
  },

  async getProjectBySlug(slugOrId) {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE (slug = ? OR id = ?) AND published = 1 LIMIT 1',
      [slugOrId, slugOrId]
    );
    return rows[0] ? mapProject(rows[0]) : null;
  },

  async createProject(p) {
    await pool.query(
      `INSERT INTO projects (id, slug, title, type, category, client_name, year, summary, challenge, solution, impact, tech_stack, metrics, cover_image, live_url, featured, published, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.slug, p.title, p.type, p.category, p.clientName || '', p.year || '',
        p.summary || '', p.challenge || '', p.solution || '', p.impact || '',
        JSON.stringify(p.techStack || []), JSON.stringify(p.metrics || []),
        p.coverImage || '', p.liveUrl || '', p.featured ? 1 : 0, p.published !== false ? 1 : 0,
        p.order ?? 999, p.createdAt, p.updatedAt,
      ]
    );
    return p;
  },

  async updateProject(id, patchFn) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const p = patchFn(mapProject(rows[0]));
    await pool.query(
      `UPDATE projects SET slug=?, title=?, type=?, category=?, client_name=?, year=?, summary=?, challenge=?, solution=?, impact=?, tech_stack=?, metrics=?, cover_image=?, live_url=?, featured=?, published=?, sort_order=?, updated_at=? WHERE id=?`,
      [
        p.slug, p.title, p.type, p.category, p.clientName || '', p.year || '',
        p.summary || '', p.challenge || '', p.solution || '', p.impact || '',
        JSON.stringify(p.techStack || []), JSON.stringify(p.metrics || []),
        p.coverImage || '', p.liveUrl || '', p.featured ? 1 : 0, p.published !== false ? 1 : 0,
        p.order ?? 999, p.updatedAt, id,
      ]
    );
    return p;
  },

  async deleteProject(id) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return mapProject(rows[0]);
  },

  async listClients() {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY sort_order ASC, created_at DESC');
    return rows.map(mapClient);
  },

  async createClient(c) {
    await pool.query(
      `INSERT INTO clients (id, name, industry, website, logo_url, featured, quote, author_name, author_role, impact_metric, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id, c.name, c.industry || '', c.website || '', c.logoUrl || '', c.featured !== false ? 1 : 0,
        c.quote || '', c.authorName || '', c.authorRole || '', c.impactMetric || '', c.order ?? 999, c.createdAt,
      ]
    );
    return c;
  },

  async updateClient(id, patchFn) {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const c = patchFn(mapClient(rows[0]));
    await pool.query(
      `UPDATE clients SET name=?, industry=?, website=?, logo_url=?, featured=?, quote=?, author_name=?, author_role=?, impact_metric=?, sort_order=? WHERE id=?`,
      [
        c.name, c.industry || '', c.website || '', c.logoUrl || '', c.featured !== false ? 1 : 0,
        c.quote || '', c.authorName || '', c.authorRole || '', c.impactMetric || '', c.order ?? 999, id,
      ]
    );
    return c;
  },

  async deleteClient(id) {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    return mapClient(rows[0]);
  },

  async listJobs(onlyOpen = false) {
    const sql = onlyOpen
      ? "SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC"
      : 'SELECT * FROM jobs ORDER BY created_at DESC';
    const [rows] = await pool.query(sql);
    return rows.map(mapJob);
  },

  async getJobById(id) {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? mapJob(rows[0]) : null;
  },

  async createJob(j) {
    await pool.query(
      `INSERT INTO jobs (id, title, department, location, work_mode, employment_type, experience, salary_range, summary, responsibilities, requirements, tech_stack, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        j.id, j.title, j.department || '', j.location || '', j.workMode || '', j.employmentType || '',
        j.experience || '', j.salaryRange || '', j.summary || '',
        JSON.stringify(j.responsibilities || []), JSON.stringify(j.requirements || []),
        JSON.stringify(j.techStack || []), j.status || 'open', j.createdAt, j.updatedAt,
      ]
    );
    return j;
  },

  async updateJob(id, patchFn) {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const j = patchFn(mapJob(rows[0]));
    await pool.query(
      `UPDATE jobs SET title=?, department=?, location=?, work_mode=?, employment_type=?, experience=?, salary_range=?, summary=?, responsibilities=?, requirements=?, tech_stack=?, status=?, updated_at=? WHERE id=?`,
      [
        j.title, j.department || '', j.location || '', j.workMode || '', j.employmentType || '',
        j.experience || '', j.salaryRange || '', j.summary || '',
        JSON.stringify(j.responsibilities || []), JSON.stringify(j.requirements || []),
        JSON.stringify(j.techStack || []), j.status || 'open', j.updatedAt, id,
      ]
    );
    return j;
  },

  async deleteJob(id) {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);
    return mapJob(rows[0]);
  },

  async listApplications() {
    const [rows] = await pool.query('SELECT * FROM applications ORDER BY created_at DESC');
    return rows.map(mapApplication);
  },

  async getApplicationById(id) {
    const [rows] = await pool.query('SELECT * FROM applications WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? mapApplication(rows[0]) : null;
  },

  async createApplication(a) {
    await pool.query(
      `INSERT INTO applications (id, job_id, job_title, full_name, email, phone, portfolio_url, experience_years, cover_note, resume_file, resume_original_name, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id, a.jobId, a.jobTitle, a.fullName, a.email, a.phone || '', a.portfolioUrl || '',
        a.experienceYears || '', a.coverNote || '', a.resumeFile || '', a.resumeOriginalName || '',
        a.status || 'new', a.notes || '', a.createdAt,
      ]
    );
    return a;
  },

  async updateApplication(id, patchFn) {
    const [rows] = await pool.query('SELECT * FROM applications WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const a = patchFn(mapApplication(rows[0]));
    await pool.query('UPDATE applications SET status=?, notes=? WHERE id=?', [a.status, a.notes || '', id]);
    return a;
  },

  async deleteApplication(id) {
    const [rows] = await pool.query('SELECT * FROM applications WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM applications WHERE id = ?', [id]);
    return mapApplication(rows[0]);
  },

  async listInquiries() {
    const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    return rows.map(mapInquiry);
  },

  async createInquiry(i) {
    await pool.query(
      `INSERT INTO inquiries (id, ticket_id, full_name, email, company, phone, services, budget, timeline, message, status, is_read, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        i.id, i.ticketId, i.fullName, i.email, i.company || '', i.phone || '',
        JSON.stringify(i.services || []), i.budget || '', i.timeline || '', i.message || '',
        i.status || 'new', i.read ? 1 : 0, i.notes || '', i.createdAt,
      ]
    );
    return i;
  },

  async updateInquiry(id, patchFn) {
    const [rows] = await pool.query('SELECT * FROM inquiries WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const i = patchFn(mapInquiry(rows[0]));
    await pool.query('UPDATE inquiries SET status=?, is_read=?, notes=? WHERE id=?', [
      i.status, i.read ? 1 : 0, i.notes || '', id,
    ]);
    return i;
  },

  async deleteInquiry(id) {
    const [rows] = await pool.query('SELECT * FROM inquiries WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM inquiries WHERE id = ?', [id]);
    return mapInquiry(rows[0]);
  },

  async addAuditLog(entry) {
    await pool.query(
      'INSERT INTO audit_logs (id, event_type, actor, ip_address, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.id, entry.eventType, entry.actor || '', entry.ipAddress || '', entry.detail || '', entry.createdAt]
    );
    return entry;
  },

  async listAuditLogs(limit = 30) {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit]);
    return rows.map((r) => ({
      id: r.id,
      eventType: r.event_type,
      actor: r.actor,
      ipAddress: r.ip_address,
      detail: r.detail,
      createdAt: r.created_at,
    }));
  },

  async exportSnapshot() {
    const [admin, settings, projects, clients, jobs, applications, inquiries, auditLogs] =
      await Promise.all([
        adapter.getAdmin(),
        adapter.getSettings(),
        adapter.listProjects(false),
        adapter.listClients(),
        adapter.listJobs(false),
        adapter.listApplications(),
        adapter.listInquiries(),
        adapter.listAuditLogs(50),
      ]);
    return {
      engine: 'mysql',
      exportedAt: new Date().toISOString(),
      admin: admin ? { email: admin.email, name: admin.name } : null,
      settings: { ...settings, smtp: { ...(settings.smtp || {}), pass: '' } },
      projects,
      clients,
      jobs,
      applications,
      inquiries,
      auditLogs,
    };
  },
};

module.exports = adapter;
