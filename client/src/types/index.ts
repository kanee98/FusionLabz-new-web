export interface MetricItem {
  label: string;
  value: string;
}

export interface StatItem {
  label: string;
  value: string;
  suffix?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  type: 'Flagship Product' | 'Portfolio Project' | string;
  category: string;
  clientName: string;
  year: string;
  summary: string;
  challenge: string;
  solution: string;
  impact: string;
  techStack: string[];
  metrics: MetricItem[];
  coverImage: string;
  liveUrl: string;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  website: string;
  logoUrl: string;
  featured: boolean;
  quote: string;
  authorName: string;
  authorRole: string;
  impactMetric: string;
  order: number;
  createdAt?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site' | string;
  employmentType: 'Full-time' | 'Contract' | 'Internship' | string;
  experience: string;
  salaryRange: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  techStack: string[];
  status: 'open' | 'paused' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  experienceYears: string;
  coverNote: string;
  resumeFile: string;
  resumeOriginalName: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected';
  notes: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  ticketId: string;
  fullName: string;
  email: string;
  company: string;
  phone: string;
  services: string[];
  budget: string;
  timeline: string;
  message: string;
  status: 'new' | 'contacted' | 'in_discussion' | 'archived';
  read: boolean;
  notes: string;
  createdAt: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  notifyEmail: string;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  careersEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  globalReach: string;
  linkedin: string;
  github: string;
  x: string;
  instagram: string;
  stats: StatItem[];
  smtp?: SmtpSettings;
}

export interface BootstrapPayload {
  settings: SiteSettings;
  projects: Project[];
  clients: Client[];
  jobs: Job[];
}

export interface AdminUser {
  email: string;
  name: string;
}

export interface DashboardData {
  counts: {
    projects: number;
    publishedProjects: number;
    clients: number;
    jobs: number;
    openJobs: number;
    applications: number;
    newApplications: number;
    inquiries: number;
    unreadInquiries: number;
  };
  recentApplications: Application[];
  recentInquiries: Inquiry[];
}
