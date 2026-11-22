import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight, Search } from 'lucide-react';
import type { Client, Project } from '../types';

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
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.work-fade',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="work-fade max-w-2xl">
          <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Work & Products</div>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-white sm:text-6xl">
            Selected platforms and products.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#8A909E]">
            Proprietary software suites and bespoke systems built in partnership with teams across
            FinTech, education, commerce, logistics, and SaaS.
          </p>
        </div>

        {/* Clean Filter Bar */}
        <div className="work-fade mt-12 flex flex-col justify-between gap-4 border-y border-white/[0.08] py-4 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Flagship Product', 'Portfolio Project'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === t
                    ? 'bg-white text-[#060709]'
                    : 'text-[#8A909E] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}

            <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline-block" />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="rounded-full border border-white/12 bg-[#0B0D12] px-3.5 py-1.5 text-xs text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All industries' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-full border border-white/10 bg-[#0B0D12] py-2 pr-4 pl-9 text-xs text-white placeholder-[#6B7280]"
            />
          </div>
        </div>

        {/* Clean Editorial Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-white">No matching projects found.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedType('All');
                setSelectedCategory('All');
                setQuery('');
              }}
              className="mt-3 text-xs text-[#00B8F4] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {filtered.map((project) => (
              <article
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="work-fade group cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E13]">
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
                      {project.type} · {project.category} · {project.year}
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-medium tracking-tight text-white transition-colors group-hover:text-[#00B8F4]">
                      {project.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#8A909E]">
                      {project.summary}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#5A606E] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Client Roster */}
        {clients.length > 0 && (
          <section className="mt-28 border-t border-white/[0.08] pt-20">
            <div className="mb-12">
              <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Clients</div>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                Organizations we partner with.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0B0D12]/80 p-6 transition-colors hover:border-white/18"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      {client.logoUrl ? (
                        <img
                          src={client.logoUrl}
                          alt={client.name}
                          className="h-7 max-w-[130px] object-contain"
                        />
                      ) : (
                        <h3 className="font-display text-lg font-medium text-white">
                          {client.name}
                        </h3>
                      )}
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={client.name}
                          className="text-[#6B7280] transition-colors hover:text-white"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[#6B7280]">{client.industry}</div>
                    {client.quote && (
                      <p className="mt-4 text-[13.5px] leading-relaxed text-[#A3AAB8]">
                        “{client.quote}”
                      </p>
                    )}
                  </div>

                  {client.impactMetric && (
                    <div className="mt-5 border-t border-white/[0.06] pt-4 text-xs font-medium text-[#00B8F4]">
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
