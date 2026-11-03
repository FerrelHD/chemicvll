import assert from 'node:assert';
import { formatMaskedCurrency } from '../privacy-utils';

console.log('Testing Privacy Masking Utils...');

// Test 1: When isPrivacyMode is true, return masked string
assert.strictEqual(formatMaskedCurrency(1500000, true), 'Rp •••••••');
assert.strictEqual(formatMaskedCurrency(0, true), 'Rp •••••••');
console.log('Test 1 Passed: Correctly masks sensitive currency');

// Test 2: When isPrivacyMode is false, return formatted IDR currency
assert.strictEqual(formatMaskedCurrency(1500000, false), 'Rp 1.500.000');
assert.strictEqual(formatMaskedCurrency(0, false), 'Rp 0');
console.log('Test 2 Passed: Correctly reveals formatted currency');

async function testStorePrivacy() {
  const storageMap = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, v),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  };

  const { useFinanceStore } = await import('../../stores/useFinanceStore');

  // Test 3: Default isPrivacyMode is true
  assert.strictEqual(useFinanceStore.getState().isPrivacyMode, true);
  console.log('Test 3 Passed: useFinanceStore defaults to isPrivacyMode = true');

  // Test 4: togglePrivacyMode switches between true and false
  useFinanceStore.getState().togglePrivacyMode();
  assert.strictEqual(useFinanceStore.getState().isPrivacyMode, false);
  useFinanceStore.getState().togglePrivacyMode();
  assert.strictEqual(useFinanceStore.getState().isPrivacyMode, true);
  console.log('Test 4 Passed: togglePrivacyMode correctly flips privacy state');

  console.log('All Privacy Masking tests passed successfully!');
}

testStorePrivacy();
