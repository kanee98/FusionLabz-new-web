const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('./config');

const IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]);

const RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const RESUME_EXTS = new Set(['.pdf', '.doc', '.docx']);

function createSafeFilename(originalName, fallbackExt = '') {
  const ext = path.extname(originalName || '').toLowerCase() || fallbackExt;
  const stamp = Date.now();
  const rand = crypto.randomBytes(5).toString('hex');
  return `${stamp}-${rand}${ext}`;
}

function createImageUploader(subdir, maxSizeMb = 8) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(config.UPLOADS_DIR, subdir));
    },
    filename: (_req, file, cb) => {
      cb(null, createSafeFilename(file.originalname, '.png'));
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIMES.has(file.mimetype)) {
        return cb(new Error('Unsupported image format. Allowed: PNG, JPG, WEBP, AVIF, SVG.'));
      }
      return cb(null, true);
    },
  });
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(config.UPLOADS_DIR, 'resumes'));
  },
  filename: (_req, file, cb) => {
    cb(null, createSafeFilename(file.originalname, '.pdf'));
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!RESUME_MIMES.has(file.mimetype) && !RESUME_EXTS.has(ext)) {
      return cb(new Error('Unsupported resume format. Please upload PDF, DOC, or DOCX (max 6MB).'));
    }
    return cb(null, true);
  },
});

module.exports = {
  uploadProjectImage: createImageUploader('projects', 8),
  uploadClientLogo: createImageUploader('clients', 4),
  uploadResume,
};
