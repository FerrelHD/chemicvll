import assert from 'node:assert';
import { useHabitStore } from '../../stores/useHabitStore';

console.log('Testing Habit Store Actions & Streak Tracking...');

// Test 1: Add new habit
useHabitStore.getState().addHabit('Test Habit 1', 'coding');
const habits = useHabitStore.getState().habits;
const added = habits.find((h) => h.title === 'Test Habit 1');
assert.ok(added, 'Should add new habit successfully');
assert.strictEqual(added.streak, 0, 'Initial streak should be 0');

// Test 2: Toggle habit today
const today = '2026-11-21';
useHabitStore.getState().toggleHabitToday(added.id, today);
const updated = useHabitStore.getState().habits.find((h) => h.id === added.id);
assert.strictEqual(updated?.streak, 1, 'Streak should increment to 1');
assert.strictEqual(updated?.last_completed_date, today, 'Date should match today');

// Test 3: Untoggle habit today
useHabitStore.getState().toggleHabitToday(added.id, today);
const untoggled = useHabitStore.getState().habits.find((h) => h.id === added.id);
assert.strictEqual(untoggled?.streak, 0, 'Streak should decrement back to 0');
assert.strictEqual(untoggled?.last_completed_date, null, 'Date should be cleared');

// Test 4: Delete habit
useHabitStore.getState().deleteHabit(added.id);
assert.strictEqual(
  useHabitStore.getState().habits.some((h) => h.id === added.id),
  false,
  'Habit should be deleted'
);

console.log('All Habit Store tests passed successfully!');
