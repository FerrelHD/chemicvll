import assert from 'node:assert';
import { useFinanceStore } from '../../stores/useFinanceStore';

console.log('Testing Split Bill / Debt Tracker Actions...');

const initialWallet = useFinanceStore.getState().wallets[0];
const initialBalance = initialWallet.balance;

// Test 1: Add Debt
useFinanceStore.getState().addDebt({
  user_id: 'ferrel',
  person_name: 'Budi Santoso',
  amount: 45000,
  description: 'Makan Nasi Padang Siang',
  due_date: '2026-11-25',
  is_settled: false,
  target_wallet_id: initialWallet.id,
});

const debts = useFinanceStore.getState().debts;
const addedDebt = debts.find((d) => d.person_name === 'Budi Santoso');
assert.ok(addedDebt, 'Debt should be added');
assert.strictEqual(addedDebt.amount, 45000, 'Amount should be 45000');
assert.strictEqual(addedDebt.is_settled, false, 'Should be unsettled');

// Test 2: Settle Debt and credit wallet
useFinanceStore.getState().settleDebt(addedDebt.id, initialWallet.id);

const settledDebt = useFinanceStore.getState().debts.find((d) => d.id === addedDebt.id);
assert.strictEqual(settledDebt?.is_settled, true, 'Should be settled');

const updatedWallet = useFinanceStore.getState().wallets.find((w) => w.id === initialWallet.id);
assert.strictEqual(
  updatedWallet?.balance,
  initialBalance + 45000,
  'Wallet balance should be credited by debt amount'
);

// Verify an income transaction was logged
const settleTx = useFinanceStore.getState().transactions.find(
  (t) => t.category === 'Talangan Selesai' && t.amount === 45000
);
assert.ok(settleTx, 'Income transaction should be recorded');

// Test 3: Delete Debt
useFinanceStore.getState().deleteDebt(addedDebt.id);
assert.strictEqual(
  useFinanceStore.getState().debts.some((d) => d.id === addedDebt.id),
  false,
  'Debt should be deleted'
);

console.log('All Split Bill / Debt Tracker tests passed successfully!');
