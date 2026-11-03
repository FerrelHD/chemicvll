import assert from 'node:assert';
import { checkPortHealth } from '../port-checker';

console.log('Testing Dev Port Health-Check Ping...');

async function runTests() {
  // 1. Port with no listener should return 'down'
  const unreachablePort = 59999;
  const statusDown = await checkPortHealth(unreachablePort, 500);
  assert.strictEqual(statusDown, 'down');

  console.log('Dev Port Health-Check tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
