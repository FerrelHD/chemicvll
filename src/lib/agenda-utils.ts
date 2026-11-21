import { CareerPipeline, Subscription, Task } from '@/types/database';
import { toLocalDateKey } from './budget-utils';
import { getDaysUntilDate } from './utils';

export interface AgendaItem {
  id: string;
  type: 'interview' | 'assessment' | 'subscription' | 'task';
  title: string;
  subtitle: string;
  dateKey: string; // 'YYYY-MM-DD'
  actionUrl?: string | null;
  moduleTab: 'career' | 'finance' | 'tasks';
  badge: string;
  badgeColor: string; // Tailwind color class
  isToday: boolean;
  isUpcoming: boolean;
}

export function getUnifiedAgenda(
  careerItems: CareerPipeline[],
  subscriptions: Subscription[],
  tasks: Task[],
  referenceDateInput?: string | Date
): AgendaItem[] {
  const todayKey = toLocalDateKey(referenceDateInput);
  const items: AgendaItem[] = [];

  // 1. Career: Interviews & Assessments
  for (const c of careerItems) {
    if (c.stage === 'rejected' || c.stage === 'offer') continue;

    if (c.stage === 'interview' && c.next_follow_up_date) {
      const dateKey = toLocalDateKey(c.next_follow_up_date);
      items.push({
        id: `career-interview-${c.id}`,
        type: 'interview',
        title: `${c.entity_name} • ${c.role_or_program}`,
        subtitle: c.notes || 'Interview & screening prep',
        dateKey,
        actionUrl: c.portal_url,
        moduleTab: 'career',
        badge: 'INTERVIEW',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        isToday: dateKey === todayKey,
        isUpcoming: dateKey > todayKey,
      });
    }

    if (c.deadline) {
      const dateKey = toLocalDateKey(c.deadline);
      items.push({
        id: `career-deadline-${c.id}`,
        type: 'assessment',
        title: `${c.entity_name} • ${c.role_or_program}`,
        subtitle: `Assessment deadline: ${new Date(c.deadline).toLocaleDateString('id-ID')}`,
        dateKey,
        actionUrl: c.portal_url,
        moduleTab: 'career',
        badge: 'ASSESSMENT',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
        isToday: dateKey === todayKey,
        isUpcoming: dateKey > todayKey,
      });
    }
  }

  // 2. Subscriptions due within next 7 days
  for (const s of subscriptions) {
    if (!s.is_active) continue;
    const dateKey = toLocalDateKey(s.next_billing_date);
    const daysUntil = getDaysUntilDate(s.next_billing_date);
    if (daysUntil >= 0 && daysUntil <= 7) {
      items.push({
        id: `sub-${s.id}`,
        type: 'subscription',
        title: `${s.name} (Rp ${s.cost.toLocaleString('id-ID')})`,
        subtitle: `Tagihan otomatis: ${s.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
        dateKey,
        moduleTab: 'finance',
        badge: 'TAGIHAN',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        isToday: dateKey === todayKey,
        isUpcoming: dateKey > todayKey,
      });
    }
  }

  // 3. Tasks: Daily Focus or P1 Tasks
  for (const t of tasks) {
    if (t.status === 'done') continue;
    if (t.is_daily_focus || t.priority === 1) {
      const dateKey = t.due_date ? toLocalDateKey(t.due_date) : todayKey;
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.is_daily_focus ? 'Target Fokus Hari Ini' : 'Prioritas Utama P1',
        dateKey,
        moduleTab: 'tasks',
        badge: t.is_daily_focus ? 'DAILY FOCUS' : `P${t.priority} URGENT`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isToday: dateKey === todayKey,
        isUpcoming: dateKey > todayKey,
      });
    }
  }

  // Sort: Today first, then ascending by dateKey
  return items.sort((a, b) => {
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    return a.dateKey.localeCompare(b.dateKey);
  });
}
