# FusionLabz: Production Website & Private Admin Console

Official launch-ready platform for **FusionLabz** (Kandy, Sri Lanka) featuring flagship products (**CCTV Face Tracking System**, **Gym Schedules System**), client showcase (**BizWise**, **Mavix**, **PropWise**, **Pearl Voyagers**), Careers with CV upload, Contact Inquiries, **MySQL + JSON dual database engine**, and a **stealth security-hardened Admin Console**.

## Quick Start (Local)

```bash
npm install
npm --prefix client install
npm run build
npm start
```

- **Public Website:** `http://localhost:3000`
- **Private Admin Console (default, rotate via `ADMIN_PATH` in `.env`):** `http://localhost:3000/flz-console-84k2`
  - Public `/admin` intentionally returns `404 Not Found`.
- **Initial Admin Credentials (customize in `.env` before production):**
  - Email: `connect@fusionlabz.lk`
  - Password: `ChangeMe@FusionLabz2026!`

## Production Deployment & MySQL Setup
See [DEPLOYMENT.md](./DEPLOYMENT.md) for cPanel / Hostinger / Plesk shared Node.js hosting + MySQL setup instructions.
