-- FusionLabz Universal MySQL 5.7+ / 8.0+ / MariaDB 10.3+ Schema (Shared Hosting Ready)

CREATE TABLE IF NOT EXISTS admin_users (
  id INT NOT NULL PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  updated_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id INT NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(220) NOT NULL,
  type VARCHAR(80) NOT NULL,
  category VARCHAR(100) NOT NULL,
  client_name VARCHAR(180) DEFAULT '',
  year VARCHAR(20) DEFAULT '',
  summary TEXT,
  challenge TEXT,
  solution TEXT,
  impact TEXT,
  tech_stack LONGTEXT,
  metrics LONGTEXT,
  cover_image VARCHAR(500) DEFAULT '',
  live_url VARCHAR(500) DEFAULT '',
  featured TINYINT(1) DEFAULT 1,
  published TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 999,
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  INDEX idx_projects_pub_order (published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  industry VARCHAR(140) DEFAULT '',
  website VARCHAR(500) DEFAULT '',
  logo_url VARCHAR(500) DEFAULT '',
  featured TINYINT(1) DEFAULT 1,
  quote TEXT,
  author_name VARCHAR(160) DEFAULT '',
  author_role VARCHAR(160) DEFAULT '',
  impact_metric VARCHAR(180) DEFAULT '',
  sort_order INT DEFAULT 999,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_clients_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  department VARCHAR(120) DEFAULT '',
  location VARCHAR(160) DEFAULT '',
  work_mode VARCHAR(60) DEFAULT '',
  employment_type VARCHAR(60) DEFAULT '',
  experience VARCHAR(80) DEFAULT '',
  salary_range VARCHAR(160) DEFAULT '',
  summary TEXT,
  responsibilities LONGTEXT,
  requirements LONGTEXT,
  tech_stack LONGTEXT,
  status VARCHAR(24) DEFAULT 'open',
  created_at VARCHAR(40) NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  INDEX idx_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  job_title VARCHAR(220) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(60) DEFAULT '',
  portfolio_url VARCHAR(500) DEFAULT '',
  experience_years VARCHAR(60) DEFAULT '',
  cover_note TEXT,
  resume_file VARCHAR(255) DEFAULT '',
  resume_original_name VARCHAR(255) DEFAULT '',
  status VARCHAR(32) DEFAULT 'new',
  notes TEXT,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_apps_status (status),
  INDEX idx_apps_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  ticket_id VARCHAR(32) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  company VARCHAR(160) DEFAULT '',
  phone VARCHAR(60) DEFAULT '',
  services LONGTEXT,
  budget VARCHAR(80) DEFAULT '',
  timeline VARCHAR(80) DEFAULT '',
  message TEXT,
  status VARCHAR(32) DEFAULT 'new',
  is_read TINYINT(1) DEFAULT 0,
  notes TEXT,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_inquiries_status (status),
  INDEX idx_inquiries_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  actor VARCHAR(190) DEFAULT '',
  ip_address VARCHAR(80) DEFAULT '',
  detail VARCHAR(500) DEFAULT '',
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
