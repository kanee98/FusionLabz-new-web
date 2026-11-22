const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./server/config');
const db = require('./server/db');
const publicRoutes = require('./server/routes/public');
const adminRoutes = require('./server/routes/admin');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Strict Production Security Headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(compression());
app.use(
  cors({
    origin: config.ALLOWED_ORIGIN ? [config.ALLOWED_ORIGIN] : true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global API rate shield
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Public robots.txt
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/\nDisallow: /uploads/resumes/\n');
});

// Public uploaded showcase media ONLY (resumes stay strictly private)
app.use(
  '/uploads/projects',
  express.static(path.join(config.UPLOADS_DIR, 'projects'), {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);
app.use(
  '/uploads/clients',
  express.static(path.join(config.UPLOADS_DIR, 'clients'), {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

// Explicitly block common guessable admin paths with 404
app.all(
  ['/admin', '/admin/*', '/api/admin', '/api/admin/*', '/wp-admin', '/wp-login.php'],
  (_req, res) => {
    res.status(404).type('text/plain').send('Not Found');
  }
);

// Health endpoint (also reports active DB engine & sanitized fallback hint if any)
app.get('/api/health', async (_req, res) => {
  await db.init();
  res.json({
    status: 'ok',
    service: 'FusionLabz Platform',
    database: db.engine,
    ...(db.mysqlError ? { mysqlFallbackReason: db.mysqlError } : {}),
    timestamp: new Date().toISOString(),
  });
});

// Mount Public API & Stealth Secret Admin API
app.use('/api/public', publicRoutes);
app.use(config.ADMIN_API_BASE, adminRoutes);

// Serve built React SPA
const indexPath = path.join(config.CLIENT_DIST_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  app.use(
    express.static(config.CLIENT_DIST_DIR, {
      maxAge: '1d',
      index: false,
    })
  );

  // Secret Admin Console Route: injects runtime gate ONLY on exact ADMIN_PATH match
  app.get([config.ADMIN_PATH, `${config.ADMIN_PATH}/*`], (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const html = fs.readFileSync(indexPath, 'utf8');
    const gateScript = `<script>window.__FLZ_PORTAL__={enabled:true,apiBase:${JSON.stringify(
      config.ADMIN_API_BASE
    )},path:${JSON.stringify(config.ADMIN_PATH)}};</script>`;
    return res.send(html.replace('</head>', `${gateScript}</head>`));
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    return res.sendFile(indexPath);
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res
      .status(200)
      .type('text/html')
      .send(
        '<!doctype html><html><body style="font-family:sans-serif;padding:40px"><h2>FusionLabz Server Online</h2><p>Frontend bundle (<code>client/dist</code>) not found. Push <code>client/dist</code> to Git or run <code>npm run build</code>.</p></body></html>'
      );
  });
}

// Unified Error Handler
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Uploaded file exceeds the maximum allowed size.' });
  }
  const status = err.status || 400;
  return res.status(status).json({ error: err.message || 'Internal server error' });
});

// Warm up DB in background (never blocks Phusion Passenger's synchronous listen!)
db.init().catch((err) => {
  console.error('[FusionLabz] Background DB init warning:', err.message);
});

// IMPORTANT: Call app.listen() SYNCHRONOUSLY at module load so cPanel Phusion Passenger binds cleanly!
const server = app.listen(config.PORT, () => {
  console.log(`\n  [FusionLabz] Server online -> http://localhost:${config.PORT}`);
  console.log(`  [FusionLabz] Mode: ${config.NODE_ENV}`);
  console.log(`  [FusionLabz] Private Console -> ${config.ADMIN_PATH}\n`);
});

module.exports = server;
