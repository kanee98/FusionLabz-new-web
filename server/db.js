const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const { hashPassword } = require('./auth');

let cache = null;
let writeChain = Promise.resolve();

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || uid('item');
}

function createInitialData() {
  const now = new Date().toISOString();
  return {
    meta: {
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    admin: {
      email: config.INITIAL_ADMIN_EMAIL,
      name: 'FusionLabz Director',
      passwordHash: hashPassword(config.INITIAL_ADMIN_PASSWORD),
      updatedAt: now,
    },
    settings: {
      companyName: 'FusionLabz',
      tagline: 'Software engineering, product design, and cloud infrastructure.',
      email: 'hello@fusionlabz.lk',
      careersEmail: 'careers@fusionlabz.lk',
      phone: '+94 77 450 8890',
      whatsapp: '+94 77 450 8890',
      address: 'Level 08, Orion City IT Park, Colombo 09, Sri Lanka',
      globalReach: 'Colombo · Dubai · London · Singapore',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      x: 'https://x.com',
      instagram: 'https://instagram.com',
      stats: [
        { label: 'Systems delivered', value: '140', suffix: '+' },
        { label: 'Global markets', value: '18', suffix: '+' },
        { label: 'Platform uptime', value: '99.98', suffix: '%' },
        { label: 'Client retention', value: '96', suffix: '%' },
      ],
      smtp: {
        host: config.SMTP.host,
        port: config.SMTP.port,
        secure: config.SMTP.secure,
        user: config.SMTP.user,
        pass: config.SMTP.pass,
        from: config.SMTP.from,
        notifyEmail: config.SMTP.notifyEmail,
      },
    },
    projects: [
      {
        id: 'prj_educore_sms',
        slug: 'educore-student-management-system',
        title: 'EduCore — Student Management OS',
        type: 'Flagship Product',
        category: 'Enterprise Software',
        clientName: 'FusionLabz Proprietary Suite',
        year: '2026',
        summary:
          'Unified academic operating system automating enrollment, recurring monthly fee billing, biometric attendance telemetry, exam analytics, and parent-faculty messaging across multi-campus institutions.',
        challenge:
          'Educational academies relied on fragmented spreadsheets, manual fee ledgers, and disconnected messaging tools—causing billing leakage, delayed attendance reporting, and heavy administrative friction.',
        solution:
          'We engineered a multi-tenant cloud platform featuring automated monthly invoice pipelines, instant payment gateway reconciliation, real-time attendance & gradebook dashboards, and role-scoped portals for directors, educators, parents, and students.',
        impact:
          'Reduced monthly administrative workload by 74%, accelerated on-time fee collection by 42%, and actively supports 35,000+ student records with sub-120ms query latency.',
        techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'PayHere / Stripe'],
        metrics: [
          { label: 'Admin Time Saved', value: '74%' },
          { label: 'Active Records', value: '35K+' },
          { label: 'Query Latency', value: '<120ms' },
        ],
        coverImage: '/uploads/projects/sms-platform.jpg',
        liveUrl: 'https://fusionlabz.lk',
        featured: true,
        published: true,
        order: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prj_pulsecx_feedback',
        slug: 'pulsecx-customer-feedback-intelligence',
        title: 'PulseCX — Customer Intelligence Engine',
        type: 'Flagship Product',
        category: 'AI & Data',
        clientName: 'FusionLabz Proprietary Suite',
        year: '2026',
        summary:
          'Omnichannel customer feedback and sentiment telemetry platform capturing live QR, web, kiosk, and WhatsApp responses with automated trend detection and instant escalation alerts.',
        challenge:
          'Multi-branch hospitality, retail, and healthcare brands discovered customer churn weeks too late because feedback remained buried in static forms without real-time routing.',
        solution:
          'Built a low-latency feedback ingestion engine with custom survey logic, sentiment trend scoring, branch-level executive heatmaps, and threshold-triggered instant SMS/Slack/Email alerts for critical ratings.',
        impact:
          'Cut negative incident response times from 48 hours to under 6 minutes and lifted Net Promoter Scores by an average of +21 points within 90 days of rollout.',
        techStack: ['React', 'Node.js', 'WebSockets', 'ClickHouse', 'Tailwind CSS', 'OpenAI API'],
        metrics: [
          { label: 'Alert Speed', value: '<6 min' },
          { label: 'Avg NPS Lift', value: '+21 pts' },
          { label: 'Daily Signals', value: '120K+' },
        ],
        coverImage: '/uploads/projects/feedback-cx.jpg',
        liveUrl: 'https://fusionlabz.lk',
        featured: true,
        published: true,
        order: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prj_veridian_ledger',
        slug: 'veridian-cross-border-treasury-core',
        title: 'Veridian — Cross-Border FinTech Core',
        type: 'Portfolio Project',
        category: 'Web & SaaS',
        clientName: 'Veridian Capital Group',
        year: '2025',
        summary:
          'High-throughput B2B settlement portal, multi-currency reconciliation dashboard, and automated KYC/AML compliance workflow engineered for regional payment corridors.',
        challenge:
          'Legacy banking portals couldn’t keep pace with real-time FX spreads, multi-currency settlement tracking, or automated audit trails required by institutional partners.',
        solution:
          'Architected an event-driven ledger interface with cryptographic audit logs, live liquidity charts, automated SWIFT/local gateway webhooks, and granular RBAC permissions.',
        impact:
          'Processes $48M+ in annualized settlement volume with 99.99% availability and reduced reconciliation cycles from 3 days to real time.',
        techStack: ['TypeScript', 'Next.js', 'Node.js', 'Kafka', 'PostgreSQL', 'AWS'],
        metrics: [
          { label: 'Annual Volume', value: '$48M+' },
          { label: 'Availability', value: '99.99%' },
          { label: 'Reconciliation', value: 'Real-Time' },
        ],
        coverImage: '/uploads/projects/fintech-core.jpg',
        liveUrl: '',
        featured: true,
        published: true,
        order: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prj_kinetix_commerce',
        slug: 'kinetix-headless-global-commerce',
        title: 'Kinetix — Headless Global Commerce',
        type: 'Portfolio Project',
        category: 'E-Commerce',
        clientName: 'Kinetix Retail Holdings',
        year: '2025',
        summary:
          'Sub-second headless storefront and warehouse ERP bridge uniting multi-region pricing, Stripe/PayHere/Webxpay checkouts, and live inventory synchronization across 14 markets.',
        challenge:
          'A sluggish monolithic store caused 61% mobile checkout abandonment and frequent overselling during high-traffic seasonal drops.',
        solution:
          'Rebuilt the commerce stack on an edge-cached React architecture paired with a custom Node.js order orchestration engine and localized multi-currency payment routing.',
        impact:
          'Achieved 98/100 mobile Lighthouse performance, lifted mobile checkout conversion by 2.8x, and handled 14,000 concurrent flash-sale buyers with zero downtime.',
        techStack: ['React', 'TypeScript', 'Node.js', 'Stripe', 'PayHere', 'Cloudflare Edge'],
        metrics: [
          { label: 'Conversion Lift', value: '2.8x' },
          { label: 'Mobile Score', value: '98/100' },
          { label: 'Peak Concurrency', value: '14K' },
        ],
        coverImage: '/uploads/projects/cloud-commerce.jpg',
        liveUrl: '',
        featured: true,
        published: true,
        order: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prj_bizwise_bi',
        slug: 'bizwise-executive-intelligence-suite',
        title: 'BizWise — Executive BI & Operations Hub',
        type: 'Portfolio Project',
        category: 'AI & Data',
        clientName: 'BizWise Analytics',
        year: '2025',
        summary:
          'Real-time operational telemetry and automated financial forecasting workspace unifying ERP, CRM, and supply-chain data streams for C-suite decision makers.',
        challenge:
          'Leadership teams waited until month-end for static PDF reports across six disconnected business units.',
        solution:
          'Engineered automated ETL connectors, live margin & cashflow projection models, anomaly detection alerts, and executive boardroom views accessible on desktop and tablet.',
        impact:
          'Eliminated 180+ hours/month of manual reporting across finance teams and surfaced 11% in recoverable supply-chain margin during quarter one.',
        techStack: ['TypeScript', 'React', 'Python', 'Node.js', 'PostgreSQL', 'Docker'],
        metrics: [
          { label: 'Margin Recovered', value: '11%' },
          { label: 'Hours Reclaimed', value: '180/mo' },
          { label: 'Data Freshness', value: 'Live' },
        ],
        coverImage: '/uploads/projects/feedback-cx.jpg',
        liveUrl: '',
        featured: false,
        published: true,
        order: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prj_aether_fleet',
        slug: 'aether-mobile-field-dispatch',
        title: 'Aether — Autonomous Field Dispatch Mobile',
        type: 'Portfolio Project',
        category: 'Mobile Apps',
        clientName: 'Aether Logistics',
        year: '2024',
        summary:
          'Offline-first iOS & Android field operations suite with live GPS telemetry, smart route sequencing, barcode proof-of-delivery, and instant SLA escalation.',
        challenge:
          'Field technicians operating in low-connectivity zones lost dispatch sync and manually logged job sheets at shift end.',
        solution:
          'Delivered a resilient offline-sync mobile platform with conflict-free local storage, push dispatch orchestration, and an interactive command-center map for supervisors.',
        impact:
          'Increased daily completed field dispatches by 31% and achieved 99.4% verified digital proof-of-delivery compliance.',
        techStack: ['React Native', 'TypeScript', 'Node.js', 'WebSockets', 'Mapbox', 'MongoDB'],
        metrics: [
          { label: 'Dispatch Output', value: '+31%' },
          { label: 'POD Compliance', value: '99.4%' },
          { label: 'Offline Sync', value: '100%' },
        ],
        coverImage: '/uploads/projects/sms-platform.jpg',
        liveUrl: '',
        featured: false,
        published: true,
        order: 6,
        createdAt: now,
        updatedAt: now,
      },
    ],
    clients: [
      {
        id: 'cli_veridian',
        name: 'Veridian Capital',
        industry: 'FinTech & Treasury',
        website: 'https://fusionlabz.lk',
        logoUrl: '',
        featured: true,
        quote:
          'FusionLabz operates like an embedded principal engineering team. They re-architected our entire settlement core ahead of schedule with zero production regressions.',
        authorName: 'Rohan Perera',
        authorRole: 'VP of Engineering, Veridian Capital',
        impactMetric: '$48M+ processed with 99.99% uptime',
        order: 1,
        createdAt: now,
      },
      {
        id: 'cli_kinetix',
        name: 'Kinetix Holdings',
        industry: 'Global E-Commerce',
        website: 'https://fusionlabz.lk',
        logoUrl: '',
        featured: true,
        quote:
          'Moving off our legacy storefront to FusionLabz’s headless architecture nearly tripled mobile conversion within sixty days. Their engineering rigor is unmatched.',
        authorName: 'Amara Al-Mansoor',
        authorRole: 'Chief Digital Officer, Kinetix Holdings',
        impactMetric: '2.8x mobile conversion lift',
        order: 2,
        createdAt: now,
      },
      {
        id: 'cli_bizwise',
        name: 'BizWise Systems',
        industry: 'Business Intelligence',
        website: 'https://bizwise.lk',
        logoUrl: '',
        featured: true,
        quote:
          'From systems architecture to refined product design, FusionLabz transformed fragmented enterprise telemetry into an executive platform our directors use every hour.',
        authorName: 'Dinesh Wickramasinghe',
        authorRole: 'Managing Director, BizWise Systems',
        impactMetric: '180+ analyst hours saved monthly',
        order: 3,
        createdAt: now,
      },
      {
        id: 'cli_mavix',
        name: 'Mavix Digital',
        industry: 'Enterprise SaaS',
        website: 'https://mavix.lk',
        logoUrl: '',
        featured: true,
        quote:
          'Rarely do you find a software studio that masters both distributed backend systems and world-class frontend motion craft under one roof.',
        authorName: 'Nadia Fernando',
        authorRole: 'Head of Product, Mavix Digital',
        impactMetric: '3.4x faster release velocity',
        order: 4,
        createdAt: now,
      },
      {
        id: 'cli_horizon_edu',
        name: 'Horizon Academies',
        industry: 'EdTech & Institutions',
        website: 'https://fusionlabz.lk',
        logoUrl: '',
        featured: true,
        quote:
          'EduCore completely modernized how we run 12 campuses—from automated monthly fee tracking to real-time parent engagement.',
        authorName: 'Dr. Malith Jayawardena',
        authorRole: 'Director of Operations, Horizon Academies',
        impactMetric: '74% reduction in admin overhead',
        order: 5,
        createdAt: now,
      },
      {
        id: 'cli_aether',
        name: 'Aether Logistics',
        industry: 'Supply Chain & Fleet',
        website: 'https://fusionlabz.lk',
        logoUrl: '',
        featured: true,
        quote:
          'Their offline-first dispatch app held rock-solid across rural delivery corridors where every off-the-shelf tool failed us.',
        authorName: 'James Thornton',
        authorRole: 'Operations Lead, Aether Logistics UK',
        impactMetric: '+31% daily completed dispatches',
        order: 6,
        createdAt: now,
      },
    ],
    jobs: [
      {
        id: 'job_senior_fullstack',
        title: 'Senior Full-Stack Engineer (TypeScript / Node.js)',
        department: 'Core Engineering',
        location: 'Colombo, Sri Lanka',
        workMode: 'Hybrid',
        employmentType: 'Full-time',
        experience: '4+ Years',
        salaryRange: 'Competitive + Equity & Performance Bonus',
        summary:
          'Architect and ship high-throughput SaaS platforms, resilient APIs, and precision React interfaces for global enterprise clients and FusionLabz flagship products.',
        responsibilities: [
          'Lead technical design and end-to-end delivery of complex TypeScript, React, and Node.js systems.',
          'Design scalable relational and real-time data architectures optimized for low latency and high reliability.',
          'Collaborate closely with product designers and cloud architects to maintain uncompromising code and UX quality.',
          'Mentor mid-level engineers through architecture reviews, clean patterns, and pragmatic engineering standards.',
        ],
        requirements: [
          '4+ years shipping production web applications with TypeScript, React/Next.js, and Node.js.',
          'Strong command of PostgreSQL/SQL modeling, REST/GraphQL APIs, authentication, and caching.',
          'Deep care for performance profiling, security hygiene, and clean maintainable architecture.',
          'Strong written and verbal communication skills for working directly with global technical stakeholders.',
        ],
        techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'job_motion_ui',
        title: 'Senior UI/UX & Interactive Motion Engineer',
        department: 'Design & Experience',
        location: 'Colombo / Global Remote',
        workMode: 'Remote',
        employmentType: 'Full-time',
        experience: '3+ Years',
        salaryRange: 'Competitive + Global Project Stipend',
        summary:
          'Craft unmistakable brand-grade digital interfaces, bespoke design systems, and fluid 60fps scroll choreography using Figma, React, GSAP, and WebGL.',
        responsibilities: [
          'Translate complex enterprise workflows and brand narratives into stark, editorial, zero-clutter UI architectures.',
          'Prototype and engineer interactive micro-interactions, scroll narratives, and responsive component systems.',
          'Partner directly with engineering squads from wireframe through final pixel-accurate production deployment.',
        ],
        requirements: [
          'Portfolio demonstrating extraordinary taste in modern tech products, typography, and motion craft.',
          'Fluency in Figma design systems plus hands-on mastery of modern CSS, Tailwind, React, and GSAP/Framer.',
          'Bonus: experience with Three.js / GLSL shaders or interactive canvas graphics.',
        ],
        techStack: ['Figma', 'React', 'GSAP', 'Three.js', 'Tailwind CSS', 'Design Systems'],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'job_cloud_architect',
        title: 'Cloud & DevOps Infrastructure Engineer',
        department: 'Cloud & Platform',
        location: 'Colombo, Sri Lanka',
        workMode: 'Hybrid',
        employmentType: 'Full-time',
        experience: '3+ Years',
        salaryRange: 'Competitive + Cloud Certification Sponsorship',
        summary:
          'Build automated CI/CD pipelines, hardened cloud infrastructure, observability stacks, and zero-downtime deployment workflows across AWS, GCP, and containerized clusters.',
        responsibilities: [
          'Provision and harden scalable cloud infrastructure using Infrastructure-as-Code (Terraform / Pulumi).',
          'Implement automated testing, security scanning, monitoring, and sub-minute rollback pipelines.',
          'Optimize cloud unit economics, database scaling strategies, and disaster recovery protocols.',
        ],
        requirements: [
          '3+ years managing production workloads on AWS, GCP, or Azure with Linux and Docker.',
          'Proven mastery of CI/CD (GitHub Actions / GitLab CI), Nginx/Cloudflare edge routing, and observability tooling.',
          'Strong grounding in application security, IAM least-privilege, and automated backup resilience.',
        ],
        techStack: ['AWS', 'Docker', 'Terraform', 'Linux', 'GitHub Actions', 'Cloudflare'],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'job_mobile_eng',
        title: 'Mobile Application Engineer (React Native / Flutter)',
        department: 'Mobile Systems',
        location: 'Colombo / Remote',
        workMode: 'Remote',
        employmentType: 'Full-time',
        experience: '2+ Years',
        salaryRange: 'Competitive + Hardware Allowance',
        summary:
          'Develop ultra-responsive, offline-capable iOS and Android applications integrated seamlessly with real-time cloud backends and hardware peripherals.',
        responsibilities: [
          'Build fluid cross-platform mobile apps with native-grade gesture physics and rock-solid offline sync.',
          'Own App Store and Google Play release automation, crash telemetry, and battery/memory optimization.',
          'Work alongside backend engineers to design resilient sync protocols and real-time push workflows.',
        ],
        requirements: [
          '2+ years shipping commercial iOS and Android apps using React Native (TypeScript) or Flutter.',
          'Experience with offline storage, biometric auth, push notifications, and native bridge modules.',
          'Strong eye for mobile ergonomics, animation smoothness, and clean modular code.',
        ],
        techStack: ['React Native', 'TypeScript', 'Flutter', 'iOS / Android', 'GraphQL / REST'],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
    ],
    applications: [
      {
        id: 'app_demo_01',
        jobId: 'job_senior_fullstack',
        jobTitle: 'Senior Full-Stack Engineer (TypeScript / Node.js)',
        fullName: 'Kavinda Senanayake',
        email: 'kavinda.dev@example.com',
        phone: '+94 71 234 5678',
        portfolioUrl: 'https://github.com/kavinda-dev',
        experienceYears: '5 years',
        coverNote:
          'Built multi-tenant Node.js and React platforms handling 50k+ daily users. Excited about FusionLabz’s engineering craftsmanship and flagship products.',
        resumeFile: '',
        resumeOriginalName: '',
        status: 'new',
        notes: 'Sample seeded candidate — feel free to review or delete once live applications arrive.',
        createdAt: now,
      },
    ],
    inquiries: [
      {
        id: 'inq_demo_01',
        ticketId: 'FLZ-1042',
        fullName: 'Sarah Lindqvist',
        email: 'sarah@nordicventures.example',
        company: 'Nordic Ventures AB',
        phone: '+46 70 123 4567',
        services: ['Web & SaaS Platforms', 'Cloud & DevOps'],
        budget: '$25K – $50K',
        timeline: '2 – 3 Months',
        message:
          'We are scaling our European B2B operations platform and need a dedicated engineering partner to rebuild the core SaaS dashboard and payment pipeline.',
        status: 'new',
        read: false,
        notes: 'Sample seeded inquiry — new contact form submissions will appear right here.',
        createdAt: now,
      },
    ],
  };
}

function loadDb() {
  if (cache) return cache;
  if (!fs.existsSync(config.DB_FILE)) {
    cache = createInitialData();
    persistSync(cache);
    return cache;
  }
  try {
    const raw = fs.readFileSync(config.DB_FILE, 'utf8');
    cache = JSON.parse(raw);
    return cache;
  } catch (err) {
    console.error('[DB] Failed reading database.json, recreating safe seed:', err.message);
    cache = createInitialData();
    persistSync(cache);
    return cache;
  }
}

function persistSync(data) {
  data.meta = data.meta || {};
  data.meta.updatedAt = new Date().toISOString();
  const tmpFile = `${config.DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, config.DB_FILE);
}

function mutateDb(mutatorFn) {
  const op = writeChain.then(async () => {
    const db = loadDb();
    const result = await mutatorFn(db);
    persistSync(db);
    return result;
  });
  writeChain = op.catch(() => {});
  return op;
}

function getDb() {
  return loadDb();
}

module.exports = {
  getDb,
  mutateDb,
  uid,
  slugify,
};
