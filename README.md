# FusionLabz — Official Web Platform & Admin CMS

State-of-the-art software engineering website, interactive scrollytelling flagship, careers/ATS portal, project inquiry system, and full Admin CMS engineered specifically for shared Node.js hosting.

## Features
- **Cosmic-Grade Scroll Choreography:** Powered by **Lenis** smooth inertial scrolling, **GSAP ScrollTrigger** pinned scrollytelling & horizontal showcase tracks, word-by-word scroll-illuminated manifesto, and a scroll-reactive **Three.js WebGL** spatial architecture scene.
- **Full Public Pages:**
  - `/` — 7-chapter interactive flagship home experience
  - `/portfolio` — Filterable work & flagship product archive with interactive case study modal + dynamic client roster
  - `/careers` — Live open roles, department/work-mode filtering, expandable role specs, and candidate application form with Resume/CV upload (PDF/DOC/DOCX)
  - `/contact` — Multi-step project scope & inquiry form with live Colombo (IST) clock, instant ticket confirmation, and optional SMTP alerts
- **Admin Portal (`/admin`):**
  - Secure `scrypt` + HMAC-SHA256 JWT authentication
  - Full CRUD for **Projects & Portfolio** (with cover image upload), **Clients** (with logo upload & testimonials), and **Job Listings**
  - **Candidate Applications ATS** with status pipeline, recruiter notes, and secure authenticated Resume/CV downloads
  - **Contact Inquiries Inbox** with unread badges, status workflow, and direct email replies
  - **Site & Security Settings** including company info, optional SMTP mail config, password changes, and one-click JSON database backup

## Quick Start

```bash
npm install
npm --prefix client install
npm run build
npm start
```

- Website: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin`
- Initial Admin Credentials (override in `.env` or change inside Admin → Site & Security):
  - Email: `admin@fusionlabz.lk`
  - Password: `FusionAdmin@2026`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for cPanel / Hostinger / Plesk shared Node.js hosting instructions.
