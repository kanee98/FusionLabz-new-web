import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Check,
  Download,
  ExternalLink,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { adminApi, getStoredToken } from '../../lib/api';
import type {
  AdminUser,
  Application,
  Client,
  DashboardData,
  Inquiry,
  Job,
  MetricItem,
  Project,
  SiteSettings,
} from '../../types';
import { AdminLogin } from './AdminLogin';

type TabKey =
  | 'overview'
  | 'projects'
  | 'clients'
  | 'jobs'
  | 'applications'
  | 'inquiries'
  | 'settings';

export function AdminPortal({ onDataMutated }: { onDataMutated: () => void }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Admin datasets
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Modals
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);

  const notify = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadAll = useCallback(async () => {
    const [dashRes, prjRes, cliRes, jobRes, appRes, inqRes, setRes] = await Promise.all([
      adminApi.dashboard(),
      adminApi.getProjects(),
      adminApi.getClients(),
      adminApi.getJobs(),
      adminApi.getApplications(),
      adminApi.getInquiries(),
      adminApi.getSettings(),
    ]);
    setDashboard(dashRes);
    setProjects(prjRes.projects);
    setClients(cliRes.clients);
    setJobs(jobRes.jobs);
    setApplications(appRes.applications);
    setInquiries(inqRes.inquiries);
    setSiteSettings(setRes.settings);
  }, []);

  useEffect(() => {
    adminApi
      .me()
      .then((res) => {
        setAdmin(res.admin);
        return loadAll();
      })
      .catch(() => setAdmin(null))
      .finally(() => setCheckingAuth(false));
  }, [loadAll]);

  const refreshAfterMutation = async (message: string) => {
    await loadAll();
    onDataMutated();
    notify(message);
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060709] text-xs tracking-[0.2em] text-slate-400 uppercase">
        Verifying Session...
      </div>
    );
  }

  if (!admin) {
    return (
      <AdminLogin
        onSuccess={async (user) => {
          setAdmin(user);
          await loadAll();
        }}
      />
    );
  }

  const navItems: { key: TabKey; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'projects', label: 'Projects & Portfolio', icon: FolderKanban },
    { key: 'clients', label: 'Clients', icon: Building2 },
    { key: 'jobs', label: 'Job Listings', icon: Briefcase },
    {
      key: 'applications',
      label: 'Applications',
      icon: Users,
      badge: dashboard?.counts.newApplications || 0,
    },
    {
      key: 'inquiries',
      label: 'Contact Inquiries',
      icon: Inbox,
      badge: dashboard?.counts.unreadInquiries || 0,
    },
    { key: 'settings', label: 'Site & Security', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await adminApi.logout();
    setAdmin(null);
  };

  return (
    <div className="flex min-h-screen bg-[#060709] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-5 bottom-5 z-[110] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl ${
            toast.type === 'ok'
              ? 'border-[#00B8F4]/40 bg-[#08131E] text-white'
              : 'border-red-500/40 bg-red-950/90 text-red-200'
          }`}
        >
          <Check className="h-4 w-4 text-[#00B8F4]" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col justify-between border-r border-white/[0.08] bg-[#090B0F] p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-6">
            <BrandLogo variant="dark-bg" className="h-8" />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3 text-[10px] tracking-[0.2em] text-slate-500 uppercase">
            Management Console
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#00B8F4]/15 text-white ring-1 ring-[#00B8F4]/40'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${active ? 'text-[#00B8F4]' : ''}`} />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-[#00B8F4] px-2 py-0.5 text-[10px] font-bold text-[#05070A]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/[0.08] pt-5">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="truncate text-xs font-semibold text-white">{admin.name}</div>
            <div className="truncate text-[10px] text-slate-500">{admin.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs text-slate-300 hover:border-[#00B8F4] hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live Site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:border-red-500/40 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#060709]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-display text-lg font-semibold capitalize text-white">
              {navItems.find((n) => n.key === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setEditingProject({
                  type: 'Portfolio Project',
                  category: 'Web & SaaS',
                  year: String(new Date().getFullYear()),
                  techStack: [],
                  metrics: [{ label: '', value: '' }],
                  featured: true,
                  published: true,
                  order: projects.length + 1,
                })
              }
              className="hidden items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white hover:border-[#00B8F4] sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5 text-[#00B8F4]" />
              Project
            </button>
            <button
              type="button"
              onClick={() =>
                setEditingJob({
                  department: 'Core Engineering',
                  location: 'Colombo, Sri Lanka',
                  workMode: 'Hybrid',
                  employmentType: 'Full-time',
                  experience: '2+ Years',
                  status: 'open',
                  responsibilities: [],
                  requirements: [],
                  techStack: [],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00B8F4] px-3.5 py-1.5 text-xs font-bold text-[#05070A] hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Post Job
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8">
          {/* ---------------- OVERVIEW TAB ---------------- */}
          {activeTab === 'overview' && dashboard && (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: 'Published Projects', val: dashboard.counts.publishedProjects, tab: 'projects' as TabKey },
                  { label: 'Partner Clients', val: dashboard.counts.clients, tab: 'clients' as TabKey },
                  { label: 'Open Job Roles', val: dashboard.counts.openJobs, tab: 'jobs' as TabKey },
                  { label: 'New Applications', val: dashboard.counts.newApplications, tab: 'applications' as TabKey, accent: true },
                  { label: 'Unread Inquiries', val: dashboard.counts.unreadInquiries, tab: 'inquiries' as TabKey, accent: true },
                ].map((kpi) => (
                  <button
                    key={kpi.label}
                    type="button"
                    onClick={() => setActiveTab(kpi.tab)}
                    className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-5 text-left transition-colors hover:border-[#00B8F4]/50"
                  >
                    <div className="text-[10px] tracking-[0.15em] text-slate-500 uppercase">
                      {kpi.label}
                    </div>
                    <div
                      className={`mt-2 font-display text-4xl font-bold ${
                        kpi.accent && kpi.val > 0 ? 'text-[#00B8F4]' : 'text-white'
                      }`}
                    >
                      {kpi.val}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <h2 className="font-display text-base font-semibold text-white">
                      Recent Candidate Applications
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('applications')}
                      className="text-xs text-[#00B8F4]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="mt-4 divide-y divide-white/[0.06]">
                    {dashboard.recentApplications.length === 0 ? (
                      <p className="py-6 text-sm text-slate-500">No applications received yet.</p>
                    ) : (
                      dashboard.recentApplications.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-3.5">
                          <div>
                            <div className="text-sm font-medium text-white">{a.fullName}</div>
                            <div className="text-xs text-slate-400">{a.jobTitle}</div>
                          </div>
                          <span className="rounded-full border border-[#00B8F4]/30 bg-[#00B8F4]/10 px-2.5 py-0.5 text-[10px] text-[#00B8F4] uppercase">
                            {a.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <h2 className="font-display text-base font-semibold text-white">
                      Recent Contact Inquiries
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inquiries')}
                      className="text-xs text-[#00B8F4]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="mt-4 divide-y divide-white/[0.06]">
                    {dashboard.recentInquiries.length === 0 ? (
                      <p className="py-6 text-sm text-slate-500">No project inquiries yet.</p>
                    ) : (
                      dashboard.recentInquiries.map((inq) => (
                        <div key={inq.id} className="flex items-center justify-between py-3.5">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {inq.fullName}{' '}
                              <span className="text-xs text-slate-500">
                                ({inq.ticketId})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {inq.company || inq.email} • {inq.budget}
                            </div>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-slate-300 uppercase">
                            {inq.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PROJECTS TAB ---------------- */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-400">
                  Manage portfolio case studies & flagship products displayed on Home and /portfolio.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProject({
                      type: 'Portfolio Project',
                      category: 'Web & SaaS',
                      year: String(new Date().getFullYear()),
                      techStack: [],
                      metrics: [{ label: '', value: '' }],
                      featured: true,
                      published: true,
                      order: projects.length + 1,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00B8F4] px-4 py-2.5 text-xs font-bold text-[#05070A] uppercase"
                >
                  <Plus className="h-4 w-4" /> Add New Project
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D12]"
                  >
                    <div className="relative aspect-[16/9] bg-[#0E1522]">
                      {p.coverImage && (
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="rounded bg-[#060709]/85 px-2 py-0.5 text-[10px] text-[#00B8F4]">
                          {p.type}
                        </span>
                        {p.featured && (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                            Featured
                          </span>
                        )}
                        {!p.published && (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="text-[11px] text-slate-500">
                          {p.category} • {p.year}
                        </div>
                        <h3 className="mt-1 font-display text-lg font-semibold text-white">
                          {p.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">{p.summary}</p>
                      </div>

                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingProject(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white hover:border-[#00B8F4]"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Delete "${p.title}"?`)) return;
                            await adminApi.deleteProject(p.id);
                            await refreshAfterMutation('Project removed.');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- CLIENTS TAB ---------------- */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-400">
                  Add client logos, industries, testimonials, and impact metrics shown across the site.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingClient({
                      featured: true,
                      order: clients.length + 1,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00B8F4] px-4 py-2.5 text-xs font-bold text-[#05070A] uppercase"
                >
                  <Plus className="h-4 w-4" /> Add Client
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={c.name}
                            className="h-9 max-w-[130px] object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#00B8F4]/30 bg-[#00B8F4]/10 font-display text-sm font-bold text-[#00B8F4]">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 uppercase">
                          {c.industry}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold text-white">
                        {c.name}
                      </h3>
                      {c.quote && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">
                          “{c.quote}”
                        </p>
                      )}
                      {c.impactMetric && (
                        <div className="mt-3 text-[11px] text-emerald-400">
                          {c.impactMetric}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingClient(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white hover:border-[#00B8F4]"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Delete client "${c.name}"?`)) return;
                          await adminApi.deleteClient(c.id);
                          await refreshAfterMutation('Client removed.');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- JOBS TAB ---------------- */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-400">
                  Publish, pause, or update open positions live on the /careers portal.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingJob({
                      department: 'Core Engineering',
                      location: 'Colombo, Sri Lanka',
                      workMode: 'Hybrid',
                      employmentType: 'Full-time',
                      experience: '2+ Years',
                      status: 'open',
                      responsibilities: [],
                      requirements: [],
                      techStack: [],
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00B8F4] px-4 py-2.5 text-xs font-bold text-[#05070A] uppercase"
                >
                  <Plus className="h-4 w-4" /> Create Job Listing
                </button>
              </div>

              <div className="space-y-4">
                {jobs.map((j) => {
                  const appCount = applications.filter((a) => a.jobId === j.id).length;
                  return (
                    <div
                      key={j.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase">
                          <span
                            className={`rounded-full px-2.5 py-0.5 ${
                              j.status === 'open'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : j.status === 'paused'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-slate-700/40 text-slate-400'
                            }`}
                          >
                            {j.status}
                          </span>
                          <span className="text-[#00B8F4]">{j.department}</span>
                          <span className="text-slate-500">
                            • {j.workMode} • {j.location}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-xl font-semibold text-white">
                          {j.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {appCount} applicant{appCount === 1 ? '' : 's'} • {j.employmentType} •{' '}
                          {j.experience}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={j.status}
                          onChange={async (e) => {
                            await adminApi.updateJob(j.id, {
                              status: e.target.value as Job['status'],
                            });
                            await refreshAfterMutation('Job status updated.');
                          }}
                          className="rounded-lg border border-white/12 bg-[#060709] px-3 py-1.5 text-xs text-white"
                        >
                          <option value="open">Open</option>
                          <option value="paused">Paused</option>
                          <option value="closed">Closed</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setEditingJob(j)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white hover:border-[#00B8F4]"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Delete job "${j.title}"?`)) return;
                            await adminApi.deleteJob(j.id);
                            await refreshAfterMutation('Job listing deleted.');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------- APPLICATIONS TAB ---------------- */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-12 text-center text-sm text-slate-400">
                  No candidate applications yet.
                </div>
              ) : (
                applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onUpdate={async (patch) => {
                      await adminApi.updateApplication(app.id, patch);
                      await refreshAfterMutation('Application updated.');
                    }}
                    onDelete={async () => {
                      if (!confirm(`Delete application from ${app.fullName}?`)) return;
                      await adminApi.deleteApplication(app.id);
                      await refreshAfterMutation('Application deleted.');
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* ---------------- INQUIRIES TAB ---------------- */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              {inquiries.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-12 text-center text-sm text-slate-400">
                  No contact inquiries yet.
                </div>
              ) : (
                inquiries.map((inq) => (
                  <InquiryCard
                    key={inq.id}
                    inq={inq}
                    onUpdate={async (patch) => {
                      await adminApi.updateInquiry(inq.id, patch);
                      await refreshAfterMutation('Inquiry updated.');
                    }}
                    onDelete={async () => {
                      if (!confirm(`Delete inquiry ${inq.ticketId}?`)) return;
                      await adminApi.deleteInquiry(inq.id);
                      await refreshAfterMutation('Inquiry deleted.');
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* ---------------- SETTINGS TAB ---------------- */}
          {activeTab === 'settings' && siteSettings && (
            <SettingsPanel
              settings={siteSettings}
              admin={admin}
              onSaved={async (msg) => refreshAfterMutation(msg)}
              onAdminUpdated={(next) => setAdmin(next)}
              onError={(msg) => notify(msg, 'err')}
            />
          )}
        </main>
      </div>

      {/* ---------------- PROJECT CREATE/EDIT MODAL ---------------- */}
      {editingProject && (
        <ProjectEditorModal
          initial={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={async (payload) => {
            if (editingProject.id) {
              await adminApi.updateProject(editingProject.id, payload);
              await refreshAfterMutation('Project updated.');
            } else {
              await adminApi.createProject(payload);
              await refreshAfterMutation('New project published.');
            }
            setEditingProject(null);
          }}
        />
      )}

      {/* ---------------- CLIENT CREATE/EDIT MODAL ---------------- */}
      {editingClient && (
        <ClientEditorModal
          initial={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={async (payload) => {
            if (editingClient.id) {
              await adminApi.updateClient(editingClient.id, payload);
              await refreshAfterMutation('Client updated.');
            } else {
              await adminApi.createClient(payload);
              await refreshAfterMutation('New client added.');
            }
            setEditingClient(null);
          }}
        />
      )}

      {/* ---------------- JOB CREATE/EDIT MODAL ---------------- */}
      {editingJob && (
        <JobEditorModal
          initial={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={async (payload) => {
            if (editingJob.id) {
              await adminApi.updateJob(editingJob.id, payload);
              await refreshAfterMutation('Job listing updated.');
            } else {
              await adminApi.createJob(payload);
              await refreshAfterMutation('New job published to /careers.');
            }
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
}

/* ========================================================================== */
/* SUB-COMPONENTS FOR CLEAN ADMIN UX                                          */
/* ========================================================================== */

function ApplicationCard({
  app,
  onUpdate,
  onDelete,
}: {
  app: Application;
  onUpdate: (patch: { status?: Application['status']; notes?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(app.notes || '');
  const token = getStoredToken();

  const downloadResume = async () => {
    const res = await fetch(`/api/admin/applications/${app.id}/resume`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = app.resumeOriginalName || 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] text-[#00B8F4] uppercase">
            {app.jobTitle} • {new Date(app.createdAt).toLocaleDateString()}
          </div>
          <h3 className="mt-1 font-display text-xl font-semibold text-white">{app.fullName}</h3>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
            <a href={`mailto:${app.email}`} className="hover:text-[#00B8F4]">
              {app.email}
            </a>
            {app.phone && <span>• {app.phone}</span>}
            {app.experienceYears && <span>• {app.experienceYears}</span>}
            {app.portfolioUrl && (
              <a
                href={app.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#00B8F4] underline"
              >
                Portfolio / GitHub
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {app.resumeFile && (
            <button
              type="button"
              onClick={downloadResume}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#00B8F4]/40 bg-[#00B8F4]/10 px-3 py-1.5 text-xs font-medium text-[#00B8F4] hover:bg-[#00B8F4] hover:text-[#05070A]"
            >
              <Download className="h-3.5 w-3.5" />
              Resume ({app.resumeOriginalName || 'CV'})
            </button>
          )}
          <select
            value={app.status}
            onChange={(e) => onUpdate({ status: e.target.value as Application['status'] })}
            className="rounded-lg border border-white/12 bg-[#060709] px-3 py-1.5 text-xs text-white"
          >
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-500/25 p-1.5 text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {app.coverNote && (
        <p className="mt-4 rounded-xl border border-white/[0.06] bg-[#060709] p-4 text-sm leading-relaxed text-slate-300">
          {app.coverNote}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal recruiter notes..."
          className="flex-1 rounded-lg border border-white/10 bg-[#060709] px-3 py-2 text-xs text-white"
        />
        <button
          type="button"
          onClick={() => onUpdate({ notes })}
          className="rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-white hover:border-[#00B8F4]"
        >
          Save Note
        </button>
      </div>
    </div>
  );
}

function InquiryCard({
  inq,
  onUpdate,
  onDelete,
}: {
  inq: Inquiry;
  onUpdate: (patch: { status?: Inquiry['status']; read?: boolean; notes?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(inq.notes || '');

  return (
    <div
      className={`rounded-2xl border bg-[#0B0D12] p-6 ${
        !inq.read ? 'border-[#00B8F4]/40' : 'border-white/[0.08]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#00B8F4] uppercase">
            <span>{inq.ticketId}</span>
            <span>•</span>
            <span className="text-slate-400">{new Date(inq.createdAt).toLocaleString()}</span>
            {!inq.read && (
              <span className="rounded bg-[#00B8F4] px-1.5 py-0.5 text-[9px] font-bold text-[#05070A]">
                NEW
              </span>
            )}
          </div>
          <h3 className="mt-1 font-display text-xl font-semibold text-white">
            {inq.fullName} {inq.company ? `— ${inq.company}` : ''}
          </h3>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
            <a href={`mailto:${inq.email}`} className="text-[#00B8F4] hover:underline">
              {inq.email}
            </a>
            {inq.phone && <span>• {inq.phone}</span>}
            <span>• Budget: {inq.budget}</span>
            <span>• Timeline: {inq.timeline}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${inq.email}?subject=Re: FusionLabz Inquiry ${inq.ticketId}`}
            className="rounded-lg border border-[#00B8F4]/40 bg-[#00B8F4]/10 px-3 py-1.5 text-xs font-medium text-[#00B8F4]"
          >
            Reply via Email
          </a>
          <select
            value={inq.status}
            onChange={(e) =>
              onUpdate({ status: e.target.value as Inquiry['status'], read: true })
            }
            className="rounded-lg border border-white/12 bg-[#060709] px-3 py-1.5 text-xs text-white"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_discussion">In Discussion</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-500/25 p-1.5 text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {inq.services?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {inq.services.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 rounded-xl border border-white/[0.06] bg-[#060709] p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
        {inq.message}
      </p>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal follow-up notes..."
          className="flex-1 rounded-lg border border-white/10 bg-[#060709] px-3 py-2 text-xs text-white"
        />
        <button
          type="button"
          onClick={() => onUpdate({ notes, read: true })}
          className="rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-white hover:border-[#00B8F4]"
        >
          Save Note
        </button>
      </div>
    </div>
  );
}

function ProjectEditorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Project>;
  onClose: () => void;
  onSave: (payload: Partial<Project>) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title || '');
  const [type, setType] = useState(initial.type || 'Portfolio Project');
  const [category, setCategory] = useState(initial.category || 'Web & SaaS');
  const [clientName, setClientName] = useState(initial.clientName || '');
  const [year, setYear] = useState(initial.year || String(new Date().getFullYear()));
  const [summary, setSummary] = useState(initial.summary || '');
  const [challenge, setChallenge] = useState(initial.challenge || '');
  const [solution, setSolution] = useState(initial.solution || '');
  const [impact, setImpact] = useState(initial.impact || '');
  const [techStackText, setTechStackText] = useState((initial.techStack || []).join(', '));
  const [metrics, setMetrics] = useState<MetricItem[]>(
    initial.metrics?.length ? initial.metrics : [{ label: '', value: '' }]
  );
  const [coverImage, setCoverImage] = useState(initial.coverImage || '');
  const [liveUrl, setLiveUrl] = useState(initial.liveUrl || '');
  const [featured, setFeatured] = useState(initial.featured !== false);
  const [published, setPublished] = useState(initial.published !== false);
  const [order, setOrder] = useState(initial.order || 1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadProjectImage(file);
      setCoverImage(res.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title,
        type,
        category,
        clientName,
        year,
        summary,
        challenge,
        solution,
        impact,
        techStack: techStackText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        metrics: metrics.filter((m) => m.label.trim() && m.value.trim()),
        coverImage,
        liveUrl,
        featured,
        published,
        order: Number(order) || 1,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#080C14] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="font-display text-xl font-semibold text-white">
            {initial.id ? 'Edit Project / Product' : 'Add New Project / Product'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Project Title *
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Client / Suite Name
              </label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              >
                <option value="Portfolio Project">Portfolio Project</option>
                <option value="Flagship Product">Flagship Product</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              >
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="Web & SaaS">Web & SaaS</option>
                <option value="Mobile Apps">Mobile Apps</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="AI & Data">AI & Data</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Year
              </label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Sort Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="mb-1.5 block text-[11px] text-slate-400 uppercase">
              Cover Showcase Image
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/uploads/projects/... or https://..."
                className="flex-1 rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#00B8F4]/40 bg-[#00B8F4]/10 px-4 py-2.5 text-xs font-medium text-[#00B8F4] hover:bg-[#00B8F4] hover:text-[#05070A]">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
            </div>
            {coverImage && (
              <img
                src={coverImage}
                alt="Preview"
                className="mt-3 h-36 w-full rounded-xl border border-white/10 object-cover"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Executive Summary *
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Challenge
              </label>
              <textarea
                rows={3}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Engineering Solution
              </label>
              <textarea
                rows={3}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Verified Impact
              </label>
              <textarea
                rows={3}
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Tech Stack (comma separated)
              </label>
              <input
                value={techStackText}
                onChange={(e) => setTechStackText(e.target.value)}
                placeholder="TypeScript, React, Node.js, PostgreSQL"
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Live URL (optional)
              </label>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Metrics Builder */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] text-slate-400 uppercase">
                Key Metrics (up to 3)
              </label>
              <button
                type="button"
                onClick={() => setMetrics((m) => [...m, { label: '', value: '' }])}
                className="text-[11px] text-[#00B8F4]"
              >
                + Add Metric
              </button>
            </div>
            <div className="space-y-2">
              {metrics.map((m, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={m.value}
                    onChange={(e) =>
                      setMetrics((arr) =>
                        arr.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x))
                      )
                    }
                    placeholder="e.g. 99.98%"
                    className="w-36 rounded-lg border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={m.label}
                    onChange={(e) =>
                      setMetrics((arr) =>
                        arr.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                      )
                    }
                    placeholder="e.g. Uptime SLA"
                    className="flex-1 rounded-lg border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setMetrics((arr) => arr.filter((_, i) => i !== idx))}
                    className="px-2 text-slate-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="accent-[#00B8F4]"
              />
              Featured on Home Horizontal Showcase
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="accent-[#00B8F4]"
              />
              Published Live
            </label>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-xs text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#00B8F4] px-6 py-2.5 text-xs font-bold text-[#05070A] uppercase hover:bg-white"
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ClientEditorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Client>;
  onClose: () => void;
  onSave: (payload: Partial<Client>) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name || '');
  const [industry, setIndustry] = useState(initial.industry || '');
  const [website, setWebsite] = useState(initial.website || '');
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl || '');
  const [quote, setQuote] = useState(initial.quote || '');
  const [authorName, setAuthorName] = useState(initial.authorName || '');
  const [authorRole, setAuthorRole] = useState(initial.authorRole || '');
  const [impactMetric, setImpactMetric] = useState(initial.impactMetric || '');
  const [featured, setFeatured] = useState(initial.featured !== false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadClientLogo(file);
      setLogoUrl(res.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await onSave({
              name,
              industry,
              website,
              logoUrl,
              quote,
              authorName,
              authorRole,
              impactMetric,
              featured,
            });
          } finally {
            setSaving(false);
          }
        }}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#080C14] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="font-display text-xl font-semibold text-white">
            {initial.id ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Client / Company Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Industry
              </label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="FinTech, Retail, Healthcare..."
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Website URL
              </label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Impact Metric Highlight
              </label>
              <input
                value={impactMetric}
                onChange={(e) => setImpactMetric(e.target.value)}
                placeholder="e.g. 2.8x conversion lift"
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Client Logo (optional — auto monogram used if blank)
            </label>
            <div className="flex items-center gap-3">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/uploads/clients/..."
                className="flex-1 rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#00B8F4]/40 bg-[#00B8F4]/10 px-4 py-2.5 text-xs font-medium text-[#00B8F4]">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Client Testimonial Quote
            </label>
            <textarea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Author Name
              </label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Author Role
              </label>
              <input
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[#00B8F4]"
            />
            Featured Client
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-xs text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#00B8F4] px-6 py-2.5 text-xs font-bold text-[#05070A] uppercase"
          >
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
}

function JobEditorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Job>;
  onClose: () => void;
  onSave: (payload: Partial<Job> & { responsibilities: string[]; requirements: string[]; techStack: string[] }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title || '');
  const [department, setDepartment] = useState(initial.department || 'Core Engineering');
  const [location, setLocation] = useState(initial.location || 'Colombo, Sri Lanka');
  const [workMode, setWorkMode] = useState(initial.workMode || 'Hybrid');
  const [employmentType, setEmploymentType] = useState(initial.employmentType || 'Full-time');
  const [experience, setExperience] = useState(initial.experience || '2+ Years');
  const [salaryRange, setSalaryRange] = useState(initial.salaryRange || 'Competitive');
  const [summary, setSummary] = useState(initial.summary || '');
  const [respText, setRespText] = useState((initial.responsibilities || []).join('\n'));
  const [reqText, setReqText] = useState((initial.requirements || []).join('\n'));
  const [stackText, setStackText] = useState((initial.techStack || []).join(', '));
  const [status, setStatus] = useState<Job['status']>(initial.status || 'open');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await onSave({
              title,
              department,
              location,
              workMode,
              employmentType,
              experience,
              salaryRange,
              summary,
              responsibilities: respText
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean),
              requirements: reqText
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean),
              techStack: stackText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              status,
            });
          } finally {
            setSaving(false);
          }
        }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#080C14] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="font-display text-xl font-semibold text-white">
            {initial.id ? 'Edit Job Listing' : 'Create New Job Listing'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Job Title *
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Full-Stack Engineer"
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Department
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Experience
              </label>
              <input
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Job['status'])}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3 py-2.5 text-white"
              >
                <option value="open">Open</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Compensation Range
              </label>
              <input
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Role Overview *
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Responsibilities (one per line)
              </label>
              <textarea
                rows={5}
                value={respText}
                onChange={(e) => setRespText(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400 uppercase">
                Requirements (one per line)
              </label>
              <textarea
                rows={5}
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Tech Stack (comma separated)
            </label>
            <input
              value={stackText}
              onChange={(e) => setStackText(e.target.value)}
              placeholder="TypeScript, React, Node.js, AWS"
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-xs text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#00B8F4] px-6 py-2.5 text-xs font-bold text-[#05070A] uppercase"
          >
            {saving ? 'Saving...' : 'Publish Role'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsPanel({
  settings,
  admin,
  onSaved,
  onAdminUpdated,
  onError,
}: {
  settings: SiteSettings;
  admin: AdminUser;
  onSaved: (msg: string) => Promise<void>;
  onAdminUpdated: (u: AdminUser) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState(admin.email);
  const [newName, setNewName] = useState(admin.name);

  const downloadBackup = async () => {
    const token = getStoredToken();
    const res = await fetch('/api/admin/backup', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fusionlabz-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await adminApi.updateSettings(form);
            await onSaved('Company settings updated live.');
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Save failed.');
          }
        }}
        className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6 lg:col-span-7"
      >
        <h2 className="font-display text-lg font-semibold text-white">
          Company Profile & Contact Details
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Company Name
            </label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Contact Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Phone / WhatsApp
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400 uppercase">
              Global Presence Line
            </label>
            <input
              value={form.globalReach}
              onChange={(e) => setForm({ ...form, globalReach: e.target.value })}
              className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-slate-400 uppercase">
            Headquarters Address
          </label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="border-t border-white/[0.08] pt-5">
          <h3 className="font-display text-sm font-semibold text-white">
            Optional SMTP Email Alerts
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Configure your shared hosting SMTP credentials to receive instant emails when inquiries
            or job applications arrive.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="SMTP Host (e.g. mail.fusionlabz.lk)"
              value={form.smtp?.host || ''}
              onChange={(e) =>
                setForm({ ...form, smtp: { ...(form.smtp as any), host: e.target.value } })
              }
              className="rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="SMTP Port (e.g. 587 or 465)"
              type="number"
              value={form.smtp?.port || 587}
              onChange={(e) =>
                setForm({ ...form, smtp: { ...(form.smtp as any), port: Number(e.target.value) } })
              }
              className="rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="SMTP Username"
              value={form.smtp?.user || ''}
              onChange={(e) =>
                setForm({ ...form, smtp: { ...(form.smtp as any), user: e.target.value } })
              }
              className="rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="SMTP Password"
              type="password"
              value={form.smtp?.pass || ''}
              onChange={(e) =>
                setForm({ ...form, smtp: { ...(form.smtp as any), pass: e.target.value } })
              }
              className="rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="Notification Recipient Email"
              value={form.smtp?.notifyEmail || ''}
              onChange={(e) =>
                setForm({ ...form, smtp: { ...(form.smtp as any), notifyEmail: e.target.value } })
              }
              className="rounded-xl border border-white/12 bg-[#060709] px-3 py-2 text-xs text-white sm:col-span-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#00B8F4] px-6 py-3 text-xs font-bold text-[#05070A] uppercase hover:bg-white"
        >
          Save Settings
        </button>
      </form>

      {/* Right Column: Security & Backup */}
      <div className="space-y-6 lg:col-span-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await adminApi.updateCredentials({
                currentPassword,
                newPassword: newPassword || undefined,
                newEmail,
                newName,
              });
              onAdminUpdated(res.admin);
              setCurrentPassword('');
              setNewPassword('');
              await onSaved('Admin credentials updated.');
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Unable to update credentials.');
            }
          }}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6"
        >
          <h2 className="font-display text-lg font-semibold text-white">
            Admin Credentials & Security
          </h2>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Admin Display Name"
            className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Admin Login Email"
            className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current Password (required)"
            className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min 8 chars, optional)"
            className="w-full rounded-xl border border-white/12 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-[#00B8F4]/50 bg-[#00B8F4]/15 py-3 text-xs font-bold text-[#00B8F4] uppercase hover:bg-[#00B8F4] hover:text-[#05070A]"
          >
            Update Credentials
          </button>
        </form>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0D12] p-6">
          <h3 className="font-display text-base font-semibold text-white">Database Backup</h3>
          <p className="mt-1.5 text-xs text-slate-400">
            Export a full portable JSON snapshot of your projects, clients, jobs, applications, and
            inquiries.
          </p>
          <button
            type="button"
            onClick={downloadBackup}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white hover:border-[#00B8F4]"
          >
            <Download className="h-4 w-4 text-[#00B8F4]" />
            Download JSON Backup
          </button>
        </div>
      </div>
    </div>
  );
}
