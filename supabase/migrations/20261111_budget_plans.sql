-- Payday Budgeting persistence table for Supabase cloud sync
-- Uses TEXT primary keys and user_id to stay compatible with client-generated
-- string IDs (e.g. 'budget-...', 'tx-...') and Personal OS workspace user_id ('ferrel').

CREATE TABLE IF NOT EXISTS public.budget_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cycle_start_date TEXT NOT NULL,
  cycle_end_date TEXT NOT NULL,
  salary_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  fixed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_transaction_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_plans_user_active
  ON public.budget_plans (user_id, is_active, updated_at DESC);

ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow workspace access on budget_plans" ON public.budget_plans;
CREATE POLICY "Allow workspace access on budget_plans"
  ON public.budget_plans
  FOR ALL
  USING (true)
  WITH CHECK (length(trim(user_id)) > 0);
