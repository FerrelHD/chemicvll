import assert from 'node:assert';
import {
  getPendingDeletions,
  recordPendingDeletion,
  clearPendingDeletion,
  isPendingDeletion,
  deleteFromCloud,
} from '../supabase-delete';
import {
  budgetPlanToRow,
  isMissingTableError,
  rowToBudgetPlan,
} from '../budget-utils';
import type { MonthlyBudgetPlan } from '../../types/database';

console.log('Testing Supabase Cloud Deletion & Pending Queue...');

// Mock localStorage for test environment
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

async function runTests() {
  // Test 1: Initially empty queue
  assert.strictEqual(getPendingDeletions().length, 0);
  assert.strictEqual(isPendingDeletion('career_pipelines', 'career-123'), false);
  console.log('Test 1 Passed: Initially empty pending queue');

  // Test 2: Record pending deletion
  recordPendingDeletion('career_pipelines', 'career-123');
  assert.strictEqual(getPendingDeletions().length, 1);
  assert.strictEqual(isPendingDeletion('career_pipelines', 'career-123'), true);
  assert.strictEqual(isPendingDeletion('career_pipelines', 'career-456'), false);
  console.log('Test 2 Passed: Record pending deletion works');

  // Test 3: Clear pending deletion
  clearPendingDeletion('career_pipelines', 'career-123');
  assert.strictEqual(getPendingDeletions().length, 0);
  assert.strictEqual(isPendingDeletion('career_pipelines', 'career-123'), false);
  console.log('Test 3 Passed: Clear pending deletion works');

  // Test 4: deleteFromCloud records pending deletion even if no supabase client in node
  await deleteFromCloud('tasks', 'task-999');
  assert.strictEqual(isPendingDeletion('tasks', 'task-999'), true);
  clearPendingDeletion('tasks', 'task-999');
  console.log('Test 4 Passed: deleteFromCloud records tombstone safely');

  // Test 5: budget_plans tombstones work in SyncTable queue
  await deleteFromCloud('budget_plans', 'budget-trial-1');
  assert.strictEqual(isPendingDeletion('budget_plans', 'budget-trial-1'), true);
  clearPendingDeletion('budget_plans', 'budget-trial-1');
  assert.strictEqual(isPendingDeletion('budget_plans', 'budget-trial-1'), false);
  console.log('Test 5 Passed: budget_plans tombstone queue works');

  // Test 6: isMissingTableError detects Postgres / PostgREST schema errors only
  assert.strictEqual(isMissingTableError({ code: '42P01', message: 'relation does not exist' }), true);
  assert.strictEqual(isMissingTableError({ code: 'PGRST205', message: 'Could not find the table public.budget_plans' }), true);
  assert.strictEqual(isMissingTableError({ message: 'relation "public.budget_plans" does not exist' }), true);
  assert.strictEqual(isMissingTableError({ code: '23505', message: 'duplicate key value' }), false);
  assert.strictEqual(isMissingTableError(null), false);
  console.log('Test 6 Passed: isMissingTableError detection is accurate');

  // Test 7: budgetPlanToRow <-> rowToBudgetPlan round-trip serialization
  const samplePlan: MonthlyBudgetPlan = {
    id: 'budget-test-1',
    cycleStartDate: '2026-12-16',
    cycleEndDate: '2027-01-15',
    salaryAmount: 5_500_000,
    fixedItems: [
      { id: 'f-1', name: 'Saving', amount: 2_300_000, isPaid: false },
    ],
    rules: [
      { id: 'r-1', name: 'Kebutuhan', percentage: 100, categories: ['Makan'], color: '#E07A5F' },
    ],
    linkedTransactionIds: ['tx-100', 'tx-101'],
    created_at: '2026-12-16T08:00:00.000Z',
    updated_at: '2026-12-16T08:05:00.000Z',
  };
  const row = budgetPlanToRow(samplePlan, 'ferrel', true);
  assert.strictEqual(row.user_id, 'ferrel');
  assert.strictEqual(row.is_active, true);
  assert.deepStrictEqual(row.linked_transaction_ids, ['tx-100', 'tx-101']);

  const hydrated = rowToBudgetPlan({
    ...row,
    salary_amount: '5500000' as unknown as number,
  });
  assert.strictEqual(hydrated.id, samplePlan.id);
  assert.strictEqual(hydrated.cycleStartDate, '2026-12-16');
  assert.strictEqual(hydrated.cycleEndDate, '2027-01-15');
  assert.strictEqual(hydrated.salaryAmount, 5_500_000);
  assert.deepStrictEqual(hydrated.linkedTransactionIds, ['tx-100', 'tx-101']);
  assert.strictEqual(hydrated.syncedToCloud, true);
  console.log('Test 7 Passed: budget_plans row serialization round-trip works');

  console.log('All Supabase Cloud Deletion & Sync helper tests passed successfully!\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
