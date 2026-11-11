import assert from 'node:assert';
import {
  computePaydayCycle,
  computeCycleTimeline,
  allocateNetBudget,
  computeBudgetProgress,
  toLocalDateKey,
  parseFixedPaymentCategory,
} from '../budget-utils';
import { BudgetSplitRule, FixedAllocation, MonthlyBudgetPlan, Transaction } from '../../types/database';

console.log('Testing Payday Budgeting Math & Accuracy Engine...');

// Test 1: Cycle date boundaries (payday 25th, 1st, Jan 31 -> Feb non-leap & leap year)
const cycle25 = computePaydayCycle('2026-11-25');
assert.strictEqual(cycle25.cycleStartDate, '2026-11-25');
assert.strictEqual(cycle25.cycleEndDate, '2026-12-24');

const cycle01 = computePaydayCycle('2026-11-01');
assert.strictEqual(cycle01.cycleStartDate, '2026-11-01');
assert.strictEqual(cycle01.cycleEndDate, '2026-11-30');

const cycleJan31NonLeap = computePaydayCycle('2026-01-31');
assert.strictEqual(cycleJan31NonLeap.cycleStartDate, '2026-01-31');
assert.strictEqual(cycleJan31NonLeap.cycleEndDate, '2026-02-27'); // next payday clamps Feb 28 -> end Feb 27

const cycleJan31Leap = computePaydayCycle('2024-01-31');
assert.strictEqual(cycleJan31Leap.cycleEndDate, '2024-02-28'); // next payday clamps Feb 29 -> end Feb 28
console.log('Test 1 Passed: Exact payday cycle date clamping across month lengths & leap years');

// Test 2: Cycle timeline calculations
const timelineDay1 = computeCycleTimeline('2026-11-25', '2026-12-24', '2026-11-25');
assert.strictEqual(timelineDay1.totalDays, 30);
assert.strictEqual(timelineDay1.daysElapsed, 1);
assert.strictEqual(timelineDay1.daysRemaining, 30);
assert.strictEqual(timelineDay1.isExpired, false);

const timelineLastDay = computeCycleTimeline('2026-11-25', '2026-12-24', '2026-12-24');
assert.strictEqual(timelineLastDay.daysRemaining, 1);
assert.strictEqual(timelineLastDay.daysElapsed, 30);
assert.strictEqual(timelineLastDay.isExpired, false);

const timelineExpired = computeCycleTimeline('2026-11-25', '2026-12-24', '2026-12-26');
assert.strictEqual(timelineExpired.daysRemaining, 0);
assert.strictEqual(timelineExpired.isExpired, true);
console.log('Test 2 Passed: Cycle timeline daysRemaining & expiry detection accurate');

// Test 3: Zero-drift Hamilton rounding for odd Rupiah values
const defaultRules: BudgetSplitRule[] = [
  { id: 'r-needs', name: 'Kebutuhan & Makan', percentage: 45, categories: ['Makan & Minum', 'Transportasi', 'Tagihan'], color: '#FF6B00' },
  { id: 'r-save', name: 'Tabungan & Investasi', percentage: 30, categories: ['Tabungan', 'Investasi'], color: '#10B981', isSavings: true },
  { id: 'r-life', name: 'Lifestyle & Tech', percentage: 15, categories: ['Belanja', 'Dev / Tech'], color: '#7C3AED' },
  { id: 'r-buf', name: 'Dana Cadangan', percentage: 10, categories: ['Lainnya', 'Umum'], color: '#3B82F6' },
];

const fixedOk: FixedAllocation[] = [
  { id: 'f-1', name: 'Kos', amount: 1_666_667, isPaid: true },
];
// Salary = 5_000_000, Fixed = 1_666_667 -> Disposable = 3_333_333 (odd number)
const allocOdd = allocateNetBudget(5_000_000, fixedOk, defaultRules);
assert.strictEqual(allocOdd.isValidRules, true);
assert.strictEqual(allocOdd.isOverAllocated, false);
assert.strictEqual(allocOdd.disposableAmount, 3_333_333);
const sumAllocated = allocOdd.buckets.reduce((s, b) => s + b.allocatedAmount, 0);
assert.strictEqual(sumAllocated, 3_333_333, 'Allocated sum must equal disposableAmount with 0 Rupiah drift');
console.log('Test 3 Passed: Zero-drift Rupiah allocation using Largest Remainder Method');

// Test 4: Over-allocated fixed guard & invalid percentage sum detection
const allocDeficit = allocateNetBudget(2_000_000, [{ id: 'f-1', name: 'Cicilan', amount: 2_500_000, isPaid: false }], defaultRules);
assert.strictEqual(allocDeficit.isOverAllocated, true);
assert.strictEqual(allocDeficit.deficitAmount, 500_000);
assert.strictEqual(allocDeficit.disposableAmount, 0);
assert.ok(allocDeficit.buckets.every((b) => b.allocatedAmount === 0));

const badRules: BudgetSplitRule[] = [
  { id: 'r1', name: 'A', percentage: 60, categories: [], color: '#000' },
  { id: 'r2', name: 'B', percentage: 30, categories: [], color: '#111' },
];
const allocInvalidPct = allocateNetBudget(1_000_000, [], badRules);
assert.strictEqual(allocInvalidPct.isValidRules, false);
assert.strictEqual(allocInvalidPct.totalRulePercentage, 90);
console.log('Test 4 Passed: Over-allocation deficit guard & percentage sum validation');

// Test 5: Transaction matching, transfer/income exclusion, Pos Fix anti-double-count & daily allowance math
const plan: MonthlyBudgetPlan = {
  id: 'budget-2026-11',
  cycleStartDate: '2026-11-01',
  cycleEndDate: '2026-11-10', // 10-day test window
  salaryAmount: 3_000_000,
  fixedItems: [{ id: 'f-kos', name: 'Kos', amount: 1_000_000, isPaid: true }],
  // Disposable = 2_000_000
  // Split rules below: 50% Needs (1_000_000), 30% Savings (600_000), 20% Lifestyle (400_000)
  // Total spendable (non-savings) = 1_400_000
  rules: [
    { id: 'r-needs', name: 'Kebutuhan & Makan', percentage: 50, categories: ['Makan & Minum', 'Transportasi'], color: '#FF6B00' },
    { id: 'r-save', name: 'Tabungan', percentage: 30, categories: ['Tabungan'], color: '#10B981', isSavings: true },
    { id: 'r-life', name: 'Lifestyle', percentage: 20, categories: ['Belanja'], color: '#7C3AED' },
  ],
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};

const transactions: Transaction[] = [
  // Should be IGNORED: out of date range (Oct 31)
  { id: 't1', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: 'Makan & Minum', amount: 50_000, note: 'Old', transaction_date: '2026-10-31' },
  // Should be IGNORED: transfer between wallets
  { id: 't2', wallet_id: 'w-bca', to_wallet_id: 'w-gopay', project_id: null, type: 'transfer', category: 'Top Up', amount: 500_000, note: 'Transfer', transaction_date: '2026-11-02' },
  // Should be IGNORED: income (payday)
  { id: 't3', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'income', category: 'Gajian / Payday', amount: 3_000_000, note: 'Salary', transaction_date: '2026-11-01' },
  // Should be IGNORED from variable budget (anti-double-count): Pos Fix payment
  { id: 't4', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: parseFixedPaymentCategory('Kos'), amount: 1_000_000, note: 'Bayar Kos', transaction_date: '2026-11-01' },
  // Day 1 Needs spend (case-insensitive & trailing space): 300_000
  { id: 't5', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: 'makan & minum ', amount: 300_000, note: 'Groceries', transaction_date: '2026-11-01' },
  // Day 2 Lifestyle spend: 100_000
  { id: 't6', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: 'Belanja', amount: 100_000, note: 'Book', transaction_date: '2026-11-02' },
  // Day 6 (Reference "Today") Needs spend: 40_000
  { id: 't7', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: 'Transportasi', amount: 40_000, note: 'Ojek', transaction_date: '2026-11-06' },
  // Day 6 Unmapped spend: 20_000 -> must NOT vanish!
  { id: 't8', wallet_id: 'w-bca', to_wallet_id: null, project_id: null, type: 'expense', category: 'Ngopi Random', amount: 20_000, note: 'Coffee', transaction_date: '2026-11-06' },
];

// Reference Date = 2026-11-06 -> daysRemaining from Nov 6..Nov 10 = 5 days
// Start of Nov 6 spendable remaining = 1_400_000 - (300_000 + 100_000) = 1_000_000
// Daily Allowance Today = 1_000_000 / 5 = 200_000
// Today Spent = 40_000 + 20_000 = 60_000
// Remaining Today = 200_000 - 60_000 = 140_000
// Total Variable Spent = 300_000 + 100_000 + 40_000 + 20_000 = 460_000
// Total Variable Remaining = 1_400_000 - 460_000 = 940_000
const progress = computeBudgetProgress(plan, transactions, '2026-11-06');

assert.strictEqual(progress.variableAllocated, 1_400_000);
assert.strictEqual(progress.savingsAllocated, 600_000);
assert.strictEqual(progress.variableSpent, 460_000);
assert.strictEqual(progress.unmappedSpent, 20_000);
assert.strictEqual(progress.variableRemaining, 940_000);
assert.strictEqual(progress.dailyAllowanceToday, 200_000);
assert.strictEqual(progress.todaySpent, 60_000);
assert.strictEqual(progress.remainingToday, 140_000);

const needsBucket = progress.buckets.find((b) => b.rule.id === 'r-needs');
assert.strictEqual(needsBucket?.spent, 340_000);
assert.strictEqual(needsBucket?.remaining, 660_000);
console.log('Test 5 Passed: Transaction cycle filter, transfer exclusion, Pos Fix anti-double-count & daily allowance accuracy');

// Test 6: Local date key preserves YYYY-MM-DD directly
assert.strictEqual(toLocalDateKey('2026-11-06'), '2026-11-06');
console.log('Test 6 Passed: Local date key consistency');

console.log('All Payday Budgeting Math & Accuracy tests passed successfully!');
