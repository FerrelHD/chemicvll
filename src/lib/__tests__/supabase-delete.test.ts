import assert from 'node:assert';
import {
  getPendingDeletions,
  recordPendingDeletion,
  clearPendingDeletion,
  isPendingDeletion,
  deleteFromCloud,
} from '../supabase-delete';

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

  console.log('All Supabase Cloud Deletion tests passed successfully!\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
