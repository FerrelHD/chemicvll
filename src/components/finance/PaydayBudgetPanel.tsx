'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Lock,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { computeBudgetProgress } from '@/lib/budget-utils';
import { PaydayMark } from '@/components/icons/ChemicIcons';

interface PaydayBudgetPanelProps {
  onOpenSetup: (freshCycle?: boolean) => void;
}

export function PaydayBudgetPanel({ onOpenSetup }: PaydayBudgetPanelProps) {
  const {
    wallets,
    activeWalletId,
    transactions,
    budgetPlan,
    isPrivacyMode,
    toggleFixedItemPaid,
    resetBudgetPlan,
  } = useFinanceStore();

  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    activeWalletId || wallets[0]?.id || 'w-bca'
  );

  const progress = useMemo(() => {
    if (!budgetPlan) return null;
    return computeBudgetProgress(budgetPlan, transactions);
  }, [budgetPlan, transactions]);

  const formatRp = (val: number) => {
    if (isPrivacyMode) return 'Rp •••••••';
    const prefix = val < 0 ? '-Rp ' : 'Rp ';
    return `${prefix}${Math.abs(val).toLocaleString('id-ID')}`;
  };

  const formatShortDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (!budgetPlan || !progress) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline shadow-bento flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <PaydayMark className="w-6 h-6 text-on-surface mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-on-surface tracking-tight">
              Payday Budgeting
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
              Tetapkan nominal gajian dan pos fix bulanan sekali di awal, lalu sistem membagi sisa dana dan jatah aman harian secara presisi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSetup(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Atur Budget Gajian</span>
        </button>
      </div>
    );
  }

  const { timeline, allocation } = progress;

  // Build proportional segments across 100% of salary for the single allocation track
  const salaryTotal = Math.max(1, allocation.salaryAmount);
  const fixedSharePct =
    allocation.fixedTotal > 0 ? Math.min(100, (allocation.fixedTotal / salaryTotal) * 100) : 0;

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline shadow-bento space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline">
        <div className="flex items-start gap-3">
          <PaydayMark className="w-6 h-6 text-on-surface mt-0.5 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-on-surface tracking-tight">
                Payday Ledger
              </h2>
              <span className="text-xs text-on-surface-variant font-medium tabular-nums">
                {formatShortDate(budgetPlan.cycleStartDate)} - {formatShortDate(budgetPlan.cycleEndDate)}
              </span>
              <span
                className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                  timeline.isExpired
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {timeline.isExpired
                  ? 'Siklus selesai'
                  : `Hari ${timeline.daysElapsed}/${timeline.totalDays} (${timeline.daysRemaining} hari lagi)`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenSetup(true)}
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-4 py-2 sm:py-1.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gajian Baru</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenSetup(false)}
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3.5 py-2 sm:py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline text-on-surface text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset budget gajian aktif saat ini?')) {
                resetBudgetPlan();
              }
            }}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-error flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            aria-label="Reset Budget Plan"
            title="Reset Budget Plan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cycle Expired Prompt */}
      {timeline.isExpired && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Periode gajian berakhir pada <strong>{formatShortDate(budgetPlan.cycleEndDate)}</strong>. Mulai siklus baru agar batas harian kembali aktif.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenSetup(true)}
            className="min-h-[40px] px-4 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 self-start sm:self-auto transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            Mulai Siklus Baru
          </button>
        </div>
      )}

      {/* Single Focal Point: Daily Allowance Hero + Segmented Salary Track */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          {/* Focal Number */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block">
              Jatah Aman Hari Ini
            </span>
            <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
              <span
                className={`text-2xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                  progress.remainingToday < 0 ? 'text-error' : 'text-on-surface'
                }`}
              >
                {formatRp(progress.remainingToday)}
              </span>
              <span className="text-xs text-on-surface-variant tabular-nums">
                dari batas {formatRp(progress.dailyAllowanceToday)} / hari
              </span>
            </div>
          </div>

          {/* Inline Scannable Summary Strip (Replaces Duplicate 4-Box Grid) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs border-t lg:border-t-0 pt-3 lg:pt-0 border-outline">
            <div>
              <span className="text-on-surface-variant block text-[11px]">Gaji Siklus</span>
              <span className="font-bold text-on-surface tabular-nums">
                {formatRp(allocation.salaryAmount)}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px]">
                Pos Fix ({progress.fixedPaidCount}/{budgetPlan.fixedItems.length})
              </span>
              <span className="font-bold text-on-surface tabular-nums">
                {formatRp(allocation.fixedTotal)}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px]">Sisa Belanja</span>
              <span
                className={`font-bold tabular-nums ${
                  progress.variableRemaining < 0 ? 'text-error' : 'text-on-surface'
                }`}
              >
                {formatRp(progress.variableRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Tactile Segmented Payday Allocation Track */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex gap-0.5 p-0.5 border border-outline">
            {fixedSharePct > 0 && (
              <div
                className="h-full rounded-l-full bg-inverse-surface transition-all duration-300"
                style={{ width: `${fixedSharePct}%` }}
                title={`Pos Fix: ${Math.round(fixedSharePct)}%`}
              />
            )}
            {allocation.buckets.map((b, idx) => {
              const sharePct = (b.allocatedAmount / salaryTotal) * 100;
              if (sharePct <= 0) return null;
              const isFirst = fixedSharePct === 0 && idx === 0;
              const isLast = idx === allocation.buckets.length - 1;
              return (
                <div
                  key={b.rule.id}
                  className={`h-full transition-all duration-300 ${isFirst ? 'rounded-l-full' : ''} ${
                    isLast ? 'rounded-r-full' : ''
                  }`}
                  style={{ width: `${sharePct}%`, backgroundColor: b.rule.color }}
                  title={`${b.rule.name}: ${Math.round(sharePct)}%`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
            {allocation.fixedTotal > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-inverse-surface inline-block" />
                <span>Pos Fix</span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {Math.round(fixedSharePct)}%
                </span>
              </span>
            )}
            {allocation.buckets.map((b) => (
              <span key={b.rule.id} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm inline-block"
                  style={{ backgroundColor: b.rule.color }}
                />
                <span>{b.rule.name}</span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {Math.round((b.allocatedAmount / salaryTotal) * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hairline Editorial Split Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-outline">
        {/* Left: Checklist Pos Fix */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Pos Fix Bulanan
            </h3>
            <span className="text-[11px] text-on-surface-variant font-medium tabular-nums">
              {progress.fixedPaidCount}/{budgetPlan.fixedItems.length} lunas
            </span>
          </div>

          {budgetPlan.fixedItems.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 border-t border-outline">
              Tidak ada pos fix di siklus ini.
            </p>
          ) : (
            <div className="divide-y divide-outline border-t border-outline">
              {budgetPlan.fixedItems.map((item) => {
                const isPickingWallet = payingItemId === item.id;
                return (
                  <div key={item.id} className="py-1.5">
                    <div className="flex items-center justify-between gap-2 min-h-[44px]">
                      <button
                        type="button"
                        onClick={() => toggleFixedItemPaid(item.id)}
                        className="flex items-center gap-2.5 min-w-0 text-left flex-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container rounded-lg"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                            item.isPaid
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'border-on-surface-variant/40 bg-surface-container-low'
                          }`}
                        >
                          {item.isPaid && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-xs font-semibold truncate ${
                            item.isPaid ? 'line-through text-on-surface-variant' : 'text-on-surface'
                          }`}
                        >
                          {item.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-bold text-on-surface tabular-nums">
                          {formatRp(item.amount)}
                        </span>
                        {!item.isPaid && wallets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPayingItemId(isPickingWallet ? null : item.id)}
                            className="min-h-[32px] px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-inverse-surface hover:text-white border border-outline text-[11px] font-semibold text-on-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                            title="Bayar dan potong saldo dompet"
                          >
                            Bayar
                          </button>
                        )}
                      </div>
                    </div>

                    {isPickingWallet && !item.isPaid && (
                      <div className="mb-2 p-2.5 rounded-xl bg-surface-container-low border border-outline flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Wallet className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            className="flex-1 min-w-0 bg-surface-container-lowest border border-outline rounded-lg px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                          >
                            {wallets.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            toggleFixedItemPaid(item.id, selectedWalletId);
                            setPayingItemId(null);
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                        >
                          Potong Saldo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Alokasi Sisa Gajian */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Realisasi Pos Sisa Gajian
            </h3>
            <span className="text-xs text-on-surface-variant font-semibold tabular-nums">
              {formatRp(allocation.disposableAmount)}
            </span>
          </div>

          <div className="divide-y divide-outline border-t border-outline">
            {progress.buckets.map((bucket) => {
              const barColor =
                bucket.status === 'exceeded'
                  ? 'bg-error'
                  : bucket.status === 'warning'
                  ? 'bg-amber-600'
                  : bucket.rule.isSavings
                  ? 'bg-emerald-700'
                  : 'bg-primary-container';

              const barWidth = Math.min(100, Math.max(0, bucket.percentUsed));

              return (
                <div key={bucket.rule.id} className="py-3 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: bucket.rule.color }}
                      />
                      <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                        {bucket.rule.name}
                      </span>
                      <span className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                        {bucket.rule.percentage}%
                      </span>
                      {bucket.rule.isSavings && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#027A48]">
                          <Lock className="w-3 h-3" />
                          Terkunci
                        </span>
                      )}
                    </div>

                    <div className="text-right tabular-nums text-xs">
                      <span
                        className={`font-bold ${
                          bucket.remaining < 0 ? 'text-error' : 'text-on-surface'
                        }`}
                      >
                        Sisa {formatRp(bucket.remaining)}
                      </span>
                      <span className="text-on-surface-variant ml-1.5">
                        / {formatRp(bucket.allocatedAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                    <span className="truncate">
                      {bucket.rule.categories.length > 0
                        ? bucket.rule.categories.join(' · ')
                        : 'Belum ada kategori terhubung'}
                    </span>
                    <span className="tabular-nums font-medium shrink-0">
                      Terpakai {formatRp(bucket.spent)} ({bucket.percentUsed}%)
                    </span>
                  </div>
                </div>
              );
            })}

            {progress.unmappedSpent > 0 && (
              <div className="py-3 flex items-center justify-between gap-2 text-xs text-amber-900">
                <span>Pengeluaran di luar kategori pos (otomatis potong sisa belanja)</span>
                <span className="font-bold tabular-nums shrink-0">
                  {formatRp(progress.unmappedSpent)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
