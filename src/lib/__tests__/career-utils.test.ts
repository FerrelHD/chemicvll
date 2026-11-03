import assert from 'node:assert/strict';
import { getDaysElapsed, getFollowUpStatus } from '../career-utils';

function runTests() {
  console.log('Running career-utils tests...');
  const refDate = new Date('2026-11-03T12:00:00Z');

  // Test 1: getDaysElapsed
  assert.equal(getDaysElapsed(null), '');
  assert.equal(getDaysElapsed('invalid-date'), '');
  assert.equal(getDaysElapsed('2026-11-03T08:00:00Z', refDate), 'Today');
  assert.equal(getDaysElapsed('2026-10-24T12:00:00Z', refDate), '10d ago');
  assert.equal(getDaysElapsed('2026-11-05T12:00:00Z', refDate), 'Upcoming');

  // Test 2: getFollowUpStatus
  assert.equal(getFollowUpStatus(null), null);
  assert.equal(getFollowUpStatus('invalid-date'), null);

  const todayStatus = getFollowUpStatus('2026-11-03', refDate);
  assert.deepEqual(todayStatus, { isDue: true, label: 'Follow-up: Today' });

  const tomorrowStatus = getFollowUpStatus('2026-11-04', refDate);
  assert.deepEqual(tomorrowStatus, { isDue: true, label: 'Follow-up: Tomorrow' });

  const futureStatus = getFollowUpStatus('2026-11-10', refDate);
  assert.deepEqual(futureStatus, { isDue: false, label: 'Follow-up in 7d' });

  const overdueStatus = getFollowUpStatus('2026-11-01', refDate);
  assert.deepEqual(overdueStatus, { isDue: true, label: 'Follow-up overdue (2d ago)' });

  console.log('All career-utils tests passed successfully!');
}

runTests();
