-- =========================================================
-- Personal OS: Schema Alignment & Fix Migration
-- Migration: 20261121_fix_schema_compatibility.sql
-- Aligns 20261103_initial_schema with client-generated string IDs,
-- workspace user_id ('ferrel'), missing wallet columns, and RLS policies.
-- =========================================================

-- 1. Add missing wallet card columns
ALTER TABLE public.wallets 
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS card_label VARCHAR(100),
  ADD COLUMN IF NOT EXISTS holder_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expiry VARCHAR(20);

-- Add created_at to notes if missing
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Drop legacy foreign key constraints that restrict UUIDs & auth.users
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_wallet_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_to_wallet_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_project_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_wallet_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE public.focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_task_id_fkey;
ALTER TABLE public.focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_user_id_fkey;

ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_project_id_fkey;
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

ALTER TABLE public.project_envs DROP CONSTRAINT IF EXISTS project_envs_project_id_fkey;
ALTER TABLE public.project_envs DROP CONSTRAINT IF EXISTS project_envs_user_id_fkey;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
ALTER TABLE public.career_pipelines DROP CONSTRAINT IF EXISTS career_pipelines_user_id_fkey;
ALTER TABLE public.content_ideas DROP CONSTRAINT IF EXISTS content_ideas_user_id_fkey;
ALTER TABLE public.dropzone_items DROP CONSTRAINT IF EXISTS dropzone_items_user_id_fkey;

-- 3. Safely alter primary key id and user_id to TEXT on all initial tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'projects', 'project_envs', 'wallets', 'transactions', 'subscriptions',
    'tasks', 'focus_sessions', 'career_pipelines', 'content_ideas', 'notes', 'dropzone_items'
  ]) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Change user_id to TEXT and set default 'ferrel'
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id TYPE TEXT USING user_id::text', tbl);
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT ''ferrel''', tbl);
      
      -- Change id to TEXT
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id TYPE TEXT USING id::text', tbl);
    END IF;
  END LOOP;
END $$;

-- 4. Alter foreign key columns to TEXT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE public.transactions ALTER COLUMN wallet_id TYPE TEXT USING wallet_id::text;
    ALTER TABLE public.transactions ALTER COLUMN to_wallet_id TYPE TEXT USING to_wallet_id::text;
    ALTER TABLE public.transactions ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    ALTER TABLE public.subscriptions ALTER COLUMN wallet_id TYPE TEXT USING wallet_id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE public.tasks ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
    ALTER TABLE public.notes ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_envs') THEN
    ALTER TABLE public.project_envs ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'focus_sessions') THEN
    ALTER TABLE public.focus_sessions ALTER COLUMN task_id TYPE TEXT USING task_id::text;
  END IF;
END $$;

-- 5. Standardize RLS policies on all initial tables to allow workspace access with anon key
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'projects', 'project_envs', 'wallets', 'transactions', 'subscriptions',
    'tasks', 'focus_sessions', 'career_pipelines', 'content_ideas', 'notes', 'dropzone_items'
  ]) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own %I" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow workspace access on %I" ON public.%I', tbl, tbl);
      EXECUTE format('CREATE POLICY "Allow workspace access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (length(trim(user_id)) > 0)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- 6. Add remaining active tables to supabase_realtime publication
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE transactions';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE habits';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE debt_trackers';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE budget_plans';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
