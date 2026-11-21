export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CareerCategory = 'job' | 'internship' | 'scholarship' | 'freelance';
export type CareerStage = 'wishlist' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected';
export type WorkType = 'remote' | 'hybrid' | 'onsite';

export interface CareerPipeline {
  id: string;
  user_id?: string;
  entity_name: string;
  role_or_program: string;
  category: CareerCategory;
  stage: CareerStage;
  applied_date: string | null;
  deadline: string | null;
  platform_source: string | null;
  work_type: WorkType;
  location: string | null;
  resume_version: string | null;
  stipend_or_salary: string | null;
  contact_person: string | null;
  next_follow_up_date: string | null;
  portal_url: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description: string | null;
  status: 'active' | 'backlog' | 'completed' | 'archived';
  color_code: string;
  repo_url: string | null;
  prod_url: string | null;
  local_path: string | null;
  start_command: string;
  default_port: number;
  target_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  user_id?: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash' | 'investment';
  balance: number;
  color: string;
  account_number?: string;
  card_label?: string;
  holder_name?: string;
  expiry?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  wallet_id: string;
  to_wallet_id: string | null;
  project_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  wallet_id: string | null;
  name: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string;
  is_active: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  project_id: string | null;
  title: string;
  status: 'inbox' | 'todo' | 'in_progress' | 'done';
  priority: 1 | 2 | 3;
  is_daily_focus: boolean;
  due_date: string | null;
  completed_at: string | null;
  created_at?: string;
}

export interface DropzoneItem {
  id: string;
  user_id?: string;
  type: 'text' | 'link' | 'code';
  content: string;
  device_source: 'desktop' | 'mobile';
  is_pinned: boolean;
  created_at?: string;
}

export interface FixedAllocation {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  sourceSubId?: string | null;
}

export interface BudgetSplitRule {
  id: string;
  name: string;
  percentage: number;
  categories: string[];
  color: string;
  isSavings?: boolean;
}

export interface MonthlyBudgetPlan {
  id: string;
  cycleStartDate: string; // YYYY-MM-DD
  cycleEndDate: string;   // YYYY-MM-DD
  salaryAmount: number;
  fixedItems: FixedAllocation[];
  rules: BudgetSplitRule[];
  linkedTransactionIds?: string[];
  syncedToCloud?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id?: string;
  title: string;
  category?: string;
  streak: number;
  best_streak: number;
  last_completed_date: string | null; // YYYY-MM-DD
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DebtTracker {
  id: string;
  user_id?: string;
  person_name: string;
  amount: number;
  description: string;
  due_date: string | null;
  is_settled: boolean;
  target_wallet_id?: string | null;
  created_at?: string;
  settled_at?: string | null;
}

export interface NoteItem {
  id: string;
  user_id?: string;
  project_id?: string | null;
  title: string;
  content: string;
  type: 'note' | 'snippet' | 'prompt' | 'bookmark';
  tags: string[];
  is_pinned: boolean;
  created_at?: string;
  updated_at: string;
}

export interface ContentIdea {
  id: string;
  user_id?: string;
  title: string;
  platform: string;
  status: 'idea' | 'scripting' | 'filming' | 'editing' | 'posted';
  hook_text: string | null;
  script_body: string | null;
  product_or_topic?: string | null;
  scheduled_date?: string | null;
  created_at: string;
}




