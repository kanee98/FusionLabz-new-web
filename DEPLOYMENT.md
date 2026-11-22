# Deploying FusionLabz on Shared Node.js Hosting (cPanel / Hostinger / Plesk)

This platform is engineered specifically to run cleanly within shared Node.js hosting memory and runtime constraints:
- **Single unified process** (`server.js`) serves both the compiled React production bundle (`client/dist`) and all Express REST APIs (`/api/*`).
- **Zero native C++ addons** (`better-sqlite3`, `bcrypt`, `sharp` are intentionally avoided so `npm install` never fails due to missing `node-gyp` compilers on shared hosts).
- **Atomic JSON database** (`data/database.json`) with serialized write locking works out of the box with zero external DB setup, plus one-click JSON backup inside `/admin`.

---

## 1. Local Build Before Uploading (Recommended)

Build the production frontend locally so your shared hosting server doesn't hit RAM limits during Vite bundling:

```bash
npm install
npm --prefix client install
npm run build
```

This creates `client/dist/` containing the optimized static frontend.

---

## 2. Files to Upload to Your Shared Host

Upload the project folder (excluding `node_modules/` and `client/node_modules/`):
- `server.js`
- `package.json`
- `server/`
- `client/dist/`
- `uploads/`
- `.env` (create from `.env.example` with your own strong `JWT_SECRET` and `ADMIN_PASSWORD`)

> **Important:** Keep `data/` and `uploads/` writable by your Node user so newly added projects, client logos, job listings, resumes, and inquiries persist across restarts.

---

## 3. cPanel "Setup Node.js App" Configuration

1. Open **cPanel → Setup Node.js App → Create Application**.
2. **Node.js Version:** Select **18.x**, **20.x**, or **22.x** (Node 20 LTS recommended).
3. **Application Mode:** `Production`.
4. **Application Root:** Folder where you uploaded `server.js` (e.g. `fusionlabz`).
5. **Application URL:** Your domain (e.g. `fusionlabz.lk`).
6. **Application Startup File:** `server.js`.
7. Add Environment Variables (or put them in `.env`):
   - `NODE_ENV=production`
   - `JWT_SECRET=<generate-a-64-char-random-string>`
   - `ADMIN_EMAIL=admin@fusionlabz.lk`
   - `ADMIN_PASSWORD=<your-strong-password>`
8. Click **Run NPM Install** (installs only lightweight root backend dependencies — fast & low RAM!).
9. Click **Start / Restart Application**.

---

## 4. Admin Portal Access

- Visit: `https://yourdomain.com/admin`
- Default initial credentials (if not overridden in `.env`):
  - **Email:** `admin@fusionlabz.lk`
  - **Password:** `FusionAdmin@2026`
- Immediately change your password under **Admin Portal → Site & Security** after first login.
- Optional: Enter your shared hosting SMTP credentials under **Admin Portal → Site & Security** to receive email alerts whenever a Contact Inquiry or Job Application is submitted.
