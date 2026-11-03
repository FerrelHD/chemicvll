# Personal OS (`nexus-os`) Design Specification

## 1. Intent & The Why

Developers and career-driven builders often juggle fragmented tools:
- VS Code / Terminal open constantly just to run/monitor local dev servers.
- Spreadsheets or Notion databases to track job/internship applications across LinkedIn, Glints, and company portals.
- Financial apps for tracking daily expenses and recurring subscriptions.
- Todo lists and quick scratchpads split across devices.

**Personal OS (`nexus-os`)** is a single, centralized web command center designed to unify:
1. Local project server control (Zero-VS Code runner via local Node.js daemon).
2. Career and internship application pipeline with rich lifecycle tracking.
3. Daily focus, task inbox, and second-brain notes.
4. Cashflow logging and subscription radar.
5. Realtime cross-device clipboard dropzone (`desktop` <-> `mobile`).

It is designed with a desktop Bento Grid layout (`Cmd+K` keyboard-first) and a mobile Progressive Web App (PWA) with Add-to-Home-Screen capability.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Unified Command Center:** Access all personal dev, career, finance, and task modules from a single Bento Grid dashboard.
- **Robust Career & Internship Tracker:** Real-world tracking of job and internship applications, including applied dates, platform source, resume versions, follow-up dates, work modes, and stage progression.
- **Fast Input via Command Bar (`Cmd+K`):** Quick natural-syntax capture for tasks, expenses, and job tracking without navigating away.
- **Zero-VS Code Server Management:** Remote start, stop, restart, and live streaming logs for local projects via a lightweight Node.js daemon.
- **Secure Configuration (.env Vault):** Client-side encrypted environment variable storage using Web Crypto API (`AES-GCM` 256-bit).
- **Cross-Device Clipboard (Dropzone):** Instant text/snippet/link sync between desktop and mobile powered by Supabase Realtime.

### Non-Goals
- Multi-tenant enterprise SaaS: This is a single-user personal command center.
- Full IDE in the browser: The system starts/stops servers and streams terminal logs, but code editing remains in local IDEs.
- Automatic email scraping: Job application status updates are user-driven or webhook/API-assisted in the future, not invasive email scraping.

### Anti-Goals
- Cluttered, bloated UI: Avoid dense multi-page forms; prefer modals, inline editable cells, and Bento cards.
- Server-side plaintext credential storage: Secrets in `.env` vault must never be stored unencrypted on Supabase.

---

## 3. Tech Stack Architecture & Hosting Topology

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **UI Components & Styling:** Tailwind CSS, Radix UI / shadcn primitives (accessible, keyboard-friendly).
- **State & Data Fetching:** Zustand (client state & Cmd+K modal), TanStack Query (SWR / server state with optimistic UI updates).
- **Backend & Database:** Supabase Cloud (PostgreSQL with RLS, Supabase Auth email/password, Supabase Realtime).
- **Hosting & Topology:**
  - Web & PWA deployed to Vercel / Cloud HTTPS with Add-to-Home-Screen support.
  - Cross-device Remote Server Control: Mobile PWA communicates with the local runner daemon via secure Supabase Realtime channels (`daemon:control` & `daemon:logs`). This completely avoids Mixed Content and NAT/firewall restrictions when toggling servers from a phone.
- **Local Runner Daemon:** Node.js background client (managed via PM2 or node script) running on the local desktop, subscribed to Supabase Realtime command channels and streaming logs back in real-time.
- **Security & Authorization:**
  - Supabase Row Level Security (RLS) enabled on all tables scoped to `user_id = auth.uid()`.
  - Daemon authentication via a shared daemon secret token stored in local config.
  - Client-side `.env` Vault using Web Crypto API (`AES-GCM` 256-bit) with master passphrase.
- **Remote Git Repository:** `https://github.com/FerrelHD/chemicvll`

---

## 4. Functional Clusters & Detailed Requirements

### Cluster A: Dev & Project Mission Control
- **FR-A1 (Project Registry):** Manage projects with name, repository URL, production URL, local file directory, start command (default `npm run dev`), default port, and target launch date.
- **FR-A2 (Zero-VS Code Server Runner):** Communicate over WebSocket with the local runner daemon to start, stop, and restart local servers, reporting status (`running`, `stopped`, `error`) and PID.
- **FR-A3 (Live Terminal Log Drawer):** Slide-over drawer streaming `stdout` and `stderr` logs in real-time (last 100 lines buffered in memory).
- **FR-A4 (Client-Side `.env` Vault):** Encrypted key-value configuration storage per project. Encryption and decryption occur strictly in the browser using the user's master passphrase.

### Cluster B: Smart Finance & Subscription Radar
- **FR-B1 (Multi-Wallet Management):** Balance tracking across bank accounts, e-wallets, cash, and investments.
- **FR-B2 (Quick Cashflow Logging):** Fast recording (< 5 seconds) of income, expense, and transfers with optional project tags.
- **FR-B3 (Subscription Radar):** Recurring billing tracker with billing cycle calculation and H-3 alert badges before renewal dates.

### Cluster C: Execution, Career Pipeline & Content Studio
- **FR-C1 (Two-Tier Task Engine):**
  - Fast Inbox capture.
  - Daily Focus list (max 3-5 items).
  - Integrated Focus Timer (Pomodoro / custom duration) recording focus sessions.
- **FR-C2 (Career & Opportunity Kanban - Enhanced):**
  - Supports categories: `job`, `internship`, `scholarship`, `freelance`.
  - Stage Pipeline: `wishlist` -> `applied` -> `assessment` -> `interview` -> `offer` -> `rejected`.
  - Tracking attributes:
    - Entity name (Company/Organization) and Role/Position.
    - `applied_date`: Exact date of submission.
    - `deadline`: Application deadline.
    - `platform_source`: Where found / submitted (e.g. LinkedIn, Glints, Jobstreet, Career site, Referral).
    - `work_type`: `remote`, `hybrid`, `onsite`.
    - `location`: City/Country or remote region.
    - `resume_version`: Tag or name of CV/Portfolio used (e.g., `CV-Fullstack-v2`, `Portfolio-2026`).
    - `stipend_or_salary`: Stated or expected compensation / stipend.
    - `contact_person`: Recruiter / HR name, email, or LinkedIn URL.
    - `next_follow_up_date`: Follow-up date reminder (e.g. check email or ping recruiter).
    - `portal_url`: Link to the application or portal login.
    - `notes`: Cover letter copy, interview notes, feedback.
  - Kanban & List views: Quick toggle between Category tabs (`All`, `Internships`, `Jobs`), visual badges for follow-up alerts, and days-elapsed counter since application.
- **FR-C3 (Content & Script Studio):** Studio for short-form video/blog creation (Hook, Script Body, Platform, Status, Scheduled Date).
- **FR-C4 (Second Brain Notes):** Markdown notes, code snippets, prompts, bookmarks with tagging and pinning.

### Cluster D: Core Utility & Cross-Device Sync
- **FR-D1 (Global Command Bar `Cmd+K`):**
  - Fast parser supporting syntax prefixes:
    - `/task <title> [!high|!med|!low]`
    - `/exp <amount> <note> [#wallet]`
    - `/apply <company> - <role> [#internship|#job]`
- **FR-D2 (Realtime Dropzone):**
  - Instant cross-device clipboard sync via Supabase Realtime (`dropzone_items` table).
  - One-click copy to clipboard action.
- **FR-D3 (PWA Support):**
  - `manifest.json`, responsive mobile shell, bottom navigation bar.

---

## 5. Complete Supabase SQL Schema (with RLS & User Isolation)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CLUSTER A: DEV & PROJECT MISSION CONTROL
-- ==========================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
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

CREATE TABLE project_envs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  environment VARCHAR(30) DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
  encrypted_payload TEXT NOT NULL,
  iv VARCHAR(100) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CLUSTER B: SMART FINANCE & SUBSCRIPTIONS
-- ==========================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance NUMERIC(15, 2) DEFAULT 0,
  color VARCHAR(10) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- for transfers
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category VARCHAR(50) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  note TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
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
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'inbox' CHECK (status IN ('inbox', 'todo', 'in_progress', 'done')),
  priority SMALLINT DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  is_daily_focus BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Career & Internship Pipeline Table
CREATE TABLE career_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  entity_name VARCHAR(150) NOT NULL,
  role_or_program VARCHAR(150) NOT NULL,
  category VARCHAR(30) DEFAULT 'job' CHECK (category IN ('job', 'internship', 'scholarship', 'freelance')),
  stage VARCHAR(30) DEFAULT 'wishlist' CHECK (stage IN ('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
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

CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  title VARCHAR(200) NOT NULL,
  platform VARCHAR(50) DEFAULT 'TikTok/Reels',
  status VARCHAR(30) DEFAULT 'idea' CHECK (status IN ('idea', 'scripting', 'filming', 'editing', 'posted')),
  hook_text TEXT,
  script_body TEXT,
  product_or_topic VARCHAR(150),
  scheduled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'note' CHECK (type IN ('note', 'snippet', 'prompt', 'bookmark')),
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CLUSTER D: UTILITY & CROSS-DEVICE SYNC
-- ==========================================
CREATE TABLE dropzone_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
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

CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own project_envs" ON project_envs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own focus_sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own career_pipelines" ON career_pipelines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own content_ideas" ON content_ideas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own dropzone_items" ON dropzone_items FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- INDEXES & REALTIME PUBLICATION
-- ==========================================
CREATE INDEX idx_tasks_daily_focus ON tasks(is_daily_focus) WHERE is_daily_focus = true;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_dropzone_created ON dropzone_items(created_at DESC);
CREATE INDEX idx_career_stage ON career_pipelines(stage);
CREATE INDEX idx_career_category ON career_pipelines(category);
CREATE INDEX idx_career_applied_date ON career_pipelines(applied_date DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE dropzone_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE career_pipelines;
```

---

## 6. Implementation Phasing Strategy

Following the Conventional Commits and Atomic Commit rules:

- **Phase 1: Foundation & Infrastructure**
  - Scaffold Next.js 14 App Router project with TypeScript, Tailwind CSS, Lucide icons.
  - Setup Supabase client SDK and TypeScript database types.
  - Write and organize database migration scripts (`supabase/migrations/`).
  - Build responsive Bento Grid layout shell (desktop sidebar + mobile bottom nav).
  - Add PWA manifest & meta headers.

- **Phase 2: Core Utility & Dropzone**
  - Implement Dropzone clipboard with Supabase Realtime synchronization.
  - Build Global Command Bar (`Cmd+K`) modal and shortcut listeners.

- **Phase 3: Career & Internship Tracking Pipeline (Priority)**
  - Kanban board and list view for `career_pipelines`.
  - Application modal (with applied date, platform, resume version, work type, follow-up date).
  - Quick-action shortcuts and filtering (Internships vs Jobs).
  - Cmd+K integration for rapid job application capture (`/apply`).

- **Phase 4: Task Engine & Smart Finance**
  - Two-tier task engine (Inbox vs Daily Focus) and Focus Timer.
  - Wallet balance and quick cashflow transaction logging.
  - Subscription radar with H-3 renewal warning badges.

- **Phase 5: Dev Mission Control & Local Daemon**
  - Project registry & client-side encrypted `.env` vault.
  - Node.js WebSocket daemon (`local-daemon/`) for process control and log streaming.

