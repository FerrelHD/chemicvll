import { getSystemMetrics, isLocalEnvironment, getRunningProcesses } from '../dev-runner';

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

console.log('All Dev Runner Engine tests passed successfully!');

