import assert from 'node:assert';
import { computeBudgetProgress, toLocalDateKey } from '../budget-utils';

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

  console.log('All Finance Budget Store tests passed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
