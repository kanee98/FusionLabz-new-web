import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
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
    title: 'AI & Computer Vision Systems',
    summary:
      'Real-time multi-camera CCTV facial recognition and access control that automatically flags Paid vs. Unpaid members straight from live IP camera feeds.',
  },
  {
    num: '02',
    title: 'Windows Desktop Applications',
    summary:
      'Fast, offline-capable desktop software engineered with SQL Server—such as our Gym Workout Scheduler and CCTV Access Control suite.',
  },
  {
    num: '03',
    title: 'Web Platforms & Brand Flagships',
    summary:
      'High-speed, mobile-first websites and business portals built for real conversion, SEO clarity, and modern visual authority.',
  },
  {
    num: '04',
    title: 'Custom Business & Listing Portals',
    summary:
      'Verified real estate platforms, boutique travel experiences, and lead-capture engines tailored for Sri Lankan and international audiences.',
  },
  {
    num: '05',
    title: 'Cloud Deployment & Support',
    summary:
      'Secure production hosting, MySQL & SQL Server engineering, performance tuning, and ongoing long-term technical partnership.',
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
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Subtle physical 3D hover tilt on the flagship hero showcase stage
  const handleStageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el || window.innerWidth < 1024) return;
    const rect = el.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -4.2;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 4.2;
    gsap.to(el, {
      rotateX: rx,
      rotateY: ry,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const handleStageLeave = () => {
    const el = stageRef.current;
    if (!el) return;
    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.65,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Mask & Stagger
      gsap.fromTo(
        '.hero-line',
        { yPercent: 112, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.0,
          stagger: 0.11,
          ease: 'power4.out',
        }
      );

      gsap.fromTo(
        '.hero-sub',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.22,
        }
      );

      if (prefersReduced) return;

      // 2. Hero subtle scroll lift & fade
      gsap.to('.hero-copy-block', {
        y: -52,
        opacity: 0.28,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: '55% top',
          scrub: true,
        },
      });

      // 3. Flagship Stage 3D Scroll Unfold (Apple Keynote / Linear choreography)
      gsap.fromTo(
        '.hero-stage-frame',
        { rotateX: 13, scale: 0.91, y: 44 },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-stage-wrap',
            start: 'top 94%',
            end: 'top 20%',
            scrub: 0.75,
          },
        }
      );

      // 4. Editorial Statement Word-by-Word Scroll Scrub + Rule Draw
      gsap.fromTo(
        '.statement-word',
        { opacity: 0.18, y: 6 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.045,
          ease: 'none',
          scrollTrigger: {
            trigger: '.statement-section',
            start: 'top 78%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        }
      );

      gsap.fromTo(
        '.statement-rule',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          ease: 'none',
          scrollTrigger: {
            trigger: '.statement-section',
            start: 'top 65%',
            end: 'bottom 45%',
            scrub: 0.6,
          },
        }
      );

      // 5. Capabilities Vertical Progress Rail + Card Reveals
      gsap.fromTo(
        '.capabilities-rail-fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: {
            trigger: '.capabilities-list',
            start: 'top 65%',
            end: 'bottom 55%',
            scrub: 0.5,
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
          { y: 34, opacity: 0, scale: 0.985 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // 6. Desktop Pinned Horizontal Work Gallery with Velocity-Skew Physics + Image Parallax
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const section = gallerySectionRef.current;
        const track = galleryTrackRef.current;
        if (!section || !track) return;

        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120);
        if (getDistance() <= 40) return;

        const cards = gsap.utils.toArray<HTMLElement>('.gallery-card-skew');
        const skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.35, ease: 'power3.out' });

        const horizontalTween = gsap.to(track, {
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
            onUpdate: (self) => {
              const v = gsap.utils.clamp(-2.2, 2.2, self.getVelocity() / -950);
              skewTo(v);
            },
          },
        });

        // Subtle internal horizontal image parallax inside each card
        gsap.utils.toArray<HTMLElement>('.gallery-parallax-img').forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -5, scale: 1.1 },
            {
              xPercent: 5,
              scale: 1.1,
              ease: 'none',
              scrollTrigger: {
                trigger: img,
                containerAnimation: horizontalTween,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            }
          );
        });
      });

      // 7. Rolling Metrics + Accent Line Draw + Staggered Quotes
      gsap.utils.toArray<HTMLElement>('.metric-num').forEach((el) => {
        const target = parseFloat(el.dataset.target || '0');
        const decimals = (el.dataset.target || '').includes('.') ? 1 : 0;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.35,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = decimals > 0 ? obj.val.toFixed(decimals) : String(Math.round(obj.val));
          },
        });
      });

      gsap.fromTo(
        '.metric-bar',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.metrics-row',
            start: 'top 86%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.quote-reveal',
        { y: 36, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.quotes-grid',
            start: 'top 84%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.career-teaser-row',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.career-teaser-list',
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, rootRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 220);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [featuredProjects.length]);

  const stats = settings?.stats?.length
    ? settings.stats
    : [
        { label: 'Flagship products', value: '2', suffix: '' },
        { label: 'Custom architecture', value: '100', suffix: '%' },
        { label: 'Target availability', value: '99.9', suffix: '%' },
        { label: 'Direct response SLA', value: '24', suffix: 'h' },
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
            FusionLabz builds real-time AI vision software, Windows desktop applications, and
            high-craft web platforms from Kandy, Sri Lanka for clients worldwide.
          </p>

          <div className="hero-sub mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0052FF] px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_32px_-8px_rgba(0,82,255,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0040CC]"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-2 rounded-full border border-[#09152B]/12 bg-white/80 px-6 py-3.5 text-sm font-medium text-[#09152B] shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#0052FF]/40 hover:bg-white hover:text-[#0052FF]"
            >
              <span>Explore work</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="hero-sub mt-10 flex justify-center">
            <button
              type="button"
              onClick={() =>
                document.getElementById('flagship-stage')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52627A] transition-colors hover:text-[#0052FF]"
            >
              <span>Scroll to explore</span>
              <ArrowDown className="h-3.5 w-3.5 animate-bounce text-[#0052FF]" />
            </button>
          </div>
        </div>

        {/* Scroll-Unfolding 3D Product Stage with Subtle Specular Hover Tilt */}
        {heroShowcase && (
          <div
            id="flagship-stage"
            className="hero-stage-wrap mx-auto mt-14 max-w-6xl px-6 sm:mt-20 lg:px-8"
            style={{ perspective: '1400px' }}
          >
            <div
              ref={stageRef}
              onMouseMove={handleStageMove}
              onMouseLeave={handleStageLeave}
              onClick={() => onSelectProject(heroShowcase)}
              style={{ transformStyle: 'preserve-3d' }}
              className="hero-stage-frame group relative cursor-pointer overflow-hidden rounded-3xl border border-white/80 bg-[#071633] p-2 shadow-[0_40px_110px_-24px_rgba(0,68,229,0.28)] ring-1 ring-[#0052FF]/15"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                {heroShowcase.coverImage && (
                  <img
                    src={heroShowcase.coverImage}
                    alt={heroShowcase.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#061533]/92 via-[#061533]/15 to-transparent" />

                <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 sm:right-10 sm:bottom-8 sm:left-10 sm:flex-row sm:items-end">
                  <div>
                    <div className="inline-flex rounded-full bg-[#00B8F4]/25 px-3 py-1 text-xs font-medium text-[#7CE7FF] backdrop-blur-md">
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
      <section className="statement-section relative border-t border-[#09152B]/[0.06] bg-white/92 py-28 backdrop-blur-sm sm:py-40">
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
          <div className="statement-rule mt-12 h-[2px] w-full bg-gradient-to-r from-[#0052FF] via-[#00B8F4] to-transparent" />
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. CAPABILITIES — GLACIER BLUE INDEX WITH ANIMATED SCROLL RAIL      */}
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
                From computer-vision Windows software to bespoke client websites, every system is
                architected for real daily use.
              </p>
            </div>

            <div className="capabilities-list relative pl-5 sm:pl-7 lg:col-span-8">
              {/* Vertical Scroll-Scrubbed Sapphire Progress Rail */}
              <div className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-[#D6E4FA]">
                <div className="capabilities-rail-fill h-full w-full rounded-full bg-gradient-to-b from-[#0052FF] to-[#00B8F4]" />
              </div>

              <div className="space-y-3">
                {SERVICES.map((srv, idx) => {
                  const isActive = idx === activeService;
                  return (
                    <div
                      key={srv.num}
                      onMouseEnter={() => setActiveService(idx)}
                      className={`service-row rounded-2xl border p-7 transition-all duration-300 sm:p-8 ${
                        isActive
                          ? 'border-[#0052FF]/35 bg-white shadow-[0_18px_45px_-20px_rgba(0,82,255,0.22)]'
                          : 'border-[#D9E6F9] bg-white/65 hover:bg-white'
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
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. SELECTED WORK — VELOCITY-RESPONSIVE SAPPHIRE HORIZONTAL GALLERY  */}
      {/* =================================================================== */}
      <section
        ref={gallerySectionRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#071A40] via-[#0B265C] to-[#061638] py-24 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:py-16"
      >
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
              Products & client builds.
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
              className="gallery-card-skew group w-[85vw] shrink-0 cursor-pointer will-change-transform sm:w-[62vw] lg:w-[490px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/15 bg-[#06122B] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
                {project.coverImage && (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    loading="lazy"
                    className="gallery-parallax-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-[#60A5FA]">
                    {project.type} · {project.category} · {project.year}
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
              From AI consulting firms and real estate platforms to boutique travel operators and
              fitness centers, we build software people rely on every day.
            </p>
          </div>

          {/* Vibrant Blue Spectrum Rolling Metrics */}
          <div className="metrics-row grid grid-cols-2 gap-8 border-b border-slate-200/80 py-14 lg:grid-cols-4">
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
                <div className="metric-bar mt-3 h-[2px] w-10 bg-gradient-to-r from-[#0052FF] to-[#00B8F4]" />
                <div className="mt-2.5 text-xs font-medium text-[#52627A]">{s.label}</div>
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
                    className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100"
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
          <div className="quotes-grid mt-16 grid gap-8 md:grid-cols-2">
            {clients
              .filter((c) => c.quote)
              .slice(0, 2)
              .map((client) => (
                <blockquote
                  key={client.id}
                  className="quote-reveal flex flex-col justify-between rounded-2xl border border-[#DCE8FA] bg-[#F7FAFF] p-8 transition-shadow hover:shadow-[0_20px_50px_-24px_rgba(0,82,255,0.18)]"
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

            <div className="career-teaser-list space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  to={`/careers?role=${job.id}`}
                  className="career-teaser-row group flex flex-col justify-between gap-3 rounded-2xl border border-[#DCE8FA] bg-white px-6 py-5 transition-all hover:-translate-y-0.5 hover:border-[#0052FF]/40 hover:shadow-[0_12px_30px_-14px_rgba(0,82,255,0.2)] sm:flex-row sm:items-center"
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
