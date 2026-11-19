import assert from 'node:assert';
import {
  formatRupiahInput,
  parseRupiahInput,
  getDaysUntilDate,
  formatBillingDate,
} from '../utils';

console.log('Testing Currency & Billing Date Utils...');

assert.strictEqual(formatRupiahInput(''), '');
assert.strictEqual(formatRupiahInput('0'), '0');
assert.strictEqual(formatRupiahInput('00050000'), '50.000');
assert.strictEqual(formatRupiahInput('8000000'), '8.000.000');
assert.strictEqual(formatRupiahInput('Rp 1.250.000'), '1.250.000');
assert.strictEqual(formatRupiahInput(54000), '54.000');

assert.strictEqual(parseRupiahInput(''), 0);
assert.strictEqual(parseRupiahInput('50.000'), 50000);
assert.strictEqual(parseRupiahInput('8.000.000'), 8000000);
assert.strictEqual(parseRupiahInput('abc'), 0);

const fixedNow = new Date(2026, 10, 19, 23, 30, 0); // 19 Nov 2026 23:30 local
assert.strictEqual(getDaysUntilDate('2026-11-19', fixedNow), 0);
assert.strictEqual(getDaysUntilDate('2026-11-22', fixedNow), 3);
assert.strictEqual(getDaysUntilDate('2026-11-17', fixedNow), -2);

assert.strictEqual(formatBillingDate('2026-11-25'), '25 Nov 2026');

console.log('All Currency & Billing Date Utils tests passed!');
