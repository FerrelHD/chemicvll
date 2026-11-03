import assert from 'node:assert';
import { getRadarStatus, generateFollowUpDraft } from '../career-radar';
import { CareerPipeline } from '@/types/database';

console.log('Testing Career Follow-up Radar...');

const baseItem: CareerPipeline = {
  id: 'test-1',
  entity_name: 'Tech Corp',
  role_or_program: 'Backend Intern',
  category: 'internship',
  stage: 'applied',
  applied_date: '2026-10-20T00:00:00Z',
  deadline: null,
  platform_source: 'LinkedIn',
  work_type: 'hybrid',
  location: 'Jakarta',
  resume_version: 'CV.pdf',
  stipend_or_salary: null,
  contact_person: 'Kak Sarah',
  next_follow_up_date: null,
  portal_url: null,
  notes: null,
};

// 1. Elapsed >= 5 days on applied stage -> follow_up_due
const refDate = new Date('2026-10-28T00:00:00Z'); // 8 days elapsed
const status1 = getRadarStatus(baseItem, refDate);
assert.strictEqual(status1.urgency, 'follow_up_due');
assert.strictEqual(status1.isUrgent, true);

// 2. Freshly applied (< 5 days) -> normal
const status2 = getRadarStatus(baseItem, new Date('2026-10-22T00:00:00Z')); // 2 days elapsed
assert.strictEqual(status2.urgency, 'normal');
assert.strictEqual(status2.isUrgent, false);

// 3. Assessment stage with deadline < 48 hours -> assessment_urgent
const assessmentItem: CareerPipeline = {
  ...baseItem,
  stage: 'assessment',
  deadline: '2026-10-29T12:00:00Z',
};
const status3 = getRadarStatus(assessmentItem, new Date('2026-10-28T00:00:00Z')); // 36 hours remaining
assert.strictEqual(status3.urgency, 'assessment_urgent');
assert.strictEqual(status3.isUrgent, true);

// 4. Generate Email Draft
const emailDraft = generateFollowUpDraft(baseItem, 'email');
assert(emailDraft.includes('Tech Corp'));
assert(emailDraft.includes('Backend Intern'));
assert(emailDraft.includes('Kak Sarah'));

// 5. Generate WhatsApp Draft
const waDraft = generateFollowUpDraft(baseItem, 'whatsapp');
assert(waDraft.includes('Tech Corp'));
assert(waDraft.includes('Backend Intern'));

console.log('Career Follow-up Radar tests passed successfully!');
