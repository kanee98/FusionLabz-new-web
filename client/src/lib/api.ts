import type {
  AdminUser,
  Application,
  BootstrapPayload,
  Client,
  DashboardData,
  Inquiry,
  Job,
  Project,
  SiteSettings,
} from '../types';

const TOKEN_STORAGE_KEY = 'flz_admin_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    const message = typeof data === 'object' && data && 'error' in data ? String(data.error) : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

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
    const res = await request<{ ok: boolean; token: string; admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },
  logout: async () => {
    setStoredToken(null);
    return request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' });
  },
  me: () => request<{ admin: AdminUser }>('/api/admin/me'),
  dashboard: () => request<DashboardData>('/api/admin/dashboard'),

  // Projects
  getProjects: () => request<{ projects: Project[] }>('/api/admin/projects'),
  createProject: (data: Partial<Project>) =>
    request<{ project: Project }>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<{ project: Project }>(`/api/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  uploadProjectImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string; filename: string }>('/api/admin/upload/project-image', {
      method: 'POST',
      body: fd,
    });
  },

  // Clients
  getClients: () => request<{ clients: Client[] }>('/api/admin/clients'),
  createClient: (data: Partial<Client>) =>
    request<{ client: Client }>('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<{ client: Client }>(`/api/admin/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/clients/${id}`, { method: 'DELETE' }),
  uploadClientLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string; filename: string }>('/api/admin/upload/client-logo', {
      method: 'POST',
      body: fd,
    });
  },

  // Jobs
  getJobs: () => request<{ jobs: Job[] }>('/api/admin/jobs'),
  createJob: (data: Partial<Job> & { responsibilities?: string[] | string; requirements?: string[] | string; techStack?: string[] | string }) =>
    request<{ job: Job }>('/api/admin/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateJob: (id: string, data: Partial<Job> & { responsibilities?: string[] | string; requirements?: string[] | string; techStack?: string[] | string }) =>
    request<{ job: Job }>(`/api/admin/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteJob: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/jobs/${id}`, { method: 'DELETE' }),

  // Applications
  getApplications: () => request<{ applications: Application[] }>('/api/admin/applications'),
  updateApplication: (id: string, data: { status?: Application['status']; notes?: string }) =>
    request<{ application: Application }>(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteApplication: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/applications/${id}`, { method: 'DELETE' }),

  // Inquiries
  getInquiries: () => request<{ inquiries: Inquiry[] }>('/api/admin/inquiries'),
  updateInquiry: (id: string, data: { status?: Inquiry['status']; read?: boolean; notes?: string }) =>
    request<{ inquiry: Inquiry }>(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteInquiry: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/inquiries/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<{ settings: SiteSettings; admin: AdminUser }>('/api/admin/settings'),
  updateSettings: (data: Partial<SiteSettings>) =>
    request<{ ok: boolean; settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateCredentials: (data: {
    currentPassword: string;
    newPassword?: string;
    newEmail?: string;
    newName?: string;
  }) =>
    request<{ ok: boolean; token: string; admin: AdminUser }>('/api/admin/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
