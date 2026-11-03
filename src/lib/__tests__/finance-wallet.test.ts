import assert from 'node:assert';
const mockStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStore.get(k) ?? null,
  setItem: (k: string, v: string) => mockStore.set(k, String(v)),
  removeItem: (k: string) => mockStore.delete(k),
};

import { useFinanceStore } from '../../stores/useFinanceStore';

console.log('Testing Finance Wallet Store Functions...');

// Test 1: Initial state has 1 default BCA wallet
const state0 = useFinanceStore.getState();
assert.strictEqual(state0.wallets.length, 1);
assert.strictEqual(state0.wallets[0].name, 'Bank BCA');
assert.strictEqual(state0.activeWalletId, 'w-bca');
console.log('Test 1 Passed: Default single Bank BCA wallet');

// Test 2: Add a new wallet
state0.addWallet({
  name: 'Jenius m-Card',
  type: 'bank',
  balance: 500000,
  color: '#FF6B00',
  card_label: 'Debit Card',
  account_number: '9012',
  holder_name: 'FERREL',
  expiry: '12/28',
});

const state1 = useFinanceStore.getState();
assert.strictEqual(state1.wallets.length, 2);
const jeniusWallet = state1.wallets.find((w) => w.name === 'Jenius m-Card');
assert.ok(jeniusWallet);
assert.strictEqual(jeniusWallet.balance, 500000);
assert.strictEqual(jeniusWallet.card_label, 'Debit Card');
console.log('Test 2 Passed: Add new wallet');

// Test 3: Set active wallet
state1.setActiveWalletId(jeniusWallet.id);
const state2 = useFinanceStore.getState();
assert.strictEqual(state2.activeWalletId, jeniusWallet.id);
console.log('Test 3 Passed: Set active wallet');

// Test 4: Update wallet
state2.updateWallet(jeniusWallet.id, {
  name: 'Jenius Utama',
  balance: 750000,
});
const state3 = useFinanceStore.getState();
const updatedJenius = state3.wallets.find((w) => w.id === jeniusWallet.id);
assert.strictEqual(updatedJenius?.name, 'Jenius Utama');
assert.strictEqual(updatedJenius?.balance, 750000);
console.log('Test 4 Passed: Update wallet');

// Test 5: Delete wallet
state3.deleteWallet(jeniusWallet.id);
const state4 = useFinanceStore.getState();
assert.strictEqual(state4.wallets.length, 1);
assert.strictEqual(state4.activeWalletId, 'w-bca');
console.log('Test 5 Passed: Delete wallet and fall back active wallet');

console.log('All Finance Wallet Store tests passed successfully!');
