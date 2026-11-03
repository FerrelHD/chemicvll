import assert from 'assert';

function validatePin(enteredPin: string, expectedPin: string): boolean {
  return enteredPin.trim() === expectedPin.trim();
}

console.log('Testing Master PIN validation...');

// Test 1: Valid PIN
assert.strictEqual(validatePin('2026', '2026'), true, 'Valid PIN should pass');

// Test 2: Invalid PIN
assert.strictEqual(validatePin('1234', '2026'), false, 'Invalid PIN should fail');

// Test 3: Trimming whitespace
assert.strictEqual(validatePin(' 2026 ', '2026'), true, 'Whitespace should be trimmed');

console.log('All Master PIN validation tests passed successfully!');

