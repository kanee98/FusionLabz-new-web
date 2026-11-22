const fs = require('fs');
const config = require('./config');
const { createSeedData } = require('./seed');

let cache = null;
let writeChain = Promise.resolve();

function persistSync(data) {
  data.meta = data.meta || {};
  data.meta.updatedAt = new Date().toISOString();
  const tmpFile = `${config.DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, config.DB_FILE);
}

function loadStore() {
  if (cache) return cache;
  if (!fs.existsSync(config.DB_FILE)) {
    cache = createSeedData();
    persistSync(cache);
    return cache;
  }
  try {
    cache = JSON.parse(fs.readFileSync(config.DB_FILE, 'utf8'));
    if (!Array.isArray(cache.auditLogs)) cache.auditLogs = [];
    return cache;
  } catch {
    cache = createSeedData();
    persistSync(cache);
    return cache;
  }
}

function mutate(fn) {
  const op = writeChain.then(async () => {
    const store = loadStore();
    const res = await fn(store);
    persistSync(store);
    return res;
  });
  writeChain = op.catch(() => {});
  return op;
}

module.exports = {
  engine: 'json',
  async init() {
    loadStore();
  },
  async getAdmin() {
    return loadStore().admin;
  },
  async updateAdmin(patch) {
    return mutate((s) => {
      s.admin = { ...s.admin, ...patch, updatedAt: new Date().toISOString() };
      return s.admin;
    });
  },
  async getSettings() {
    return loadStore().settings;
  },
  async updateSettings(nextSettings) {
    return mutate((s) => {
      s.settings = nextSettings;
      return s.settings;
    });
  },
  async listProjects(onlyPublished = false) {
    const list = [...loadStore().projects];
    return (onlyPublished ? list.filter((p) => p.published !== false) : list).sort(
      (a, b) => (a.order || 999) - (b.order || 999)
    );
  },
  async getProjectBySlug(slugOrId) {
    return (
      loadStore().projects.find(
        (p) => (p.slug === slugOrId || p.id === slugOrId) && p.published !== false
      ) || null
    );
  },
  async createProject(item) {
    return mutate((s) => {
      s.projects.push(item);
      return item;
    });
  },
  async updateProject(id, patchFn) {
    return mutate((s) => {
      const idx = s.projects.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      s.projects[idx] = patchFn(s.projects[idx]);
      return s.projects[idx];
    });
  },
  async deleteProject(id) {
    return mutate((s) => {
      const idx = s.projects.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      return s.projects.splice(idx, 1)[0];
    });
  },
  async listClients() {
    return [...loadStore().clients].sort((a, b) => (a.order || 999) - (b.order || 999));
  },
  async createClient(item) {
    return mutate((s) => {
      s.clients.push(item);
      return item;
    });
  },
  async updateClient(id, patchFn) {
    return mutate((s) => {
      const idx = s.clients.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      s.clients[idx] = patchFn(s.clients[idx]);
      return s.clients[idx];
    });
  },
  async deleteClient(id) {
    return mutate((s) => {
      const idx = s.clients.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      return s.clients.splice(idx, 1)[0];
    });
  },
  async listJobs(onlyOpen = false) {
    const list = [...loadStore().jobs];
    return (onlyOpen ? list.filter((j) => j.status === 'open') : list).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
  async getJobById(id) {
    return loadStore().jobs.find((j) => j.id === id) || null;
  },
  async createJob(item) {
    return mutate((s) => {
      s.jobs.unshift(item);
      return item;
    });
  },
  async updateJob(id, patchFn) {
    return mutate((s) => {
      const idx = s.jobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      s.jobs[idx] = patchFn(s.jobs[idx]);
      return s.jobs[idx];
    });
  },
  async deleteJob(id) {
    return mutate((s) => {
      const idx = s.jobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      return s.jobs.splice(idx, 1)[0];
    });
  },
  async listApplications() {
    return [...loadStore().applications];
  },
  async getApplicationById(id) {
    return loadStore().applications.find((a) => a.id === id) || null;
  },
  async createApplication(item) {
    return mutate((s) => {
      s.applications.unshift(item);
      return item;
    });
  },
  async updateApplication(id, patchFn) {
    return mutate((s) => {
      const idx = s.applications.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      s.applications[idx] = patchFn(s.applications[idx]);
      return s.applications[idx];
    });
  },
  async deleteApplication(id) {
    return mutate((s) => {
      const idx = s.applications.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      return s.applications.splice(idx, 1)[0];
    });
  },
  async listInquiries() {
    return [...loadStore().inquiries];
  },
  async createInquiry(item) {
    return mutate((s) => {
      s.inquiries.unshift(item);
      return item;
    });
  },
  async updateInquiry(id, patchFn) {
    return mutate((s) => {
      const idx = s.inquiries.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      s.inquiries[idx] = patchFn(s.inquiries[idx]);
      return s.inquiries[idx];
    });
  },
  async deleteInquiry(id) {
    return mutate((s) => {
      const idx = s.inquiries.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      return s.inquiries.splice(idx, 1)[0];
    });
  },
  async addAuditLog(entry) {
    return mutate((s) => {
      if (!Array.isArray(s.auditLogs)) s.auditLogs = [];
      s.auditLogs.unshift(entry);
      if (s.auditLogs.length > 200) s.auditLogs.length = 200;
      return entry;
    });
  },
  async listAuditLogs(limit = 30) {
    return (loadStore().auditLogs || []).slice(0, limit);
  },
  async exportSnapshot() {
    const s = loadStore();
    return {
      engine: 'json',
      exportedAt: new Date().toISOString(),
      admin: { email: s.admin.email, name: s.admin.name },
      settings: { ...s.settings, smtp: { ...(s.settings.smtp || {}), pass: '' } },
      projects: s.projects,
      clients: s.clients,
      jobs: s.jobs,
      applications: s.applications,
      inquiries: s.inquiries,
      auditLogs: (s.auditLogs || []).slice(0, 50),
    };
  },
};
