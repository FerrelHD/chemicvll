import {
  BudgetSplitRule,
  FixedAllocation,
  MonthlyBudgetPlan,
  Transaction,
} from '@/types/database';

const MS_PER_DAY = 86_400_000;
const FIXED_PAYMENT_PREFIX = 'Pos Fix:';

export interface PaydayCycle {
  cycleStartDate: string;
  cycleEndDate: string;
}

export interface CycleTimeline {
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  isExpired: boolean;
}

export interface AllocatedRuleBucket {
  rule: BudgetSplitRule;
  allocatedAmount: number;
}

export interface AllocationResult {
  salaryAmount: number;
  fixedTotal: number;
  disposableAmount: number;
  deficitAmount: number;
  isOverAllocated: boolean;
  totalRulePercentage: number;
  isValidRules: boolean;
  buckets: AllocatedRuleBucket[];
}

export interface BucketProgress extends AllocatedRuleBucket {
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

export interface BudgetProgressSummary {
  timeline: CycleTimeline;
  allocation: AllocationResult;
  fixedPaidCount: number;
  fixedPaidAmount: number;
  savingsAllocated: number;
  savingsSpent: number;
  variableAllocated: number;
  variableSpent: number;
  variableRemaining: number;
  unmappedSpent: number;
  todaySpent: number;
  dailyAllowanceToday: number;
  remainingToday: number;
  buckets: BucketProgress[];
}

/**
 * Formats a fixed item name into a reserved transaction category so paying a
 * fixed bill out of a wallet updates wallet balances without double-counting
 * against variable disposable spending.
 */
export function parseFixedPaymentCategory(itemName: string): string {
  return `${FIXED_PAYMENT_PREFIX} ${itemName.trim()}`;
}

/**
 * Returns true if the transaction category represents payment of an already
 * deducted fixed allocation.
 */
export function isFixedPaymentCategory(category: string): boolean {
  return category.trim().toLowerCase().startsWith(FIXED_PAYMENT_PREFIX.toLowerCase());
}

/**
 * Converts a YYYY-MM-DD string or ISO timestamp into a local YYYY-MM-DD key
 * without timezone drift across midnight.
 */
export function toLocalDateKey(dateInput?: string | Date): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const y = safeDate.getFullYear();
  const m = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKeyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatUtcMsToDateKey(utcMs: number): string {
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Computes an inclusive payday-to-next-payday cycle ending the day before the
 * same day of the following month (clamping month-end days like Jan 31 -> Feb 28/29).
 */
export function computePaydayCycle(startDateStr: string): PaydayCycle {
  const startKey = toLocalDateKey(startDateStr);
  const [y, m, d] = startKey.split('-').map(Number);

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const nextPaydayDay = Math.min(d, daysInNextMonth);

  const nextPaydayUtcMs = Date.UTC(nextYear, nextMonth - 1, nextPaydayDay);
  const cycleEndDate = formatUtcMsToDateKey(nextPaydayUtcMs - MS_PER_DAY);

  return {
    cycleStartDate: startKey,
    cycleEndDate,
  };
}

/**
 * Computes elapsed and remaining days across an inclusive budget cycle window.
 */
export function computeCycleTimeline(
  cycleStartDate: string,
  cycleEndDate: string,
  referenceDate?: string | Date
): CycleTimeline {
  const startMs = parseDateKeyToUtcMs(toLocalDateKey(cycleStartDate));
  const endMs = parseDateKeyToUtcMs(toLocalDateKey(cycleEndDate));
  const refMs = parseDateKeyToUtcMs(toLocalDateKey(referenceDate));

  const totalDays = Math.max(1, Math.round((endMs - startMs) / MS_PER_DAY) + 1);
  const isExpired = refMs > endMs;

  if (isExpired) {
    return { totalDays, daysElapsed: totalDays, daysRemaining: 0, isExpired: true };
  }
  if (refMs < startMs) {
    return { totalDays, daysElapsed: 0, daysRemaining: totalDays, isExpired: false };
  }

  const daysElapsed = Math.round((refMs - startMs) / MS_PER_DAY) + 1;
  const daysRemaining = Math.max(1, Math.round((endMs - refMs) / MS_PER_DAY) + 1);

  return { totalDays, daysElapsed, daysRemaining, isExpired: false };
}

/**
 * Allocates post-fixed disposable salary across percentage rules using
 * Hamilton's Largest Remainder Method on whole Rupiah integers so the sum of
 * all allocated buckets equals disposableAmount with zero rounding drift.
 */
export function allocateNetBudget(
  salaryAmount: number,
  fixedItems: FixedAllocation[],
  rules: BudgetSplitRule[]
): AllocationResult {
  const safeSalary = Math.max(0, Math.round(salaryAmount || 0));
  const fixedTotal = fixedItems.reduce(
    (sum, item) => sum + Math.max(0, Math.round(item.amount || 0)),
    0
  );

  const isOverAllocated = fixedTotal > safeSalary;
  const deficitAmount = Math.max(0, fixedTotal - safeSalary);
  const disposableAmount = Math.max(0, safeSalary - fixedTotal);

  const totalRulePercentage = Number(
    rules.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0).toFixed(2)
  );
  const isValidRules =
    rules.length > 0 &&
    Math.abs(totalRulePercentage - 100) < 0.01 &&
    rules.every((r) => Number(r.percentage) >= 0);

  if (disposableAmount === 0 || rules.length === 0) {
    return {
      salaryAmount: safeSalary,
      fixedTotal,
      disposableAmount,
      deficitAmount,
      isOverAllocated,
      totalRulePercentage,
      isValidRules,
      buckets: rules.map((rule) => ({ rule, allocatedAmount: 0 })),
    };
  }

  const shares = rules.map((rule, index) => {
    const raw = (disposableAmount * (Number(rule.percentage) || 0)) / 100;
    const floored = Math.floor(raw);
    return {
      index,
      floored,
      remainder: raw - floored,
    };
  });

  if (isValidRules) {
    const sumFloored = shares.reduce((s, x) => s + x.floored, 0);
    let leftover = disposableAmount - sumFloored;

    const byRemainder = [...shares].sort(
      (a, b) => b.remainder - a.remainder || a.index - b.index
    );

    for (const item of byRemainder) {
      if (leftover <= 0) break;
      shares[item.index].floored += 1;
      leftover -= 1;
    }
  }

  return {
    salaryAmount: safeSalary,
    fixedTotal,
    disposableAmount,
    deficitAmount,
    isOverAllocated,
    totalRulePercentage,
    isValidRules,
    buckets: rules.map((rule, i) => ({
      rule,
      allocatedAmount: shares[i].floored,
    })),
  };
}

function findMatchingRuleId(category: string, rules: BudgetSplitRule[]): string | null {
  const norm = category.trim().toLowerCase();
  if (!norm) return null;

  for (const rule of rules) {
    if (rule.name.trim().toLowerCase() === norm) {
      return rule.id;
    }
    if (rule.categories.some((c) => c.trim().toLowerCase() === norm)) {
      return rule.id;
    }
  }
  return null;
}

/**
 * Evaluates real-time spending and safe-to-spend daily limits against an
 * active monthly payday budget plan.
 */
export function computeBudgetProgress(
  plan: MonthlyBudgetPlan,
  transactions: Transaction[],
  referenceDate?: string | Date
): BudgetProgressSummary {
  const refKey = toLocalDateKey(referenceDate);
  const timeline = computeCycleTimeline(plan.cycleStartDate, plan.cycleEndDate, refKey);
  const allocation = allocateNetBudget(plan.salaryAmount, plan.fixedItems, plan.rules);

  const spentByRule = new Map<string, number>();
  for (const b of allocation.buckets) {
    spentByRule.set(b.rule.id, 0);
  }

  let unmappedSpent = 0;
  let todaySpent = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (isFixedPaymentCategory(tx.category)) continue;

    const txKey = toLocalDateKey(tx.transaction_date);
    if (txKey < plan.cycleStartDate || txKey > plan.cycleEndDate) continue;

    const amount = Math.max(0, Math.round(tx.amount || 0));
    const matchedRuleId = findMatchingRuleId(tx.category, plan.rules);

    if (matchedRuleId) {
      spentByRule.set(matchedRuleId, (spentByRule.get(matchedRuleId) || 0) + amount);
      const matchedRule = plan.rules.find((r) => r.id === matchedRuleId);
      if (txKey === refKey && !matchedRule?.isSavings) {
        todaySpent += amount;
      }
    } else {
      unmappedSpent += amount;
      if (txKey === refKey) {
        todaySpent += amount;
      }
    }
  }

  const buckets: BucketProgress[] = allocation.buckets.map(({ rule, allocatedAmount }) => {
    const spent = spentByRule.get(rule.id) || 0;
    const remaining = allocatedAmount - spent;
    const percentUsed =
      allocatedAmount > 0 ? Math.round((spent / allocatedAmount) * 100) : spent > 0 ? 100 : 0;

    let status: BucketProgress['status'] = 'healthy';
    if (spent > allocatedAmount) {
      status = 'exceeded';
    } else if (percentUsed >= 80) {
      status = 'warning';
    }

    return {
      rule,
      allocatedAmount,
      spent,
      remaining,
      percentUsed,
      status,
    };
  });

  const savingsBuckets = buckets.filter((b) => b.rule.isSavings);
  const variableBuckets = buckets.filter((b) => !b.rule.isSavings);

  const savingsAllocated = savingsBuckets.reduce((s, b) => s + b.allocatedAmount, 0);
  const savingsSpent = savingsBuckets.reduce((s, b) => s + b.spent, 0);

  const variableAllocated = variableBuckets.reduce((s, b) => s + b.allocatedAmount, 0);
  const variableSpent =
    variableBuckets.reduce((s, b) => s + b.spent, 0) + unmappedSpent;
  const variableRemaining = variableAllocated - variableSpent;

  // Keep daily allowance stable throughout the day using balance at start of reference day.
  const remainingAtStartOfToday = variableRemaining + todaySpent;
  const dailyAllowanceToday =
    timeline.daysRemaining > 0 && remainingAtStartOfToday > 0
      ? Math.floor(remainingAtStartOfToday / timeline.daysRemaining)
      : 0;
  const remainingToday = dailyAllowanceToday - todaySpent;

  const fixedPaidCount = plan.fixedItems.filter((f) => f.isPaid).length;
  const fixedPaidAmount = plan.fixedItems
    .filter((f) => f.isPaid)
    .reduce((sum, f) => sum + Math.max(0, Math.round(f.amount || 0)), 0);

  return {
    timeline,
    allocation,
    fixedPaidCount,
    fixedPaidAmount,
    savingsAllocated,
    savingsSpent,
    variableAllocated,
    variableSpent,
    variableRemaining,
    unmappedSpent,
    todaySpent,
    dailyAllowanceToday,
    remainingToday,
    buckets,
  };
}
