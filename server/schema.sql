-- ActivityIQ — MySQL schema (single source of truth).
--
-- server/db.ts reads this file at startup and executes each statement in order,
-- so this is the only place table definitions live. Every statement must be
-- idempotent (IF NOT EXISTS) because it runs on every boot.
--
-- Apply manually with:
--   mysql -u activityiq -p activityiq < server/schema.sql
--
-- Ids are application-generated strings (see newId() in db.ts), not AUTO_INCREMENT.
-- Timestamps are ISO-8601 strings in VARCHAR columns, which is what the previous
-- SQLite schema used. Range filters such as `started_at >= ? AND started_at < ?`
-- rely on ISO-8601 sorting lexicographically, so the column type must stay textual.

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_admin INT NOT NULL DEFAULT 0,
  created_at VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  expires_at VARCHAR(64) NOT NULL,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(120) NOT NULL,
  initials VARCHAR(8) NOT NULL,
  color VARCHAR(32) NOT NULL,
  project_id VARCHAR(128) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'offline',
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_employees_user (user_id),
  INDEX idx_employees_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS time_entries (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  project_id VARCHAR(128) NOT NULL,
  note VARCHAR(500) NOT NULL DEFAULT '',
  started_at VARCHAR(64) NOT NULL,
  ended_at VARCHAR(64),
  seconds INT NOT NULL DEFAULT 0,
  INDEX idx_time_entries_employee (employee_id),
  INDEX idx_time_entries_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_samples (
  id VARCHAR(128) PRIMARY KEY,
  entry_id VARCHAR(128) NOT NULL,
  employee_id VARCHAR(128) NOT NULL,
  project_id VARCHAR(128) NOT NULL,
  sampled_at VARCHAR(64) NOT NULL,
  app VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  activity INT NOT NULL,
  duration_minutes INT NOT NULL,
  INDEX idx_activity_samples_entry (entry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Screenshot bytes live in MySQL as a LONGBLOB; nothing is written to disk.
-- `image_mime` is stored alongside so GET /api/screenshots/:id can set an
-- accurate Content-Type instead of guessing.
-- `entry_id` stays (nullable) because the activity timeline groups screenshots
-- by time entry; a screenshot uploaded outside a tracking session has none.
CREATE TABLE IF NOT EXISTS screenshots (
  id VARCHAR(128) PRIMARY KEY,
  entry_id VARCHAR(128),
  employee_id VARCHAR(128) NOT NULL,
  captured_at VARCHAR(64) NOT NULL,
  image LONGBLOB NOT NULL,
  image_mime VARCHAR(64) NOT NULL DEFAULT 'image/jpeg',
  active_window VARCHAR(512),
  ai_summary TEXT,
  productivity_score INT,
  ocr_text TEXT,
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_screenshots_entry (entry_id),
  INDEX idx_screenshots_employee_captured (employee_id, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agent_pairing_codes (
  code VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  expires_at VARCHAR(64) NOT NULL,
  used INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_insights (
  id VARCHAR(128) PRIMARY KEY,
  employee_id VARCHAR(128) NOT NULL,
  range_key VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  summary TEXT NOT NULL,
  focus_score INT NOT NULL,
  generated_at VARCHAR(64) NOT NULL,
  UNIQUE KEY uq_ai_insights (employee_id, range_key, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
