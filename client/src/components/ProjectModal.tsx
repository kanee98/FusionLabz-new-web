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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0B0D11] shadow-2xl"
      >
        {/* Minimal Sticky Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-[#0B0D11]/90 px-6 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2.5 text-xs text-[#8A909E]">
            <span className="font-medium text-white">{project.type}</span>
            <span>·</span>
            <span>{project.category}</span>
            <span>·</span>
            <span>{project.year}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#8A909E] transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clean Hero Visual */}
        {project.coverImage && (
          <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/[0.07] bg-[#101319]">
            <img
              src={project.coverImage}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Editorial Body */}
        <div className="space-y-10 p-6 sm:p-10">
          <div>
            {project.clientName && (
              <p className="text-xs font-medium tracking-wide text-[#00B8F4]">
                {project.clientName}
              </p>
            )}
            <h2 className="mt-2 font-display text-2xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
              {project.title}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#A3AAB8]">
              {project.summary}
            </p>
          </div>

          {project.metrics && project.metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-6 border-y border-white/[0.07] py-6">
              {project.metrics.slice(0, 3).map((m, idx) => (
                <div key={idx}>
                  <div className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                    {m.value}
                  </div>
                  <div className="mt-1 text-xs text-[#8A909E]">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-3">
            {project.challenge && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-white">Challenge</div>
                <p className="text-[13.5px] leading-relaxed text-[#8A909E]">{project.challenge}</p>
              </div>
            )}
            {project.solution && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-white">Approach</div>
                <p className="text-[13.5px] leading-relaxed text-[#8A909E]">{project.solution}</p>
              </div>
            )}
            {project.impact && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-white">Outcome</div>
                <p className="text-[13.5px] leading-relaxed text-[#8A909E]">{project.impact}</p>
              </div>
            )}
          </div>

          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/[0.09] px-3 py-1 text-xs text-[#A3AAB8]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-[#00B8F4]"
              >
                Visit live product <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-xs text-[#6B7280]">Private enterprise deployment</span>
            )}

            <Link
              to="/contact"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#060709] transition-colors hover:bg-[#E6ECF5]"
            >
              Discuss a similar build <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
