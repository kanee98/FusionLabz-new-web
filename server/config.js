const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const CLIENT_DIST_DIR = path.join(ROOT_DIR, 'client', 'dist');

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_DIR, 'projects'), { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_DIR, 'clients'), { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_DIR, 'resumes'), { recursive: true });
} catch (err) {
  console.warn('[FusionLabz Config] Directory setup warning:', err.message);
}

function resolveJwtSecret() {
  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.trim().length >= 24 &&
    !process.env.JWT_SECRET.includes('replace-with')
  ) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.join(DATA_DIR, '.jwt_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
  } catch {
    // ignore read failure
  }
  const generated = crypto.randomBytes(48).toString('hex');
  try {
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  } catch {
    try {
      fs.writeFileSync(secretFile, generated);
    } catch {
      // Fallback to in-memory secret if filesystem is read-only
    }
  }
  return generated;
}

function resolveAdminPath() {
  const raw = (process.env.ADMIN_PATH || '/flz-console-84k2').trim();
  const normalized = raw.startsWith('/') ? raw.replace(/\/+$/, '') : `/${raw.replace(/\/+$/, '')}`;
  // Reject trivially guessable paths or root
  const blocked = new Set(['/', '/admin', '/login', '/dashboard', '/wp-admin', '/api', '/uploads']);
  if (blocked.has(normalized.toLowerCase()) || !/^\/[a-zA-Z0-9_-]{6,64}$/.test(normalized)) {
    return '/flz-console-84k2';
  }
  return normalized;
}

const ADMIN_PATH = resolveAdminPath();
const ADMIN_API_BASE = `/api${ADMIN_PATH}`;

const MYSQL_CONFIG = {
  host: (process.env.DB_HOST || '').trim(),
  port: Number(process.env.DB_PORT) || 3306,
  database: (process.env.DB_NAME || '').trim(),
  user: (process.env.DB_USER || '').trim(),
  password: process.env.DB_PASSWORD || '',
};

const USE_MYSQL = Boolean(MYSQL_CONFIG.host && MYSQL_CONFIG.database && MYSQL_CONFIG.user);

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  UPLOADS_DIR,
  CLIENT_DIST_DIR,
  DB_FILE: path.join(DATA_DIR, 'database.json'),
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGIN: (process.env.ALLOWED_ORIGIN || '').trim(),
  ADMIN_PATH,
  ADMIN_API_BASE,
  USE_MYSQL,
  MYSQL_CONFIG,
  JWT_SECRET: resolveJwtSecret(),
  JWT_EXPIRES_SECONDS: 60 * 60 * 12, // 12 hours
  INITIAL_ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'connect@fusionlabz.lk').toLowerCase(),
  INITIAL_ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ChangeMe@FusionLabz2026!',
  SMTP: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'FusionLabz <connect@fusionlabz.lk>',
    notifyEmail: process.env.NOTIFY_EMAIL || 'connect@fusionlabz.lk',
  },
};
