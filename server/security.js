const fs = require('fs');
const config = require('./config');

// Progressive Brute-Force Lockout (per IP + email key)
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const attemptStore = new Map();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkLoginLock(ip, email) {
  const key = `${ip}::${String(email || '').toLowerCase()}`;
  const rec = attemptStore.get(key);
  if (!rec) return { locked: false };
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
    const mins = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
    return { locked: true, retryMinutes: mins };
  }
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    attemptStore.delete(key);
  }
  return { locked: false };
}

function recordLoginFailure(ip, email) {
  const key = `${ip}::${String(email || '').toLowerCase()}`;
  const prev = attemptStore.get(key) || { count: 0, lockedUntil: 0 };
  const nextCount = prev.count + 1;
  const lockedUntil = nextCount >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : 0;
  attemptStore.set(key, { count: nextCount, lockedUntil });
  return { count: nextCount, locked: Boolean(lockedUntil) };
}

function clearLoginFailures(ip, email) {
  const key = `${ip}::${String(email || '').toLowerCase()}`;
  attemptStore.delete(key);
}

// Strict Same-Origin CSRF Guard for state-changing Admin requests
function verifySameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  const isAllowed = (urlStr) => {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr);
      if (config.ALLOWED_ORIGIN && parsed.origin === config.ALLOWED_ORIGIN) return true;
      if (host && parsed.host === host) return true;
      if (config.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Allow non-browser Bearer API clients with no Origin/Referer (e.g. CLI/tests) ONLY if Authorization header is present
  if (!origin && !referer) {
    if (req.headers.authorization?.startsWith('Bearer ')) return next();
    if (req.path === '/login' || req.path === '/logout') return next();
    return res.status(403).json({ error: 'Forbidden: Missing origin header.' });
  }

  if (origin && isAllowed(origin)) return next();
  if (!origin && referer && isAllowed(referer)) return next();

  return res.status(403).json({ error: 'Forbidden: Cross-site request blocked.' });
}

// Magic-byte binary inspection to block spoofed executables renamed as images/PDFs
function validateMagicBytes(filePath, kind) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buf, 0, 16, 0);
    if (bytesRead < 4) return false;

    if (kind === 'image') {
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isWebp =
        buf.slice(0, 4).toString('ascii') === 'RIFF' &&
        buf.slice(8, 12).toString('ascii') === 'WEBP';
      const isAvif = buf.slice(4, 8).toString('ascii') === 'ftyp';
      const headText = buf.slice(0, bytesRead).toString('utf8').trimStart();
      const isSvg = headText.startsWith('<svg') || headText.startsWith('<?xml');
      return isPng || isJpg || isWebp || isAvif || isSvg;
    }

    if (kind === 'resume') {
      const isPdf = buf.slice(0, 5).toString('ascii') === '%PDF-';
      const isZipDocx = buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05);
      const isOleDoc = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
      return isPdf || isZipDocx || isOleDoc;
    }

    return false;
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = {
  getClientIp,
  checkLoginLock,
  recordLoginFailure,
  clearLoginFailures,
  verifySameOrigin,
  validateMagicBytes,
};
