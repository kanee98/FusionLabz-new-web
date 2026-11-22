const crypto = require('crypto');
const config = require('./config');
const jsonAdapter = require('./db-json');
const mysqlAdapter = require('./db-mysql');

let active = config.USE_MYSQL ? mysqlAdapter : jsonAdapter;
let lastMysqlError = null;
let initPromise = null;

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function slugify(str) {
  return (
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || uid('item')
  );
}

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (config.USE_MYSQL) {
      try {
        await mysqlAdapter.init();
        active = mysqlAdapter;
        lastMysqlError = null;
        return;
      } catch (err) {
        lastMysqlError = err.code || err.message || 'MySQL connection failed';
        console.error(
          `[FusionLabz DB] MySQL initialization failed (${lastMysqlError}). Falling back to local JSON datastore so the site stays online.`
        );
        active = jsonAdapter;
      }
    }
    await jsonAdapter.init();
  })();
  return initPromise;
}

const dbProxy = {
  get engine() {
    return active.engine;
  },
  get mysqlError() {
    return lastMysqlError;
  },
  init,
  uid,
  slugify,
};

for (const method of [
  'getAdmin',
  'updateAdmin',
  'getSettings',
  'updateSettings',
  'listProjects',
  'getProjectBySlug',
  'createProject',
  'updateProject',
  'deleteProject',
  'listClients',
  'createClient',
  'updateClient',
  'deleteClient',
  'listJobs',
  'getJobById',
  'createJob',
  'updateJob',
  'deleteJob',
  'listApplications',
  'getApplicationById',
  'createApplication',
  'updateApplication',
  'deleteApplication',
  'listInquiries',
  'createInquiry',
  'updateInquiry',
  'deleteInquiry',
  'addAuditLog',
  'listAuditLogs',
  'exportSnapshot',
]) {
  dbProxy[method] = async (...args) => {
    await init();
    return active[method](...args);
  };
}

module.exports = dbProxy;
