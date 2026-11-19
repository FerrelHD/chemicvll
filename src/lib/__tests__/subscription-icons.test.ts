import assert from 'node:assert';
import {
  resolveSubscriptionBrandDomain,
  getSubscriptionIconUrl,
} from '../subscription-icons';

console.log('Testing Subscription Brand Icon Resolver...');

assert.strictEqual(resolveSubscriptionBrandDomain('Netflix Standard'), 'netflix.com');
assert.strictEqual(resolveSubscriptionBrandDomain('Spotify Duo'), 'spotify.com');
assert.strictEqual(resolveSubscriptionBrandDomain('ChatGPT Plus'), 'chatgpt.com');
assert.strictEqual(resolveSubscriptionBrandDomain('Claude Pro'), 'claude.ai');
assert.strictEqual(resolveSubscriptionBrandDomain('iCloud+ 200GB'), 'apple.com');
assert.strictEqual(resolveSubscriptionBrandDomain('Google One 100GB'), 'one.google.com');
assert.strictEqual(resolveSubscriptionBrandDomain('Biznet Home 1D'), 'biznetnetworks.com');
assert.strictEqual(resolveSubscriptionBrandDomain('Vidio Platinum'), 'vidio.com');

// Direct domain fallback
assert.strictEqual(resolveSubscriptionBrandDomain('Hosting niagahoster.co.id'), 'niagahoster.co.id');
assert.strictEqual(resolveSubscriptionBrandDomain('perplexity.ai'), 'perplexity.ai');

// Unknown generic service returns null (triggers initial avatar fallback)
assert.strictEqual(resolveSubscriptionBrandDomain('Gym Bulanan'), null);
assert.strictEqual(resolveSubscriptionBrandDomain('   '), null);

assert.strictEqual(
  getSubscriptionIconUrl('Spotify', 64),
  'https://www.google.com/s2/favicons?domain=spotify.com&sz=64'
);
assert.strictEqual(getSubscriptionIconUrl('WiFi Kos'), null);

console.log('All Subscription Brand Icon Resolver tests passed!');
