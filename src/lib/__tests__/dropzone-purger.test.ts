import assert from 'node:assert';
import { purgeExpiredDropzoneItems } from '../dropzone-purger';
import { DropzoneItem } from '@/types/database';

console.log('Testing Dropzone 24-Hour Auto-Purge...');

const now = new Date('2026-11-03T12:00:00Z').getTime();
const dayMs = 24 * 60 * 60 * 1000;

const testItems: DropzoneItem[] = [
  {
    id: 'd-1',
    content: 'Fresh snippet',
    type: 'text',
    device_source: 'desktop',
    is_pinned: false,
    created_at: new Date(now - 2 * 3600 * 1000).toISOString(), // 2 hours old
  },
  {
    id: 'd-2',
    content: 'Old unpinned item (48 hours)',
    type: 'text',
    device_source: 'desktop',
    is_pinned: false,
    created_at: new Date(now - 48 * 3600 * 1000).toISOString(), // 48 hours old (Expired!)
  },
  {
    id: 'd-3',
    content: 'Old PINNED item (72 hours)',
    type: 'code',
    device_source: 'desktop',
    is_pinned: true, // PINNED: must be protected
    created_at: new Date(now - 72 * 3600 * 1000).toISOString(),
  },
];

const res = purgeExpiredDropzoneItems(testItems, now, dayMs);

assert.strictEqual(res.purgedCount, 1);
assert.strictEqual(res.retainedItems.length, 2);
assert(res.retainedItems.some((i) => i.id === 'd-1'), 'Fresh item retained');
assert(res.retainedItems.some((i) => i.id === 'd-3'), 'Old pinned item retained');
assert(!res.retainedItems.some((i) => i.id === 'd-2'), 'Expired unpinned item purged');

console.log('Dropzone 24-Hour Auto-Purge tests passed successfully!');
