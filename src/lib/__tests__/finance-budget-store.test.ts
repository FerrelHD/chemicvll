import assert from 'node:assert';
import {
  computeBudgetProgress,
  getReversibleCycleTransactionIds,
  toLocalDateKey,
} from '../budget-utils';
import { isPendingDeletion, clearPendingDeletion } from '../supabase-delete';

const mockStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStore.get(k) ?? null,
  setItem: (k: string, v: string) => mockStore.set(k, String(v)),
  removeItem: (k: string) => mockStore.delete(k),
};

async function runTests() {
  const { useFinanceStore, DEFAULT_BUDGET_RULES } = await import('../../stores/useFinanceStore');

  console.log('Testing Finance Budget Store Actions & Persistence...');

  // Test 1: Default state initializes rules cleanly totalling 100%
  const s0 = useFinanceStore.getState();
  assert.strictEqual(s0.budgetPlan, null);
  assert.strictEqual(s0.budgetRules.length, DEFAULT_BUDGET_RULES.length);
  const pctSum = s0.budgetRules.reduce((sum, r) => sum + r.percentage, 0);
  assert.strictEqual(pctSum, 100);
  console.log('Test 1 Passed: Default budget split rules initialize to 100%');

  // Test 2: Save payday plan with optional wallet income logging
  const todayKey = toLocalDateKey(new Date());
  const initialWalletBal = s0.wallets[0].balance;
  s0.saveBudgetPlan({
    salaryAmount: 10_000_000,
    cycleStartDate: todayKey,
    fixedItems: [
      { id: 'fx-1', name: 'Kos', amount: 2_000_000, isPaid: false },
      { id: 'fx-2', name: 'Internet', amount: 300_000, isPaid: false },
    ],
    rules: DEFAULT_BUDGET_RULES,
    logIncomeToWalletId: 'w-bca',
  });

  const s1 = useFinanceStore.getState();
  assert.ok(s1.budgetPlan, 'budgetPlan must be saved');
  assert.strictEqual(s1.budgetPlan.salaryAmount, 10_000_000);
  assert.strictEqual(
    s1.wallets[0].balance,
    initialWalletBal + 10_000_000,
    'Wallet balance must reflect payday income'
  );
  assert.strictEqual(s1.transactions[0].type, 'income');
  assert.strictEqual(s1.transactions[0].category, 'Gajian / Payday');

  // Verify persisted to localStorage
  const persistedRaw = mockStore.get('chemicvll-finance-storage');
  assert.ok(persistedRaw, 'Finance budget storage must persist to localStorage');
  const parsed = JSON.parse(persistedRaw!);
  assert.strictEqual(parsed.state.budgetPlan.salaryAmount, 10_000_000);
  console.log('Test 2 Passed: Payday plan saved, wallet credited, and persisted to localStorage');

  // Test 3: Paying a fixed item via wallet deducts wallet balance WITHOUT double-counting against variable budget
  s1.toggleFixedItemPaid('fx-1', 'w-bca');
  const s2 = useFinanceStore.getState();
  const kosFixed = s2.budgetPlan?.fixedItems.find((f) => f.id === 'fx-1');
  assert.strictEqual(kosFixed?.isPaid, true);
  assert.strictEqual(
    s2.wallets[0].balance,
    initialWalletBal + 8_000_000,
    'Paying fixed item deducts wallet'
  );

  // Variable spending should still be Rp 0 because 'Pos Fix: Kos' is excluded from variable buckets
  const progressAfterFixed = computeBudgetProgress(s2.budgetPlan!, s2.transactions, todayKey);
  assert.strictEqual(
    progressAfterFixed.variableSpent,
    0,
    'Fixed bill wallet payment must not double-count against variable budget'
  );
  assert.strictEqual(progressAfterFixed.fixedPaidCount, 1);
  assert.strictEqual(progressAfterFixed.fixedPaidAmount, 2_000_000);
  console.log('Test 3 Passed: Fixed bill payment updates wallet balance with zero double-counting');

  // Test 4: Variable expense deducts correctly & persists in progress
  s2.addTransaction({
    wallet_id: 'w-bca',
    type: 'expense',
    category: 'Makan & Minum',
    amount: 50_000,
    note: 'Makan Siang',
  });
  const s3 = useFinanceStore.getState();
  const progressAfterMeal = computeBudgetProgress(s3.budgetPlan!, s3.transactions, todayKey);
  assert.strictEqual(progressAfterMeal.variableSpent, 50_000);
  assert.strictEqual(progressAfterMeal.todaySpent, 50_000);
  console.log('Test 4 Passed: Variable expense accurately deducts matching bucket & today allowance');

  // Test 5: Starting a new payday cycle archives previous plan into budgetHistory
  const nextMonthKey = '2026-12-25';
  s3.saveBudgetPlan({
    salaryAmount: 12_000_000,
    cycleStartDate: nextMonthKey,
    fixedItems: [{ id: 'fx-new', name: 'Kos', amount: 2_000_000, isPaid: false }],
    rules: DEFAULT_BUDGET_RULES,
  });
  const s4 = useFinanceStore.getState();
  assert.strictEqual(s4.budgetPlan?.salaryAmount, 12_000_000);
  assert.strictEqual(s4.budgetHistory.length, 1);
  assert.strictEqual(s4.budgetHistory[0].salaryAmount, 10_000_000);
  console.log('Test 5 Passed: Starting a new payday cycle archives previous plan cleanly');

  // Test 6: deleteTransaction accurately reverts income, expense, transfer balances & records tombstones
  s4.addWallet({
    name: 'BNI Spending',
    type: 'bank',
    balance: 1_000_000,
    color: '#EA580C',
  });
  const sWallets = useFinanceStore.getState();
  const secondWalletId = sWallets.wallets.find((w) => w.name === 'BNI Spending')!.id;
  const bcaBeforeUndo = sWallets.wallets.find((w) => w.id === 'w-bca')!.balance;
  const bniBeforeUndo = sWallets.wallets.find((w) => w.id === secondWalletId)!.balance;

  sWallets.addTransaction({
    wallet_id: 'w-bca',
    to_wallet_id: secondWalletId,
    type: 'transfer',
    category: 'Transfer',
    amount: 500_000,
    note: 'Pindah ke spending',
  });
  sWallets.addTransaction({
    wallet_id: secondWalletId,
    type: 'expense',
    category: 'Makan & Minum',
    amount: 75_000,
    note: 'Salah input kopi',
  });
  sWallets.addTransaction({
    wallet_id: 'w-bca',
    type: 'income',
    category: 'Bonus',
    amount: 250_000,
    note: 'Typo bonus',
  });

  const sMid = useFinanceStore.getState();
  assert.strictEqual(
    sMid.wallets.find((w) => w.id === 'w-bca')!.balance,
    bcaBeforeUndo - 500_000 + 250_000
  );
  assert.strictEqual(
    sMid.wallets.find((w) => w.id === secondWalletId)!.balance,
    bniBeforeUndo + 500_000 - 75_000
  );

  const bonusTx = sMid.transactions.find((t) => t.note === 'Typo bonus')!;
  const coffeeTx = sMid.transactions.find((t) => t.note === 'Salah input kopi')!;
  const transferTx = sMid.transactions.find((t) => t.note === 'Pindah ke spending')!;

  sMid.deleteTransaction(bonusTx.id);
  sMid.deleteTransaction(coffeeTx.id);
  sMid.deleteTransaction(transferTx.id);

  const sAfterUndo = useFinanceStore.getState();
  assert.strictEqual(
    sAfterUndo.wallets.find((w) => w.id === 'w-bca')!.balance,
    bcaBeforeUndo,
    'BCA balance must return to exact pre-undo figure'
  );
  assert.strictEqual(
    sAfterUndo.wallets.find((w) => w.id === secondWalletId)!.balance,
    bniBeforeUndo,
    'BNI balance must return to exact pre-undo figure'
  );
  assert.strictEqual(isPendingDeletion('transactions', bonusTx.id), true);
  assert.strictEqual(isPendingDeletion('transactions', coffeeTx.id), true);
  assert.strictEqual(isPendingDeletion('transactions', transferTx.id), true);
  clearPendingDeletion('transactions', bonusTx.id);
  clearPendingDeletion('transactions', coffeeTx.id);
  clearPendingDeletion('transactions', transferTx.id);
  console.log('Test 6 Passed: deleteTransaction reverses income/expense/transfer & queues tombstones');

  // Test 7: Deleting a Pos Fix transaction unchecks fixedItems.isPaid and rolls back wallet
  const bcaPreFix = useFinanceStore.getState().wallets.find((w) => w.id === 'w-bca')!.balance;
  sAfterUndo.toggleFixedItemPaid('fx-new', 'w-bca');
  const sPostFix = useFinanceStore.getState();
  assert.strictEqual(sPostFix.budgetPlan?.fixedItems[0].isPaid, true);
  assert.strictEqual(
    sPostFix.wallets.find((w) => w.id === 'w-bca')!.balance,
    bcaPreFix - 2_000_000
  );
  const posFixTx = sPostFix.transactions.find((t) => t.category === 'Pos Fix: Kos')!;
  assert.ok(sPostFix.budgetPlan?.linkedTransactionIds?.includes(posFixTx.id));
  sPostFix.deleteTransaction(posFixTx.id);

  const sPostFixUndo = useFinanceStore.getState();
  assert.strictEqual(sPostFixUndo.budgetPlan?.fixedItems[0].isPaid, false);
  assert.strictEqual(
    sPostFixUndo.wallets.find((w) => w.id === 'w-bca')!.balance,
    bcaPreFix
  );
  assert.strictEqual(sPostFixUndo.budgetPlan?.linkedTransactionIds?.includes(posFixTx.id), false);
  clearPendingDeletion('transactions', posFixTx.id);
  console.log('Test 7 Passed: Deleting a Pos Fix transaction unchecks paid status cleanly');

  // Test 8: resetBudgetPlan({ revertTransactions: false }) keeps wallets/tx intact & deletes cloud plan
  const currentPlanId = sPostFixUndo.budgetPlan!.id;
  const bcaBeforePlanOnlyReset = sPostFixUndo.wallets.find((w) => w.id === 'w-bca')!.balance;
  const txCountBeforePlanOnlyReset = sPostFixUndo.transactions.length;
  sPostFixUndo.resetBudgetPlan({ revertTransactions: false });

  const sPlanOnly = useFinanceStore.getState();
  assert.strictEqual(sPlanOnly.budgetPlan, null);
  assert.strictEqual(sPlanOnly.wallets.find((w) => w.id === 'w-bca')!.balance, bcaBeforePlanOnlyReset);
  assert.strictEqual(sPlanOnly.transactions.length, txCountBeforePlanOnlyReset);
  assert.strictEqual(isPendingDeletion('budget_plans', currentPlanId), true);
  clearPendingDeletion('budget_plans', currentPlanId);
  console.log('Test 8 Passed: Plan-only reset leaves transactions untouched & tombstones budget_plans');

  // Test 9: resetBudgetPlan({ revertTransactions: true }) reverts cycle payday + Pos Fix cleanly
  const trialDate = toLocalDateKey(new Date());
  const bcaPreTrial = sPlanOnly.wallets.find((w) => w.id === 'w-bca')!.balance;
  sPlanOnly.saveBudgetPlan({
    salaryAmount: 5_500_000,
    cycleStartDate: trialDate,
    fixedItems: [
      { id: 'f-saving', name: 'Saving', amount: 2_300_000, isPaid: false },
      { id: 'f-rumah', name: 'Rumah', amount: 700_000, isPaid: false },
    ],
    rules: DEFAULT_BUDGET_RULES,
    logIncomeToWalletId: 'w-bca',
  });
  useFinanceStore.getState().toggleFixedItemPaid('f-rumah', 'w-bca');
  // Add an unrelated manual snack expense that must NOT be deleted on cycle reset
  useFinanceStore.getState().addTransaction({
    wallet_id: 'w-bca',
    type: 'expense',
    category: 'Makan & Minum',
    amount: 25_000,
    note: 'Snack harian',
  });

  const sPreFullReset = useFinanceStore.getState();
  const trialPlan = sPreFullReset.budgetPlan!;
  const reversibleIds = getReversibleCycleTransactionIds(trialPlan, sPreFullReset.transactions);
  assert.strictEqual(reversibleIds.length, 2, 'Should find trial Payday income + Pos Fix: Rumah');

  sPreFullReset.resetBudgetPlan({ revertTransactions: true });
  const sPostFullReset = useFinanceStore.getState();
  assert.strictEqual(sPostFullReset.budgetPlan, null);
  assert.strictEqual(
    sPostFullReset.wallets.find((w) => w.id === 'w-bca')!.balance,
    bcaPreTrial - 25_000,
    'Payday (+5.5M) and Pos Fix (-700k) must revert, leaving manual Snack (-25k)'
  );
  assert.strictEqual(
    sPostFullReset.transactions.some((t) => reversibleIds.includes(t.id)),
    false
  );
  assert.strictEqual(
    sPostFullReset.transactions.some((t) => t.note === 'Snack harian'),
    true
  );
  assert.strictEqual(isPendingDeletion('budget_plans', trialPlan.id), true);
  for (const tid of reversibleIds) {
    assert.strictEqual(isPendingDeletion('transactions', tid), true);
    clearPendingDeletion('transactions', tid);
  }
  clearPendingDeletion('budget_plans', trialPlan.id);
  console.log('Test 9 Passed: Cycle reset with transaction rollback preserves unrelated tx & queues cloud deletions');

  // Test 10: Legacy fallback matching works for existing trial plans lacking linkedTransactionIds
  const legacyCreatedAt = new Date().toISOString();
  const legacyPlan = {
    id: 'budget-legacy-trial',
    cycleStartDate: '2026-12-16',
    cycleEndDate: '2027-01-15',
    salaryAmount: 5_500_000,
    fixedItems: [{ id: 'lg-1', name: 'Saving', amount: 2_300_000, isPaid: true }],
    rules: DEFAULT_BUDGET_RULES,
    created_at: legacyCreatedAt,
    updated_at: legacyCreatedAt,
  };
  useFinanceStore.setState({
    budgetPlan: legacyPlan,
    transactions: [
      {
        id: 'tx-legacy-payday',
        wallet_id: 'w-bca',
        to_wallet_id: null,
        project_id: null,
        type: 'income',
        category: 'Gajian / Payday',
        amount: 5_500_000,
        note: 'Alokasi gajian siklus 2026-12-16 s/d 2027-01-15',
        transaction_date: legacyCreatedAt,
        created_at: legacyCreatedAt,
      },
      {
        id: 'tx-legacy-fix',
        wallet_id: 'w-bca',
        to_wallet_id: null,
        project_id: null,
        type: 'expense',
        category: 'Pos Fix: Saving',
        amount: 2_300_000,
        note: 'Pembayaran pos fix: Saving',
        transaction_date: legacyCreatedAt,
        created_at: legacyCreatedAt,
      },
    ],
    wallets: [{ ...useFinanceStore.getState().wallets[0], id: 'w-bca', balance: 3_200_000 }],
  });
  useFinanceStore.getState().resetBudgetPlan({ revertTransactions: true });
  const sAfterLegacyReset = useFinanceStore.getState();
  assert.strictEqual(sAfterLegacyReset.budgetPlan, null);
  assert.strictEqual(sAfterLegacyReset.transactions.length, 0);
  assert.strictEqual(sAfterLegacyReset.wallets[0].balance, 0);
  clearPendingDeletion('budget_plans', 'budget-legacy-trial');
  clearPendingDeletion('transactions', 'tx-legacy-payday');
  clearPendingDeletion('transactions', 'tx-legacy-fix');
  console.log('Test 10 Passed: Legacy pre-tracking trial plan resets and rolls back accurately');

  console.log('All Finance Budget Store tests passed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
