import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Search } from 'lucide-react';
import type { Client, Project } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface PortfolioPageProps {
  projects: Project[];
  clients: Client[];
  onSelectProject: (project: Project) => void;
}

export function PortfolioPage({ projects, clients, onSelectProject }: PortfolioPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (selectedType !== 'All' && p.type !== selectedType) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${p.title} ${p.summary} ${p.clientName} ${p.category} ${(p.techStack || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, selectedType, selectedCategory, query]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.work-fade',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out' }
      );
      if (prefersReduced) return;
      gsap.utils.toArray<HTMLElement>('.work-card-reveal').forEach((card) => {
        gsap.fromTo(
          card,
          { y: 36, opacity: 0, scale: 0.985 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 86%', once: true },
          }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, [filtered.length]);

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pt-36 pb-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="work-fade max-w-2xl">
          <div className="text-xs font-semibold tracking-wide text-[#0052FF]">Work & Products</div>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-[#09152B] sm:text-6xl">
            Selected platforms and{' '}
            <span className="bg-gradient-to-r from-[#0052FF] to-[#00B8F4] bg-clip-text text-transparent">
              products.
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#475569]">
            Proprietary software suites and bespoke systems built in partnership with teams across
            FinTech, education, commerce, logistics, and SaaS.
          </p>
        </div>

        {/* Clean Filter Bar */}
        <div className="work-fade mt-12 flex flex-col justify-between gap-4 rounded-2xl border border-[#DCE8FA] bg-white/85 p-4 shadow-sm backdrop-blur-md md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Flagship Product', 'Portfolio Project'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === t
                    ? 'bg-[#0052FF] text-white shadow-sm'
                    : 'text-[#52627A] hover:bg-[#EFF6FF] hover:text-[#0052FF]'
                }`}
              >
                {t}
              </button>
            ))}

            <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:inline-block" />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="rounded-full border border-[#DCE8FA] bg-[#F8FBFF] px-3.5 py-1.5 text-xs font-medium text-[#09152B]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All industries' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-full border border-[#DCE8FA] bg-[#F8FBFF] py-2 pr-4 pl-9 text-xs text-[#09152B] placeholder-slate-400"
            />
          </div>
        </div>

        {/* Editorial Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-medium text-[#09152B]">No matching projects found.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedType('All');
                setSelectedCategory('All');
                setQuery('');
              }}
              className="mt-3 text-xs font-semibold text-[#0052FF] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {filtered.map((project) => (
              <article
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="work-card-reveal group cursor-pointer overflow-hidden rounded-2xl border border-[#DCE8FA] bg-white shadow-[0_14px_40px_-22px_rgba(9,21,43,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0052FF]/35 hover:shadow-[0_24px_55px_-22px_rgba(0,82,255,0.22)]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#071633]">
                  {project.coverImage && (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-[#0052FF]">
                        {project.type} · {project.category} · {project.year}
                      </div>
                      <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-[#09152B] transition-colors group-hover:text-[#0052FF]">
                        {project.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#52627A]">
                        {project.summary}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0052FF]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Client Roster */}
        {clients.length > 0 && (
          <section className="mt-28 border-t border-[#DCE8FA] pt-20">
            <div className="mb-12">
              <div className="text-xs font-semibold tracking-wide text-[#0052FF]">Clients</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-[#09152B] sm:text-4xl">
                Organizations we partner with.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#DCE8FA] bg-white p-6 shadow-sm transition-all hover:border-[#0052FF]/35"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      {client.logoUrl ? (
                        <img
                          src={client.logoUrl}
                          alt={client.name}
                          className="h-8 max-w-[140px] object-contain"
                        />
                      ) : (
                        <h3 className="font-display text-lg font-semibold text-[#09152B]">
                          {client.name}
                        </h3>
                      )}
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={client.name}
                          className="text-slate-400 transition-colors hover:text-[#0052FF]"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#52627A]">{client.industry}</div>
                    {client.quote && (
                      <p className="mt-4 text-[13.5px] leading-relaxed text-[#475569]">
                        “{client.quote}”
                      </p>
                    )}
                  </div>

                  {client.impactMetric && (
                    <div className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-[#0052FF]">
                      {client.impactMetric}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
