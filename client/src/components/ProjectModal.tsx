import { useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.__flzLenis?.stop();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.__flzLenis?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#06132E]/60 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#09152B]/10 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="rounded-full bg-[#EBF3FF] px-2.5 py-0.5 font-semibold text-[#0052FF]">
              {project.type}
            </span>
            <span>{project.category}</span>
            <span>·</span>
            <span>{project.year}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-[#0052FF] hover:text-[#0052FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {project.coverImage && (
          <div className="aspect-[16/9] w-full overflow-hidden border-b border-slate-200/80 bg-[#071633]">
            <img
              src={project.coverImage}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-9 p-6 sm:p-10">
          <div>
            {project.clientName && (
              <p className="text-xs font-semibold tracking-wide text-[#0052FF]">
                {project.clientName}
              </p>
            )}
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[#09152B] sm:text-4xl">
              {project.title}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#475569]">
              {project.summary}
            </p>
          </div>

          {project.metrics && project.metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-6 rounded-2xl bg-[#F2F7FF] p-6">
              {project.metrics.slice(0, 3).map((m, idx) => (
                <div key={idx}>
                  <div className="font-display text-2xl font-semibold tracking-tight text-[#0052FF] sm:text-3xl">
                    {m.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#52627A]">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-3">
            {project.challenge && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#09152B]">Challenge</div>
                <p className="text-[13.5px] leading-relaxed text-[#52627A]">{project.challenge}</p>
              </div>
            )}
            {project.solution && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#09152B]">Approach</div>
                <p className="text-[13.5px] leading-relaxed text-[#52627A]">{project.solution}</p>
              </div>
            )}
            {project.impact && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#0052FF]">Outcome</div>
                <p className="text-[13.5px] leading-relaxed text-[#52627A]">{project.impact}</p>
              </div>
            )}
          </div>

          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[#DBEAFE] bg-[#F5F9FF] px-3 py-1 text-xs font-medium text-[#1E3A8A]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052FF] transition-colors hover:text-[#0039B3]"
              >
                Visit live product <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-xs text-slate-500">Private enterprise deployment</span>
            )}

            <Link
              to="/contact"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-[#0052FF] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_-6px_rgba(0,82,255,0.45)] transition-colors hover:bg-[#0040CC]"
            >
              Discuss a similar build <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
