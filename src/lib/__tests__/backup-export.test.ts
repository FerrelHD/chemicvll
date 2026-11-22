import assert from 'node:assert';
import { generateBackupPayload } from '../backup-export';

console.log('Testing Backup & Export Payload Engine...');

const payload = generateBackupPayload();

assert.strictEqual(payload.app, 'Personal OS (chemicvll)', 'App title should match');
assert.strictEqual(payload.version, '1.0', 'Version should be 1.0');
assert.ok(payload.exported_at, 'Export timestamp must be present');
assert.ok(Array.isArray(payload.stores.finance.wallets), 'Wallets should be an array');
assert.ok(Array.isArray(payload.stores.finance.transactions), 'Transactions should be an array');
assert.ok(Array.isArray(payload.stores.tasks.tasks), 'Tasks should be an array');
assert.ok(Array.isArray(payload.stores.habits.habits), 'Habits should be an array');
assert.ok(Array.isArray(payload.stores.career.items), 'Career items should be an array');
assert.ok(Array.isArray(payload.stores.notes.notes), 'Notes should be an array');
assert.ok(Array.isArray(payload.stores.dropzone.items), 'Dropzone items should be an array');

console.log('All Backup & Export Payload tests passed successfully!');
