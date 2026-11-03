import assert from 'node:assert';
import { checkAndExecuteRollover } from '../daily-rollover';
import { Task } from '@/types/database';

console.log('Testing Daily Task Rollover...');

const testTasks: Task[] = [
  {
    id: 't-1',
    title: 'Urgent System Design Prep',
    priority: 1,
    is_daily_focus: false,
    status: 'todo',
    project_id: null,
    due_date: null,
    completed_at: null,
  },
  {
    id: 't-2',
    title: 'Completed Task',
    priority: 1,
    is_daily_focus: true,
    status: 'done',
    project_id: null,
    due_date: null,
    completed_at: '2026-10-31T10:00:00Z',
  },
  {
    id: 't-3',
    title: 'Non-P1 Task',
    priority: 2,
    is_daily_focus: false,
    status: 'todo',
    project_id: null,
    due_date: null,
    completed_at: null,
  },
];

// 1. Same day -> shouldBrief = false, no rollover
const res1 = checkAndExecuteRollover(testTasks, '2026-11-03', '2026-11-03');
assert.strictEqual(res1.shouldBrief, false);
assert.strictEqual(res1.rolledOverCount, 0);

// 2. New day -> shouldBrief = true, t-1 rolled over to is_daily_focus = true
const res2 = checkAndExecuteRollover(testTasks, '2026-11-04', '2026-11-03');
assert.strictEqual(res2.shouldBrief, true);
assert.strictEqual(res2.rolledOverCount, 1);
const rolledOver = res2.updatedTasks.find((t) => t.id === 't-1');
assert.strictEqual(rolledOver?.is_daily_focus, true);

// 3. First time visit (lastRolloverDate is null) -> shouldBrief = true
const res3 = checkAndExecuteRollover(testTasks, '2026-11-04', null);
assert.strictEqual(res3.shouldBrief, true);

console.log('Daily Task Rollover tests passed successfully!');
