import assert from 'node:assert';
import { getUnifiedAgenda } from '../agenda-utils';
import { CareerPipeline, Subscription, Task } from '@/types/database';

console.log('Testing Unified Agenda Aggregator...');

const refDate = '2026-11-21';

const mockCareers: CareerPipeline[] = [
  {
    id: 'c1',
    user_id: 'ferrel',
    entity_name: 'Gojek',
    role_or_program: 'Frontend Intern',
    category: 'internship',
    stage: 'interview',
    applied_date: '2026-11-10T00:00:00Z',
    deadline: null,
    platform_source: 'LinkedIn',
    work_type: 'hybrid',
    location: 'Jakarta',
    resume_version: 'CV.pdf',
    stipend_or_salary: 'Rp 5.000.000',
    contact_person: null,
    next_follow_up_date: '2026-11-21',
    portal_url: 'https://meet.google.com/abc',
    notes: 'Technical Interview round 2',
    created_at: '2026-11-10T00:00:00Z',
    updated_at: '2026-11-10T00:00:00Z',
  },
  {
    id: 'c2',
    user_id: 'ferrel',
    entity_name: 'Shopee',
    role_or_program: 'Backend Intern',
    category: 'internship',
    stage: 'assessment',
    applied_date: '2026-11-15T00:00:00Z',
    deadline: '2026-11-23T00:00:00Z',
    platform_source: 'Website',
    work_type: 'remote',
    location: 'Jakarta',
    resume_version: 'CV.pdf',
    stipend_or_salary: null,
    contact_person: null,
    next_follow_up_date: null,
    portal_url: null,
    notes: 'HackerRank test',
    created_at: '2026-11-15T00:00:00Z',
    updated_at: '2026-11-15T00:00:00Z',
  },
];

const mockSubs: Subscription[] = [
  {
    id: 's1',
    name: 'Spotify Family',
    cost: 86000,
    billing_cycle: 'monthly',
    next_billing_date: '2026-11-22',
    is_active: true,
  },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Selesaikan API Endpoint',
    status: 'inbox',
    priority: 1,
    is_daily_focus: true,
    due_date: '2026-11-21T00:00:00Z',
    created_at: '2026-11-21T00:00:00Z',
  },
];

const items = getUnifiedAgenda(mockCareers, mockSubs, mockTasks, refDate);

assert.strictEqual(items.length, 4, 'Should aggregate 4 items across modules');
assert.strictEqual(items[0].isToday, true, 'First item should be today');
assert.strictEqual(items.some((i) => i.type === 'interview'), true, 'Contains interview');
assert.strictEqual(items.some((i) => i.type === 'subscription'), true, 'Contains subscription');
assert.strictEqual(items.some((i) => i.type === 'task'), true, 'Contains task');

console.log('Unified Agenda Aggregator tests passed!');
