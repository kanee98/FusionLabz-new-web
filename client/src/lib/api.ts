import type {
  AdminUser,
  Application,
  AuditLog,
  BootstrapPayload,
  Client,
  DashboardData,
  Inquiry,
  Job,
  Project,
  SiteSettings,
} from '../types';

declare global {
  interface Window {
    __FLZ_PORTAL__?: {
      enabled: boolean;
      apiBase: string;
      path: string;
    };
  }
}

const TOKEN_STORAGE_KEY = 'flz_sec_token';

export function getAdminApiBase(): string {
  return window.__FLZ_PORTAL__?.apiBase || '';
}

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data ? String(data.error) : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

const adminUrl = (suffix: string) => `${getAdminApiBase()}${suffix}`;

export const publicApi = {
  bootstrap: () => request<BootstrapPayload>('/api/public/bootstrap'),
  submitContact: (payload: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
    services: string[];
    budget: string;
    timeline: string;
    message: string;
    website?: string;
  }) =>
    request<{ ok: boolean; ticketId: string; message: string }>('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitApplication: (formData: FormData) =>
    request<{ ok: boolean; applicationId: string; message: string }>('/api/public/careers/apply', {
      method: 'POST',
      body: formData,
    }),
};

export const adminApi = {
  login: async (email: string, password: string) => {
    const res = await request<{ ok: boolean; token: string; admin: AdminUser }>(
      adminUrl('/login'),
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.token) setStoredToken(res.token);
    return res;
  },
  logout: async () => {
    setStoredToken(null);
    return request<{ ok: boolean }>(adminUrl('/logout'), { method: 'POST' });
  },
  me: () => request<{ admin: AdminUser; storageEngine: 'mysql' | 'json' }>(adminUrl('/me')),
  dashboard: () => request<DashboardData>(adminUrl('/dashboard')),

  // Projects
  getProjects: () => request<{ projects: Project[] }>(adminUrl('/projects')),
  createProject: (data: Partial<Project>) =>
    request<{ project: Project }>(adminUrl('/projects'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<{ project: Project }>(adminUrl(`/projects/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(adminUrl(`/projects/${id}`), { method: 'DELETE' }),
  uploadProjectImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string; filename: string }>(adminUrl('/upload/project-image'), {
      method: 'POST',
      body: fd,
    });
  },

  // Clients
  getClients: () => request<{ clients: Client[] }>(adminUrl('/clients')),
  createClient: (data: Partial<Client>) =>
    request<{ client: Client }>(adminUrl('/clients'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<{ client: Client }>(adminUrl(`/clients/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<{ ok: boolean }>(adminUrl(`/clients/${id}`), { method: 'DELETE' }),
  uploadClientLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string; filename: string }>(adminUrl('/upload/client-logo'), {
      method: 'POST',
      body: fd,
    });
  },

  // Jobs
  getJobs: () => request<{ jobs: Job[] }>(adminUrl('/jobs')),
  createJob: (
    data: Partial<Job> & {
      responsibilities?: string[] | string;
      requirements?: string[] | string;
      techStack?: string[] | string;
    }
  ) =>
    request<{ job: Job }>(adminUrl('/jobs'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateJob: (
    id: string,
    data: Partial<Job> & {
      responsibilities?: string[] | string;
      requirements?: string[] | string;
      techStack?: string[] | string;
    }
  ) =>
    request<{ job: Job }>(adminUrl(`/jobs/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteJob: (id: string) =>
    request<{ ok: boolean }>(adminUrl(`/jobs/${id}`), { method: 'DELETE' }),

  // Applications
  getApplications: () => request<{ applications: Application[] }>(adminUrl('/applications')),
  updateApplication: (id: string, data: { status?: Application['status']; notes?: string }) =>
    request<{ application: Application }>(adminUrl(`/applications/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteApplication: (id: string) =>
    request<{ ok: boolean }>(adminUrl(`/applications/${id}`), { method: 'DELETE' }),

  // Inquiries
  getInquiries: () => request<{ inquiries: Inquiry[] }>(adminUrl('/inquiries')),
  updateInquiry: (id: string, data: { status?: Inquiry['status']; read?: boolean; notes?: string }) =>
    request<{ inquiry: Inquiry }>(adminUrl(`/inquiries/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteInquiry: (id: string) =>
    request<{ ok: boolean }>(adminUrl(`/inquiries/${id}`), { method: 'DELETE' }),

  // Settings & Audit
  getSettings: () =>
    request<{
      settings: SiteSettings;
      admin: AdminUser;
      storageEngine: 'mysql' | 'json';
      adminPath: string;
      auditLogs: AuditLog[];
    }>(adminUrl('/settings')),
  updateSettings: (data: Partial<SiteSettings>) =>
    request<{ ok: boolean; settings: SiteSettings }>(adminUrl('/settings'), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateCredentials: (data: {
    currentPassword: string;
    newPassword?: string;
    newEmail?: string;
    newName?: string;
  }) =>
    request<{ ok: boolean; token: string; admin: AdminUser }>(adminUrl('/password'), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
