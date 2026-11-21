-- =========================================================
-- Personal OS (nexus-os / chemicvll) Initial Supabase Schema
-- Phase 1 Migration (Updated: TEXT Primary Keys & Workspace Access)
-- =========================================================

-- Enable UUID extension (for uuid generation helper if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CLUSTER A: DEV & PROJECT MISSION CONTROL
-- ==========================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  name VARCHAR(150) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'backlog', 'completed', 'archived')),
  color_code VARCHAR(10) DEFAULT '#10B981',
  repo_url TEXT,
  prod_url TEXT,
  local_path TEXT,
  start_command VARCHAR(150) DEFAULT 'npm run dev',
  default_port INTEGER DEFAULT 3000,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_envs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  project_id TEXT,
  environment VARCHAR(30) DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
  encrypted_payload TEXT NOT NULL,
  iv VARCHAR(100) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CLUSTER B: SMART FINANCE & SUBSCRIPTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance NUMERIC(15, 2) DEFAULT 0,
  color VARCHAR(10) DEFAULT '#3B82F6',
  account_number VARCHAR(50),
  card_label VARCHAR(100),
  holder_name VARCHAR(100),
  expiry VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  wallet_id TEXT,
  to_wallet_id TEXT,
  project_id TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category VARCHAR(50) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  note TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  wallet_id TEXT,
  name VARCHAR(150) NOT NULL,
  cost NUMERIC(15, 2) NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  next_billing_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CLUSTER C: EXECUTION, CAREER & CONTENT
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  project_id TEXT,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'inbox' CHECK (status IN ('inbox', 'todo', 'in_progress', 'done')),
  priority SMALLINT DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  is_daily_focus BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  task_id TEXT,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Career & Internship Pipeline Table
CREATE TABLE IF NOT EXISTS career_pipelines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  entity_name VARCHAR(150) NOT NULL,
  role_or_program VARCHAR(150) NOT NULL,
  category VARCHAR(30) DEFAULT 'internship' CHECK (category IN ('job', 'internship', 'scholarship', 'freelance')),
  stage VARCHAR(30) DEFAULT 'applied' CHECK (stage IN ('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
  applied_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  platform_source VARCHAR(100),
  work_type VARCHAR(20) DEFAULT 'onsite' CHECK (work_type IN ('remote', 'hybrid', 'onsite')),
  location VARCHAR(150),
  resume_version VARCHAR(100),
  stipend_or_salary VARCHAR(100),
  contact_person TEXT,
  next_follow_up_date DATE,
  portal_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  title VARCHAR(200) NOT NULL,
  platform VARCHAR(50) DEFAULT 'TikTok/Reels',
  status VARCHAR(30) DEFAULT 'idea' CHECK (status IN ('idea', 'scripting', 'filming', 'editing', 'posted')),
  hook_text TEXT,
  script_body TEXT,
  product_or_topic VARCHAR(150),
  scheduled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  project_id TEXT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'note' CHECK (type IN ('note', 'snippet', 'prompt', 'bookmark')),
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CLUSTER D: UTILITY & CROSS-DEVICE SYNC
-- ==========================================
CREATE TABLE IF NOT EXISTS dropzone_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'link', 'code')),
  content TEXT NOT NULL,
  device_source VARCHAR(20) DEFAULT 'desktop' CHECK (device_source IN ('desktop', 'mobile')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_envs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropzone_items ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'projects', 'project_envs', 'wallets', 'transactions', 'subscriptions',
    'tasks', 'focus_sessions', 'career_pipelines', 'content_ideas', 'notes', 'dropzone_items'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow workspace access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow workspace access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (length(trim(user_id)) > 0)', tbl, tbl);
  END LOOP;
END $$;

-- ==========================================
-- INDEXES & REALTIME PUBLICATION
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tasks_daily_focus ON tasks(is_daily_focus) WHERE is_daily_focus = true;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_dropzone_created ON dropzone_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_stage ON career_pipelines(stage);
CREATE INDEX IF NOT EXISTS idx_career_category ON career_pipelines(category);
CREATE INDEX IF NOT EXISTS idx_career_applied_date ON career_pipelines(applied_date DESC);

-- Enable Realtime
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE dropzone_items';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE tasks';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE career_pipelines';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE transactions';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
