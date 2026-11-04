import assert from 'node:assert';
import { useCareerStore } from '../../stores/useCareerStore';
import { getRadarStatus, generateFollowUpDraft } from '../career-radar';
import { CareerPipeline } from '@/types/database';

console.log('Testing Career Follow-up Generator & Radar Reset...');

const testItem: CareerPipeline = {
  id: 'career-test-fu',
  entity_name: 'Shopee Indonesia',
  role_or_program: 'Software Engineer',
  category: 'job',
  stage: 'applied',
  applied_date: '2026-10-25T00:00:00Z', // 10 days ago
  deadline: null,
  platform_source: 'LinkedIn',
  work_type: 'hybrid',
  location: 'Jakarta',
  resume_version: 'CV_Ferrel.pdf',
  stipend_or_salary: null,
  contact_person: 'Kak Dina',
  next_follow_up_date: null,
  portal_url: null,
  notes: null,
};

// 1. Verify radar detects follow_up_due
const radarBefore = getRadarStatus(testItem, new Date('2026-11-04T00:00:00Z'));
assert.strictEqual(radarBefore.urgency, 'follow_up_due');
assert.strictEqual(radarBefore.isUrgent, true);
console.log('Test 1 Passed: Follow-up urgency detected correctly');

// 2. Verify WhatsApp Draft generation
const waDraft = generateFollowUpDraft(testItem, 'whatsapp');
assert(waDraft.includes('Kak Dina'));
assert(waDraft.includes('Software Engineer'));
assert(waDraft.includes('Shopee Indonesia'));
console.log('Test 2 Passed: WhatsApp draft contains role, company, and recruiter name');

// 3. Verify Email Draft generation
const emailDraft = generateFollowUpDraft(testItem, 'email');
assert(emailDraft.includes('Subject:'));
assert(emailDraft.includes('Shopee Indonesia'));
console.log('Test 3 Passed: Email draft contains structured professional format');

// 4. Verify Store Reset when Followed-Up
useCareerStore.getState().addItem({
  entity_name: 'Shopee Indonesia',
  role_or_program: 'Software Engineer',
  category: 'job',
  stage: 'applied',
  applied_date: '2026-10-25T00:00:00Z',
  contact_person: 'Kak Dina',
});

const storeItem = useCareerStore.getState().items[0];
assert(storeItem, 'Item should be present in store');

// Postpone by updating next_follow_up_date and applied_date to today
const nextDate = new Date();
nextDate.setDate(nextDate.getDate() + 7);

useCareerStore.getState().updateItem(storeItem.id, {
  next_follow_up_date: nextDate.toISOString().split('T')[0],
  applied_date: new Date().toISOString(),
});

const updatedStoreItem = useCareerStore.getState().items.find((i) => i.id === storeItem.id);
assert(updatedStoreItem);

const radarAfter = getRadarStatus(updatedStoreItem, new Date());
assert.strictEqual(radarAfter.urgency, 'normal');
assert.strictEqual(radarAfter.isUrgent, false);
console.log('Test 4 Passed: Store update successfully resets radar status to normal');

console.log('All Career Follow-Up Generator tests passed successfully!\n');
