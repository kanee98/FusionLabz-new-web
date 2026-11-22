const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./server/config');
const { getDb } = require('./server/db');
const publicRoutes = require('./server/routes/public');
const adminRoutes = require('./server/routes/admin');

// Initialize database & seed data immediately on startup
getDb();

const app = express();

// Required on shared Node hosting behind reverse proxies (cPanel / Nginx / Cloudflare)
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Public uploaded assets ONLY (resumes stay private behind admin auth)
app.use(
  '/uploads/projects',
  express.static(path.join(config.UPLOADS_DIR, 'projects'), { maxAge: '7d' })
);
app.use(
  '/uploads/clients',
  express.static(path.join(config.UPLOADS_DIR, 'clients'), { maxAge: '7d' })
);

// Health endpoint for shared hosting uptime checks
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'FusionLabz Platform', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Serve built React SPA in production / shared Node hosting
if (fs.existsSync(config.CLIENT_DIST_DIR)) {
  app.use(
    express.static(config.CLIENT_DIST_DIR, {
      maxAge: '1d',
      index: false,
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    return res.sendFile(path.join(config.CLIENT_DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).send(
      'FusionLabz API is running. Run "npm run build" to compile the frontend production bundle.'
    );
  });
}

// Unified error handler (including Multer upload errors)
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Uploaded file exceeds the maximum allowed size.' });
  }
  const status = err.status || 400;
  return res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(config.PORT, () => {
  console.log(`\n  [FusionLabz] Server online -> http://localhost:${config.PORT}`);
  console.log(`  [FusionLabz] Mode: ${config.NODE_ENV}`);
  console.log(`  [FusionLabz] Admin Portal -> http://localhost:${config.PORT}/admin\n`);
});
