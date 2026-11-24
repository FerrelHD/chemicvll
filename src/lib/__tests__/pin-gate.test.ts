import assert from 'node:assert';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  extractCookieValue,
  verifyAppPin,
  verifySessionToken,
} from '../session-auth';

console.log('Testing Master PIN & Signed Session Token...');

// Test 1: Server PIN verification
process.env.APP_PIN = '2026';
assert.strictEqual(verifyAppPin('2026'), true, 'Valid PIN should pass');
assert.strictEqual(verifyAppPin(' 2026 '), true, 'Whitespace should be trimmed');
assert.strictEqual(verifyAppPin('1234'), false, 'Invalid PIN should fail');

// Test 2: Session token signing & verification
const now = 1_700_000_000_000;
const token = createSessionToken(now);
assert.strictEqual(verifySessionToken(token, now + 1000), true, 'Valid session token should pass');
assert.strictEqual(
  verifySessionToken(token, now + 8 * 24 * 60 * 60 * 1000),
  false,
  'Expired session token should fail'
);
assert.strictEqual(verifySessionToken(`${token}a`, now + 1000), false, 'Tampered token should fail');

// Test 3: Cookie extraction
const cookieStr = `foo=bar; ${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; theme=dark`;
assert.strictEqual(extractCookieValue(cookieStr, SESSION_COOKIE_NAME), token);
assert.strictEqual(extractCookieValue(cookieStr, 'missing'), null);

console.log('All Master PIN & Session tests passed successfully!');
