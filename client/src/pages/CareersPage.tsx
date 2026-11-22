import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import type { Job } from '../types';
import { publicApi } from '../lib/api';

const PRINCIPLES = [
  {
    title: 'Small, senior teams',
    body: 'We keep squads lean so every engineer and designer has direct ownership over architecture and product quality.',
  },
  {
    title: 'Meaningful problems',
    body: 'Work on live enterprise platforms, financial systems, and proprietary SaaS products serving global users.',
  },
  {
    title: 'Flexible & modern',
    body: 'Hybrid Colombo workspace or remote flexibility, supported by competitive compensation and performance rewards.',
  },
];

export function CareersPage({ jobs }: { jobs: Job[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [department, setDepartment] = useState('All');
  const [workMode, setWorkMode] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(searchParams.get('role'));
  const [applyingJob, setApplyingJob] = useState<Job | 'general' | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receiptId, setReceiptId] = useState('');

  const departments = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => j.department && s.add(j.department));
    return ['All', ...Array.from(s)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (department !== 'All' && j.department !== department) return false;
      if (workMode !== 'All' && j.workMode !== workMode) return false;
      return true;
    });
  }, [jobs, department, workMode]);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role) setExpandedId(role);
  }, [searchParams]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.careers-fade',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!applyingJob) return;
    document.body.style.overflow = 'hidden';
    window.__flzLenis?.stop();
    return () => {
      document.body.style.overflow = '';
      window.__flzLenis?.start();
    };
  }, [applyingJob]);

  const openApplication = (target: Job | 'general') => {
    setError('');
    setReceiptId('');
    setApplyingJob(target);
  };

  const closeApplication = () => {
    setApplyingJob(null);
    if (searchParams.get('role')) setSearchParams({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('jobId', applyingJob === 'general' || !applyingJob ? 'general' : applyingJob.id);
      fd.append('fullName', fullName);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('portfolioUrl', portfolioUrl);
      fd.append('experienceYears', experienceYears);
      fd.append('coverNote', coverNote);
      if (resumeFile) fd.append('resume', resumeFile);

      const res = await publicApi.submitApplication(fd);
      setReceiptId(res.applicationId);
      setFullName('');
      setEmail('');
      setPhone('');
      setPortfolioUrl('');
      setExperienceYears('');
      setCoverNote('');
      setResumeFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Hero */}
        <div className="careers-fade flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Careers</div>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-white sm:text-6xl">
              Do your best engineering work here.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#8A909E]">
              We’re hiring thoughtful engineers, designers, and cloud architects who care deeply
              about craft and clarity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openApplication('general')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/35 md:self-auto"
          >
            General application <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* 3 Quiet Culture Pillars */}
        <div className="careers-fade mt-16 grid gap-8 border-y border-white/[0.08] py-12 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title}>
              <h2 className="font-display text-lg font-medium text-white">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#8A909E]">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Open Roles Controls */}
        <div className="careers-fade mt-16 flex flex-wrap items-center justify-between gap-4 pb-6">
          <h2 className="font-display text-2xl font-medium tracking-tight text-white">
            Open positions ({filteredJobs.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {departments.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepartment(d)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  department === d ? 'bg-white text-[#060709]' : 'text-[#8A909E] hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}

            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              aria-label="Filter by work mode"
              className="rounded-full border border-white/12 bg-[#0B0D12] px-3.5 py-1.5 text-xs text-white"
            >
              <option value="All">All modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>

        {/* Roles List */}
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {filteredJobs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base text-white">No open roles match your filter.</p>
              <button
                type="button"
                onClick={() => openApplication('general')}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#060709]"
              >
                Send general application <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isOpen = expandedId === job.id;
              return (
                <div key={job.id} className="py-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : job.id)}
                    className="flex w-full flex-col justify-between gap-3 py-5 text-left sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="font-display text-xl font-medium tracking-tight text-white">
                        {job.title}
                      </h3>
                      <div className="mt-1 text-xs text-[#8A909E]">
                        {job.department} · {job.location} ({job.workMode}) · {job.employmentType} ·{' '}
                        {job.experience}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-[#8A909E]">
                      <span>{isOpen ? 'Close' : 'View details'}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6 sm:p-8">
                      <p className="max-w-3xl text-sm leading-relaxed text-[#C4CAD4]">
                        {job.summary}
                      </p>

                      {job.salaryRange && (
                        <div className="mt-4 text-xs text-[#8A909E]">
                          Compensation: <span className="text-white">{job.salaryRange}</span>
                        </div>
                      )}

                      <div className="mt-8 grid gap-8 md:grid-cols-2">
                        {job.responsibilities?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-white">Responsibilities</h4>
                            <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-[#8A909E]">
                              {job.responsibilities.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#00B8F4]" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.requirements?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-white">Requirements</h4>
                            <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-[#8A909E]">
                              {job.requirements.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {job.techStack?.length > 0 && (
                        <div className="mt-7 flex flex-wrap gap-2">
                          {job.techStack.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-white/[0.09] px-3 py-1 text-xs text-[#A3AAB8]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-8 flex items-center justify-end border-t border-white/[0.07] pt-6">
                        <button
                          type="button"
                          onClick={() => openApplication(job)}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#060709] transition-colors hover:bg-[#E6ECF5]"
                        >
                          Apply for this role <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Application Modal */}
      {applyingJob && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={closeApplication}
        >
          <div
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/12 bg-[#0B0D12] p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="text-xs font-medium text-[#00B8F4]">Apply to FusionLabz</div>
                <h3 className="mt-1 font-display text-xl font-medium text-white">
                  {applyingJob === 'general' ? 'General Application' : applyingJob.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeApplication}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#8A909E] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {receiptId ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-400" />
                <h4 className="mt-4 font-display text-2xl font-medium text-white">
                  Application submitted
                </h4>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[#8A909E]">
                  Thank you for applying. Our engineering team reviews every application directly.
                </p>
                <div className="mt-4 text-xs text-[#6B7280]">Reference: {receiptId}</div>
                <button
                  type="button"
                  onClick={closeApplication}
                  className="mt-7 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#060709]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                      Full name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Perera"
                      className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                      Email address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@domain.com"
                      className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g. 4 years"
                      className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                    LinkedIn, GitHub, or Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                    Resume / CV (PDF, DOC, DOCX — max 6MB)
                  </label>
                  {resumeFile ? (
                    <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-4 w-4 shrink-0 text-[#00B8F4]" />
                        <span className="truncate text-sm text-white">{resumeFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="text-[#8A909E] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#060709] px-6 py-6 text-center transition-colors hover:border-white/30">
                      <Upload className="h-5 w-5 text-[#8A909E]" />
                      <span className="mt-2 text-sm text-white">Upload your resume</span>
                      <span className="mt-0.5 text-xs text-[#6B7280]">PDF, DOC, or DOCX up to 6MB</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                    Short note
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Tell us about something you built or why you'd like to join..."
                    className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeApplication}
                    className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-[#A3AAB8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#060709] hover:bg-[#E6ECF5] disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
