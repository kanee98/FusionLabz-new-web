# Deploying FusionLabz on Shared Node.js Hosting (cPanel / Hostinger / Plesk)

This platform is launch-ready for shared Node.js hosting with **real MySQL database support** and **production-hardened security**.

---

## 1. Database Setup (MySQL on cPanel / Shared Hosting)

You do **not** need to run manual SQL migrations — once MySQL credentials are in `.env`, the server automatically creates all 8 tables (`server/schema.sql`) and seeds your real FusionLabz products, clients, and settings on first boot.

1. Open **cPanel → MySQL Databases** (or **MySQL Database Wizard**).
2. Create a database (e.g. `fusionla_web`) and a database user with a strong password.
3. Add the user to the database with **ALL PRIVILEGES**.
4. Enter `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in your `.env` (or cPanel Node App environment variables).

> **Local Preview Fallback:** If `DB_HOST` is left blank (for example when testing locally on your PC), the server automatically uses its atomic JSON store (`data/database.json`) with zero setup.

---

## 2. Security Configuration (Important Before Going Live!)

Never expose a guessable `/admin` URL. This platform enforces multi-layer security:
- **Stealth Console Path (`ADMIN_PATH`):** Public `/admin` and `/api/admin/*` return `404 Not Found`. Your real console URL is set via `ADMIN_PATH` in `.env` (default: `/flz-console-84k2` — customize this to your own secret slug like `/flz-ops-93x7`). The secret path is never compiled into the public frontend JavaScript bundle.
- **Brute-Force Lockout & Audit Log:** 5 consecutive failed logins lock that IP + email for 15 minutes and log the attempt inside **Settings → Security Audit Log**.
- **CSRF + Cookie Hardening:** `httpOnly`, `SameSite=Strict`, `Secure` cookies (on HTTPS), plus strict Same-Origin CSRF checks on all state-changing admin requests.
- **File Upload Protection:** Magic-byte signature verification blocks spoofed executables disguised as images or PDFs; resumes are stored privately outside static hosting and require admin authentication to download.
- **Strict Headers:** Helmet Content-Security-Policy, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `robots.txt`.

Generate a strong `JWT_SECRET` locally before deploying:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Build Locally Before Uploading (Recommended)

```bash
npm install
npm --prefix client install
npm run build
```

Upload to your shared host (excluding `node_modules/` and `client/node_modules/`):
- `server.js`
- `package.json`
- `server/`
- `client/dist/`
- `uploads/`
- `.env` (created from `.env.example`)

---

## 4. cPanel "Setup Node.js App" Settings (Git Clone Method)

Because `client/dist/` is committed to Git, you do **not** need to build Vite on shared hosting!

1. **Node.js Version:** `20.x` or `22.x` LTS.
2. **Application Mode:** `Production`.
3. **Application Root:** `repositories/FusionLabz` (your cloned repo folder).
4. **Application Startup File:** `server.js`.
5. **Passenger Log File:** Set this to `logs/passenger.log` so any runtime logs are easily viewable in File Manager!
6. Set Environment Variables in cPanel (or upload `.env` into `repositories/FusionLabz/.env`):
   - `NODE_ENV=production`
   - `ADMIN_PATH=/your-secret-portal-slug`
   - `JWT_SECRET=<your-96-char-random-hex>`
   - `ADMIN_EMAIL=connect@fusionlabz.lk`
   - `ADMIN_PASSWORD=<your-strong-password>`
   - `ALLOWED_ORIGIN=https://fusionlabz.lk`
   - `DB_HOST=localhost`
   - `DB_NAME=<cpanel_db_name>`
   - `DB_USER=<cpanel_db_user>`
   - `DB_PASSWORD=<cpanel_db_password>`
7. Click **SAVE**, then click **Run NPM Install** (installs only lightweight root backend packages — fast & low RAM).
8. Click **RESTART**.
9. Visit `https://fusionlabz.lk/api/health` to confirm `"status": "ok"` and `"database": "mysql"`!

---

## 5. Accessing Your Private Admin Console

- Navigate directly to: `https://yourdomain.com<ADMIN_PATH>` (default locally: `http://localhost:3000/flz-console-84k2`).
- Bookmark this URL privately — there are zero public links to it on the website.
- Add your **WhatsApp number** and optional **SMTP settings** under **Site & Security** inside the console.
