const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const CLIENT_DIST_DIR = path.join(ROOT_DIR, 'client', 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(UPLOADS_DIR, 'projects'), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_DIR, 'clients'), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_DIR, 'resumes'), { recursive: true });

function resolveJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.join(DATA_DIR, '.jwt_secret');
  if (fs.existsSync(secretFile)) {
    const existing = fs.readFileSync(secretFile, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(48).toString('hex');
  try {
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  } catch {
    // Fallback to in-memory secret if filesystem permissions disallow chmod
    fs.writeFileSync(secretFile, generated);
  }
  return generated;
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  UPLOADS_DIR,
  CLIENT_DIST_DIR,
  DB_FILE: path.join(DATA_DIR, 'database.json'),
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: resolveJwtSecret(),
  JWT_EXPIRES_SECONDS: 60 * 60 * 24 * 7, // 7 days
  INITIAL_ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@fusionlabz.lk').toLowerCase(),
  INITIAL_ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'FusionAdmin@2026',
  SMTP: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'FusionLabz Portal <no-reply@fusionlabz.lk>',
    notifyEmail: process.env.NOTIFY_EMAIL || 'hello@fusionlabz.lk',
  },
};
