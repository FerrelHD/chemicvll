-- =========================================================
-- Personal OS: Habits & Debt / Split Bill Tracking Migration
-- =========================================================

-- 1. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_date TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON public.habits (user_id, is_archived, updated_at DESC);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow workspace access on habits" ON public.habits;
CREATE POLICY "Allow workspace access on habits"
  ON public.habits
  FOR ALL
  USING (true)
  WITH CHECK (length(trim(user_id)) > 0);

-- 2. Debt & Split Bill Tracker Table
CREATE TABLE IF NOT EXISTS public.debt_trackers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ferrel',
  person_name VARCHAR(100) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  is_settled BOOLEAN DEFAULT false,
  target_wallet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_debts_user_status
  ON public.debt_trackers (user_id, is_settled, created_at DESC);

ALTER TABLE public.debt_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow workspace access on debt_trackers" ON public.debt_trackers;
CREATE POLICY "Allow workspace access on debt_trackers"
  ON public.debt_trackers
  FOR ALL
  USING (true)
  WITH CHECK (length(trim(user_id)) > 0);
