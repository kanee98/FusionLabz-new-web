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

const ACCENT_WORDS = new Set(['effortless', 'deliberate.', 'engineering', 'product', 'craft.']);

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

      gsap.fromTo(
        '.statement-word',
        { opacity: 0.2 },
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
      {/* 1. LUMINOUS BLUE SILK HERO + 3D PERSPECTIVE STAGE                   */}
      {/* =================================================================== */}
      <section className="hero-section relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="hero-copy-block mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h1 className="font-display text-[clamp(2.85rem,7.2vw,5.6rem)] leading-[1.03] font-semibold tracking-[-0.045em] text-[#09152B]">
            <span className="line-mask">
              <span className="hero-line block">Software engineered</span>
            </span>
            <span className="line-mask">
              <span className="hero-line block bg-gradient-to-r from-[#0044E5] via-[#0077FF] to-[#00B8F4] bg-clip-text text-transparent">
                for what comes next.
              </span>
            </span>
          </h1>

          <p className="hero-sub mx-auto mt-7 max-w-xl text-base leading-relaxed text-[#475569] sm:text-lg">
            FusionLabz designs and engineers custom software, SaaS platforms, and enterprise
            products for ambitious organizations around the world.
          </p>

          <div className="hero-sub mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#0052FF] px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_32px_-8px_rgba(0,82,255,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0040CC]"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-[#09152B]/12 bg-white/80 px-6 py-3.5 text-sm font-medium text-[#09152B] shadow-sm backdrop-blur-md transition-all hover:border-[#0052FF]/40 hover:bg-white hover:text-[#0052FF]"
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
              className="hero-stage-frame group relative cursor-pointer overflow-hidden rounded-3xl border border-white/80 bg-[#071633] p-2 shadow-[0_40px_110px_-24px_rgba(0,68,229,0.28)] ring-1 ring-[#0052FF]/15"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                {heroShowcase.coverImage && (
                  <img
                    src={heroShowcase.coverImage}
                    alt={heroShowcase.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#061533]/92 via-[#061533]/20 to-transparent" />

                <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 sm:right-10 sm:bottom-8 sm:left-10 sm:flex-row sm:items-end">
                  <div>
                    <div className="inline-flex rounded-full bg-[#00B8F4]/20 px-3 py-1 text-xs font-medium text-[#5CE1FF] backdrop-blur-md">
                      {heroShowcase.type}
                    </div>
                    <h2 className="mt-2.5 font-display text-xl font-medium tracking-tight text-white sm:text-3xl">
                      {heroShowcase.title}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors group-hover:bg-[#00B8F4] group-hover:text-[#041129]">
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
      {/* 2. SCROLL-SCRUBBED EDITORIAL STATEMENT (PURE WHITE)                 */}
      {/* =================================================================== */}
      <section className="statement-section relative border-t border-[#09152B]/[0.06] bg-white/90 py-28 backdrop-blur-sm sm:py-40">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <p className="font-display text-2xl leading-[1.32] font-medium tracking-[-0.025em] text-[#09152B] sm:text-4xl lg:text-[2.75rem]">
            {words.map((word, idx) => (
              <span
                key={idx}
                className={`statement-word mr-[0.26em] inline-block ${
                  ACCENT_WORDS.has(word) ? 'text-[#0052FF]' : 'text-[#09152B]'
                }`}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. CAPABILITIES — GLACIER BLUE INDEX                                */}
      {/* =================================================================== */}
      <section className="relative border-t border-[#DCE8FA] bg-[#F2F7FF] py-28 sm:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <div className="text-xs font-semibold tracking-wide text-[#0052FF]">Capabilities</div>
              <h2 className="mt-3 font-display text-3xl leading-[1.08] font-semibold tracking-[-0.035em] text-[#09152B] sm:text-4xl">
                End-to-end engineering, built with clarity.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#52627A]">
                Focused senior squads covering architecture, design, delivery, and long-term scale.
              </p>
            </div>

            <div className="space-y-3 lg:col-span-8">
              {SERVICES.map((srv, idx) => {
                const isActive = idx === activeService;
                return (
                  <div
                    key={srv.num}
                    onMouseEnter={() => setActiveService(idx)}
                    className={`service-row rounded-2xl border p-7 transition-all duration-300 sm:p-8 ${
                      isActive
                        ? 'border-[#0052FF]/30 bg-white shadow-[0_18px_45px_-20px_rgba(0,82,255,0.22)]'
                        : 'border-[#D9E6F9] bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-baseline gap-6 sm:gap-8">
                      <span
                        className={`text-xs font-semibold tabular-nums transition-colors ${
                          isActive ? 'text-[#0052FF]' : 'text-[#8BA0C0]'
                        }`}
                      >
                        {srv.num}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#09152B] sm:text-2xl">
                          {srv.title}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#52627A]">
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
      {/* 4. SELECTED WORK — ROYAL SAPPHIRE HORIZONTAL GALLERY                */}
      {/* =================================================================== */}
      <section
        ref={gallerySectionRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#071A40] via-[#0B265C] to-[#061638] py-24 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:py-16"
      >
        {/* Subtle luminous azure ambient glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#00B8F4]/20 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-1/4 -bottom-32 h-96 w-96 rounded-full bg-[#2563EB]/25 blur-[130px]"
        />

        <div className="relative mx-auto mb-10 flex w-full max-w-6xl items-end justify-between gap-6 px-6 lg:px-8">
          <div>
            <div className="text-xs font-semibold tracking-wide text-[#38BDF8]">Selected work</div>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.035em] text-white sm:text-5xl">
              Products built to scale.
            </h2>
          </div>

          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A6C4F5] transition-colors hover:text-white"
          >
            <span>All work</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          ref={galleryTrackRef}
          className="relative flex gap-6 overflow-x-auto px-6 pb-4 lg:w-max lg:overflow-visible lg:px-[max(2rem,calc((100vw-72rem)/2+2rem))]"
        >
          {featuredProjects.map((project) => (
            <article
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group w-[85vw] shrink-0 cursor-pointer sm:w-[62vw] lg:w-[490px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/15 bg-[#06122B] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
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
                  <div className="text-xs font-medium text-[#60A5FA]">
                    {project.category} · {project.year}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-white transition-colors group-hover:text-[#38BDF8]">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 max-w-md text-[13.5px] leading-relaxed text-[#A8BEDF]">
                    {project.summary}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#60A5FA] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </div>
            </article>
          ))}

          <Link
            to="/portfolio"
            className="group flex w-[70vw] shrink-0 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] p-10 text-center backdrop-blur-md transition-colors hover:border-[#38BDF8] hover:bg-white/[0.1] sm:w-[360px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00B8F4]/20 text-[#38BDF8] transition-transform duration-300 group-hover:scale-105 group-hover:bg-[#00B8F4] group-hover:text-[#041129]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="mt-5 font-display text-lg font-medium text-white">
              View all {projects.length} projects
            </div>
            <p className="mt-1 text-xs text-[#A8BEDF]">Products, case studies & clients</p>
          </Link>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. METRICS, PARTNERS & TESTIMONIALS (CRISP WHITE + BLUE SPECTRUM)   */}
      {/* =================================================================== */}
      <section className="quotes-section relative z-10 bg-white py-28 text-[#09152B] sm:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 border-b border-slate-200/80 pb-14 sm:flex-row sm:items-end">
            <div>
              <BrandLogo variant="light-bg" className="h-12 sm:h-14" />
              <h2 className="mt-6 font-display text-3xl leading-[1.08] font-semibold tracking-[-0.035em] text-[#09152B] sm:text-5xl">
                Trusted by teams who
                <br />
                <span className="bg-gradient-to-r from-[#0052FF] to-[#00B8F4] bg-clip-text text-transparent">
                  value reliability.
                </span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#52627A]">
              From fast-growing startups to multi-campus institutions, our partners count on clean
              delivery and predictable outcomes.
            </p>
          </div>

          {/* Vibrant Blue Spectrum Metrics */}
          <div className="grid grid-cols-2 gap-8 border-b border-slate-200/80 py-14 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#09152B] sm:text-5xl">
                  <span className="metric-num" data-target={s.value}>
                    {s.value}
                  </span>
                  <span className="bg-gradient-to-r from-[#0052FF] to-[#00B8F4] bg-clip-text text-transparent">
                    {s.suffix || ''}
                  </span>
                </div>
                <div className="mt-2 text-xs font-medium text-[#52627A]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Partner Ticker */}
          {tickerClients.length > 0 && (
            <div className="ticker-wrap overflow-hidden border-b border-slate-200/80 py-10">
              <div className="animate-flz-ticker flex w-max items-center gap-14">
                {tickerClients.map((client, idx) => (
                  <div
                    key={`${client.id}-${idx}`}
                    className="flex items-center gap-3 opacity-75 transition-opacity hover:opacity-100"
                  >
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="h-8 max-w-[140px] object-contain"
                      />
                    ) : (
                      <span className="font-display text-lg font-semibold tracking-[-0.02em] text-[#1E3A6D]">
                        {client.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Testimonials */}
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {clients
              .filter((c) => c.quote)
              .slice(0, 2)
              .map((client) => (
                <blockquote
                  key={client.id}
                  className="quote-reveal flex flex-col justify-between rounded-2xl border border-[#DCE8FA] bg-[#F7FAFF] p-8"
                >
                  <p className="font-display text-xl leading-relaxed font-normal tracking-[-0.015em] text-[#09152B] sm:text-2xl">
                    “{client.quote}”
                  </p>
                  <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE8FA] pt-5">
                    <div>
                      <div className="text-sm font-semibold text-[#09152B]">
                        {client.authorName || client.name}
                      </div>
                      <div className="text-xs text-[#52627A]">{client.authorRole}</div>
                    </div>
                    {client.impactMetric && (
                      <span className="rounded-full bg-[#E6F1FE] px-3 py-1 text-xs font-semibold text-[#0052FF]">
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
      {/* 6. OPEN ROLES TEASER (SOFT ICE BLUE)                                */}
      {/* =================================================================== */}
      {jobs.length > 0 && (
        <section className="relative border-t border-[#DCE8FA] bg-[#F2F7FF] py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold tracking-wide text-[#0052FF]">Careers</div>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-[#09152B] sm:text-4xl">
                  Join our engineering team.
                </h2>
              </div>
              <Link
                to="/careers"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052FF] transition-colors hover:text-[#0039B3]"
              >
                <span>View all {jobs.length} roles</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  to={`/careers?role=${job.id}`}
                  className="group flex flex-col justify-between gap-3 rounded-2xl border border-[#DCE8FA] bg-white px-6 py-5 transition-all hover:border-[#0052FF]/40 hover:shadow-[0_12px_30px_-14px_rgba(0,82,255,0.2)] sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#09152B] transition-colors group-hover:text-[#0052FF]">
                      {job.title}
                    </h3>
                    <div className="mt-0.5 text-xs text-[#52627A]">
                      {job.department} · {job.employmentType}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-[#52627A]">
                    <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[#1D4ED8]">
                      {job.location} ({job.workMode})
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#0052FF] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
