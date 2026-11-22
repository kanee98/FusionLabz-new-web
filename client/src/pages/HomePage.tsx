import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Client, Job, Project, SiteSettings } from '../types';
import { BrandLogo } from '../components/BrandLogo';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  settings: SiteSettings | null;
  projects: Project[];
  clients: Client[];
  jobs: Job[];
  onSelectProject: (project: Project) => void;
}

const SERVICES = [
  {
    num: '01',
    title: 'Custom Software & Enterprise Products',
    summary:
      'Internal platforms, multi-tenant SaaS products, and proprietary systems like EduCore and PulseCX built around your exact operations.',
  },
  {
    num: '02',
    title: 'Web Applications & Digital Flagships',
    summary:
      'Fast, accessible React and TypeScript applications designed with precision typography, fluid motion, and resilient backends.',
  },
  {
    num: '03',
    title: 'Mobile Applications',
    summary:
      'Native-quality iOS and Android apps with offline resilience, real-time synchronization, and thoughtful ergonomics.',
  },
  {
    num: '04',
    title: 'E-Commerce & Payment Platforms',
    summary:
      'Headless storefronts and financial portals integrated seamlessly with Stripe, PayHere, Webxpay, and live ERP inventory.',
  },
  {
    num: '05',
    title: 'Cloud Infrastructure & Applied AI',
    summary:
      'Automated cloud scaling, security hardening, executive analytics dashboards, and practical AI automation workflows.',
  },
];

const STATEMENT =
  'Great software feels effortless on the surface because every decision beneath it was deliberate. We pair senior engineering discipline with enduring product craft.';

export function HomePage({
  settings,
  projects,
  clients,
  jobs,
  onSelectProject,
}: HomePageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gallerySectionRef = useRef<HTMLElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = useState(0);

  const featuredProjects = useMemo(() => {
    const featured = projects.filter((p) => p.featured);
    return featured.length > 0 ? featured : projects.slice(0, 6);
  }, [projects]);

  const heroShowcase = featuredProjects[0] || projects[0] || null;
  const words = useMemo(() => STATEMENT.split(' '), []);
  const tickerClients = useMemo(
    () => (clients.length > 0 ? [...clients, ...clients, ...clients] : []),
    [clients]
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // Crisp Hero Entrance
      gsap.fromTo(
        '.hero-line',
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.1,
          ease: 'power4.out',
        }
      );

      gsap.fromTo(
        '.hero-sub',
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.2,
        }
      );

      if (prefersReduced) return;

      // 1. Hero gentle vertical lift on scroll
      gsap.to('.hero-copy-block', {
        y: -48,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: '65% top',
          scrub: true,
        },
      });

      // 2. Flagship Stage 3D Perspective Unfold (Apple / Linear scroll feel)
      gsap.fromTo(
        '.hero-stage-frame',
        { rotateX: 11, scale: 0.92, y: 36 },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-stage-wrap',
            start: 'top 92%',
            end: 'top 22%',
            scrub: 0.7,
          },
        }
      );

      // 3. Word-by-Word Scroll-Scrubbed Editorial Statement
      gsap.fromTo(
        '.statement-word',
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: {
            trigger: '.statement-section',
            start: 'top 76%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        }
      );

      // 4. Capabilities row reveal + active sync
      gsap.utils.toArray<HTMLElement>('.service-row').forEach((row, idx) => {
        ScrollTrigger.create({
          trigger: row,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => setActiveService(idx),
          onEnterBack: () => setActiveService(idx),
        });

        gsap.fromTo(
          row,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // 5. Desktop Pinned Horizontal Work Gallery (Cosmic fluidity)
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const section = gallerySectionRef.current;
        const track = galleryTrackRef.current;
        if (!section || !track) return;

        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120);
        if (getDistance() <= 40) return;

        gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 0.85,
            start: 'top top',
            end: () => `+=${getDistance()}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      });

      // 6. Clean rolling counters in pure-white editorial section
      gsap.utils.toArray<HTMLElement>('.metric-num').forEach((el) => {
        const target = parseFloat(el.dataset.target || '0');
        const decimals = (el.dataset.target || '').includes('.') ? 2 : 0;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = decimals > 0 ? obj.val.toFixed(decimals) : String(Math.round(obj.val));
          },
        });
      });

      gsap.fromTo(
        '.quote-reveal',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.quotes-section',
            start: 'top 82%',
            once: true,
          },
        }
      );
    }, rootRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [featuredProjects.length]);

  const stats = settings?.stats?.length
    ? settings.stats
    : [
        { label: 'Systems delivered', value: '140', suffix: '+' },
        { label: 'Global markets', value: '18', suffix: '+' },
        { label: 'Platform uptime', value: '99.98', suffix: '%' },
        { label: 'Client retention', value: '96', suffix: '%' },
      ];

  return (
    <div ref={rootRef} className="relative z-10">
      {/* =================================================================== */}
      {/* 1. HERO + 3D PERSPECTIVE FLAGSHIP STAGE                             */}
      {/* =================================================================== */}
      <section className="hero-section relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="hero-copy-block mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.4rem)] leading-[1.03] font-medium tracking-[-0.045em] text-white">
            <span className="line-mask">
              <span className="hero-line block">Software engineered</span>
            </span>
            <span className="line-mask">
              <span className="hero-line block bg-gradient-to-b from-white to-[#8A909E] bg-clip-text text-transparent">
                for what comes next.
              </span>
            </span>
          </h1>

          <p className="hero-sub mx-auto mt-7 max-w-xl text-base leading-relaxed text-[#8A909E] sm:text-lg">
            FusionLabz designs and engineers custom software, SaaS platforms, and enterprise
            products for ambitious organizations around the world.
          </p>

          <div className="hero-sub mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#060709] transition-all duration-200 hover:bg-[#E6ECF5]"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-white/28 hover:bg-white/[0.06]"
            >
              <span>Explore work</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Scroll-Unfolding 3D Product Stage */}
        {heroShowcase && (
          <div
            className="hero-stage-wrap mx-auto mt-16 max-w-6xl px-6 sm:mt-24 lg:px-8"
            style={{ perspective: '1400px' }}
          >
            <div
              onClick={() => onSelectProject(heroShowcase)}
              className="hero-stage-frame group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0B0D12] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]"
            >
              {/* Subtle studio top hairline highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="relative aspect-[16/9] w-full overflow-hidden">
                {heroShowcase.coverImage && (
                  <img
                    src={heroShowcase.coverImage}
                    alt={heroShowcase.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060709]/90 via-transparent to-transparent" />

                <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 sm:right-10 sm:bottom-8 sm:left-10 sm:flex-row sm:items-end">
                  <div>
                    <div className="text-xs font-medium text-[#00B8F4]">{heroShowcase.type}</div>
                    <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-white sm:text-2xl">
                      {heroShowcase.title}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors group-hover:text-white">
                    View case study
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 2. SCROLL-SCRUBBED EDITORIAL STATEMENT                              */}
      {/* =================================================================== */}
      <section className="statement-section relative border-t border-white/[0.06] bg-[#060709]/70 py-28 backdrop-blur-[2px] sm:py-40">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <p className="font-display text-2xl leading-[1.32] font-normal tracking-[-0.025em] text-white sm:text-4xl lg:text-[2.75rem]">
            {words.map((word, idx) => (
              <span key={idx} className="statement-word mr-[0.26em] inline-block">
                {word}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. CAPABILITIES — CLEAN EXECUTIVE INDEX                             */}
      {/* =================================================================== */}
      <section className="relative border-t border-white/[0.06] bg-[#060709]/88 py-28 sm:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Capabilities</div>
              <h2 className="mt-3 font-display text-3xl leading-[1.1] font-medium tracking-[-0.035em] text-white sm:text-4xl">
                End-to-end engineering, without the bloat.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#8A909E]">
                Focused senior squads covering architecture, design, delivery, and long-term scale.
              </p>
            </div>

            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08] lg:col-span-8">
              {SERVICES.map((srv, idx) => {
                const isActive = idx === activeService;
                return (
                  <div
                    key={srv.num}
                    onMouseEnter={() => setActiveService(idx)}
                    className="service-row group py-8 transition-colors"
                  >
                    <div className="flex items-baseline gap-6 sm:gap-10">
                      <span
                        className={`text-xs font-medium tabular-nums transition-colors ${
                          isActive ? 'text-[#00B8F4]' : 'text-[#5A606E]'
                        }`}
                      >
                        {srv.num}
                      </span>
                      <div className="flex-1">
                        <h3
                          className={`font-display text-xl font-medium tracking-[-0.02em] transition-colors sm:text-2xl ${
                            isActive ? 'text-white' : 'text-white/75 group-hover:text-white'
                          }`}
                        >
                          {srv.title}
                        </h3>
                        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#8A909E]">
                          {srv.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. SELECTED WORK — PINNED HORIZONTAL SCROLL GALLERY                 */}
      {/* =================================================================== */}
      <section
        ref={gallerySectionRef}
        className="relative overflow-hidden border-t border-white/[0.06] bg-[#060709] py-24 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:py-16"
      >
        <div className="mx-auto mb-10 flex w-full max-w-6xl items-end justify-between gap-6 px-6 lg:px-8">
          <div>
            <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Selected work</div>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.035em] text-white sm:text-5xl">
              Products built to scale.
            </h2>
          </div>

          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8A909E] transition-colors hover:text-white"
          >
            <span>All work</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          ref={galleryTrackRef}
          className="flex gap-6 overflow-x-auto px-6 pb-4 lg:w-max lg:overflow-visible lg:px-[max(2rem,calc((100vw-72rem)/2+2rem))]"
        >
          {featuredProjects.map((project) => (
            <article
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group w-[85vw] shrink-0 cursor-pointer sm:w-[62vw] lg:w-[490px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E13]">
                {project.coverImage && (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#8A909E]">
                    {project.category} · {project.year}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-white transition-colors group-hover:text-[#00B8F4]">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 max-w-md text-[13.5px] leading-relaxed text-[#8A909E]">
                    {project.summary}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#5A606E] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </div>
            </article>
          ))}

          <Link
            to="/portfolio"
            className="group flex w-[70vw] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center transition-colors hover:border-white/25 hover:bg-white/[0.04] sm:w-[360px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-transform duration-300 group-hover:scale-105">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="mt-5 font-display text-lg font-medium text-white">
              View all {projects.length} projects
            </div>
            <p className="mt-1 text-xs text-[#8A909E]">Products, case studies & clients</p>
          </Link>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. PURE WHITE EDITORIAL CONTRAST — METRICS & CLIENTS                */}
      {/* =================================================================== */}
      <section className="quotes-section relative z-10 bg-white py-28 text-[#0A0B0E] sm:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 border-b border-black/[0.08] pb-14 sm:flex-row sm:items-end">
            <div>
              <BrandLogo variant="light-bg" className="h-8 sm:h-9" />
              <h2 className="mt-6 font-display text-3xl leading-[1.1] font-medium tracking-[-0.035em] text-[#0A0B0E] sm:text-5xl">
                Trusted by teams who
                <br />
                value reliability.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#525866]">
              From fast-growing startups to multi-campus institutions, our partners count on clean
              delivery and predictable outcomes.
            </p>
          </div>

          {/* Understated Numbers */}
          <div className="grid grid-cols-2 gap-8 border-b border-black/[0.08] py-14 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl font-medium tracking-[-0.04em] text-[#0A0B0E] sm:text-5xl">
                  <span className="metric-num" data-target={s.value}>
                    {s.value}
                  </span>
                  <span className="text-[#0099D6]">{s.suffix || ''}</span>
                </div>
                <div className="mt-2 text-xs text-[#525866]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Partner Logos / Wordmarks */}
          {tickerClients.length > 0 && (
            <div className="ticker-wrap overflow-hidden border-b border-black/[0.08] py-10">
              <div className="animate-flz-ticker flex w-max items-center gap-14">
                {tickerClients.map((client, idx) => (
                  <div
                    key={`${client.id}-${idx}`}
                    className="flex items-center gap-3 opacity-70 transition-opacity hover:opacity-100"
                  >
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="h-7 max-w-[130px] object-contain grayscale"
                      />
                    ) : (
                      <span className="font-display text-lg font-medium tracking-[-0.02em] text-[#0A0B0E]">
                        {client.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clean Executive Testimonials */}
          <div className="mt-16 grid gap-10 md:grid-cols-2">
            {clients
              .filter((c) => c.quote)
              .slice(0, 2)
              .map((client) => (
                <blockquote key={client.id} className="quote-reveal flex flex-col justify-between">
                  <p className="font-display text-xl leading-relaxed font-normal tracking-[-0.015em] text-[#0A0B0E] sm:text-2xl">
                    “{client.quote}”
                  </p>
                  <footer className="mt-6 flex items-center justify-between border-t border-black/[0.08] pt-5">
                    <div>
                      <div className="text-sm font-medium text-[#0A0B0E]">
                        {client.authorName || client.name}
                      </div>
                      <div className="text-xs text-[#525866]">{client.authorRole}</div>
                    </div>
                    {client.impactMetric && (
                      <span className="text-xs font-medium text-[#0088C2]">
                        {client.impactMetric}
                      </span>
                    )}
                  </footer>
                </blockquote>
              ))}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. OPEN ROLES TEASER (LIVE FROM ADMIN PORTAL)                       */}
      {/* =================================================================== */}
      {jobs.length > 0 && (
        <section className="relative border-t border-white/[0.06] bg-[#060709] py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Careers</div>
                <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                  Join our engineering team.
                </h2>
              </div>
              <Link
                to="/careers"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8A909E] transition-colors hover:text-white"
              >
                <span>View all {jobs.length} roles</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {jobs.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  to={`/careers?role=${job.id}`}
                  className="group flex flex-col justify-between gap-2 py-5 transition-colors sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-display text-lg font-medium text-white transition-colors group-hover:text-[#00B8F4]">
                      {job.title}
                    </h3>
                    <div className="mt-0.5 text-xs text-[#8A909E]">
                      {job.department} · {job.employmentType}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#8A909E]">
                    <span>
                      {job.location} ({job.workMode})
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#5A606E] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
