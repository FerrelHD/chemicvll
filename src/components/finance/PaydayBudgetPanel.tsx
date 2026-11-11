'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Lock,
  PieChart,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { computeBudgetProgress } from '@/lib/budget-utils';

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
      <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                Payday Monthly Budgeting
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-semibold">
                Auto-Split
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Masukkan nominal gajian dan pos fix bulanan — sisanya terbagi otomatis dengan hitungan jatah aman harian yang presisi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSetup(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary-container" />
          <span>Atur Budget Gajian</span>
        </button>
      </div>
    );
  }

  const { timeline, allocation } = progress;

  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                Payday Budget Cockpit
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">
                <CalendarClock className="w-3 h-3" />
                {formatShortDate(budgetPlan.cycleStartDate)} -{' '}
                {formatShortDate(budgetPlan.cycleEndDate)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  timeline.isExpired
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {timeline.isExpired ? 'Siklus Selesai' : `Sisa ${timeline.daysRemaining} Hari`}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Hari ke-{timeline.daysElapsed} dari {timeline.totalDays} hari &bull; Pengeluaran di Vault &amp; Quick Capture memotong pos terkait secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenSetup(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gajian Baru</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenSetup(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline/30 text-on-surface text-xs font-semibold transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit Plan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset budget gajian aktif saat ini?')) {
                resetBudgetPlan();
              }
            }}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-rose-600 transition"
            title="Reset Budget Plan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cycle Expired Prompt */}
      {timeline.isExpired && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Periode gajian ini sudah berakhir pada{' '}
              <strong>{formatShortDate(budgetPlan.cycleEndDate)}</strong>. Mulai siklus baru agar
              hitungan harian aktif kembali.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenSetup(true)}
            className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold shrink-0 self-start sm:self-auto transition"
          >
            Mulai Siklus Baru
          </button>
        </div>
      )}

      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-container-low/80 border border-outline/20">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Gaji Siklus Ini
          </span>
          <span className="text-sm sm:text-base font-bold text-on-surface font-mono mt-1 block truncate">
            {formatRp(allocation.salaryAmount)}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5 block">
            {allocation.fixedTotal > 0
              ? `${Math.round((allocation.disposableAmount / Math.max(1, allocation.salaryAmount)) * 100)}% dana bebas`
              : '100% teralokasi'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low/80 border border-outline/20">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Pos Fix Terkunci
          </span>
          <span className="text-sm sm:text-base font-bold text-on-surface font-mono mt-1 block truncate">
            {formatRp(allocation.fixedTotal)}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5 block">
            {budgetPlan.fixedItems.length === 0
              ? 'Tidak ada pos fix'
              : `${progress.fixedPaidCount}/${budgetPlan.fixedItems.length} sudah lunas`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low/80 border border-outline/20">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
            Sisa Dana Belanja
          </span>
          <span
            className={`text-sm sm:text-base font-bold font-mono mt-1 block truncate ${
              progress.variableRemaining < 0 ? 'text-rose-600' : 'text-on-surface'
            }`}
          >
            {formatRp(progress.variableRemaining)}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5 block truncate">
            Terpakai {formatRp(progress.variableSpent)}
          </span>
        </div>

        <div
          className={`p-3.5 rounded-2xl border ${
            progress.remainingToday < 0
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-emerald-50/60 border-emerald-200/80'
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              progress.remainingToday < 0 ? 'text-rose-700' : 'text-emerald-800'
            }`}
          >
            Jatah Aman Hari Ini
          </span>
          <span
            className={`text-sm sm:text-base font-bold font-mono mt-1 block truncate ${
              progress.remainingToday < 0 ? 'text-rose-700' : 'text-emerald-800'
            }`}
          >
            {formatRp(progress.remainingToday)}
          </span>
          <span
            className={`text-[11px] mt-0.5 block truncate ${
              progress.remainingToday < 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            Batas hari ini {formatRp(progress.dailyAllowanceToday)}
          </span>
        </div>
      </div>

      {/* Main Split Content: Fixed Bills Checklist (Left) + Auto-Split Buckets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Pos Fix Bulanan Checklist */}
        <div className="lg:col-span-5 rounded-2xl bg-surface-container-low/50 border border-outline/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Checklist Pos Fix
            </h3>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {progress.fixedPaidCount}/{budgetPlan.fixedItems.length} Lunas
            </span>
          </div>

          {budgetPlan.fixedItems.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 text-center">
              Belum ada pos fix. Klik Edit Plan untuk menambahkan kos, cicilan, atau subscriptions.
            </p>
          ) : (
            <div className="space-y-2">
              {budgetPlan.fixedItems.map((item) => {
                const isPickingWallet = payingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      item.isPaid
                        ? 'bg-emerald-50/50 border-emerald-200/70'
                        : 'bg-surface-container-lowest border-outline/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFixedItemPaid(item.id)}
                        className="flex items-center gap-2 min-w-0 text-left flex-1"
                      >
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                            item.isPaid
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-outline/50 bg-surface-container-low'
                          }`}
                        >
                          {item.isPaid && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span
                          className={`font-semibold truncate ${
                            item.isPaid
                              ? 'line-through text-on-surface-variant'
                              : 'text-on-surface'
                          }`}
                        >
                          {item.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-on-surface">
                          {formatRp(item.amount)}
                        </span>
                        {!item.isPaid && wallets.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPayingItemId(isPickingWallet ? null : item.id)
                            }
                            className="px-2 py-0.5 rounded-full bg-surface-container-high hover:bg-inverse-surface hover:text-white text-[10px] font-semibold text-on-surface transition"
                            title="Bayar & potong saldo dompet"
                          >
                            Bayar
                          </button>
                        )}
                      </div>
                    </div>

                    {isPickingWallet && !item.isPaid && (
                      <div className="mt-2 pt-2 border-t border-outline/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Wallet className="w-3 h-3 text-on-surface-variant shrink-0" />
                          <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            className="flex-1 min-w-0 bg-surface-container-low border border-outline/30 rounded-lg px-2 py-1 text-[11px] font-medium text-on-surface outline-none"
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
                          className="px-2.5 py-1 rounded-lg bg-inverse-surface text-white text-[11px] font-semibold hover:bg-black transition shrink-0"
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

        {/* Right: Auto-Split Buckets & Live Spending Progress */}
        <div className="lg:col-span-7 rounded-2xl bg-surface-container-low/50 border border-outline/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Alokasi Otomatis Sisa Gajian
            </h3>
            <span className="text-[11px] text-on-surface-variant font-mono">
              {formatRp(allocation.disposableAmount)}
            </span>
          </div>

          <div className="space-y-3">
            {progress.buckets.map((bucket) => {
              const barColor =
                bucket.status === 'exceeded'
                  ? 'bg-rose-500'
                  : bucket.status === 'warning'
                  ? 'bg-amber-500'
                  : bucket.rule.isSavings
                  ? 'bg-emerald-500'
                  : 'bg-primary-container';

              const barWidth = Math.min(100, Math.max(0, bucket.percentUsed));

              return (
                <div
                  key={bucket.rule.id}
                  className="p-3 rounded-xl bg-surface-container-lowest border border-outline/20 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: bucket.rule.color }}
                      />
                      <span className="font-bold text-on-surface truncate">
                        {bucket.rule.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-[10px] font-mono font-semibold text-on-surface-variant">
                        {bucket.rule.percentage}%
                      </span>
                      {bucket.rule.isSavings && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          Tabungan
                        </span>
                      )}
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`font-bold ${
                          bucket.remaining < 0 ? 'text-rose-600' : 'text-on-surface'
                        }`}
                      >
                        Sisa {formatRp(bucket.remaining)}
                      </span>
                      <span className="text-[11px] text-on-surface-variant ml-1.5">
                        / {formatRp(bucket.allocatedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* Footer line: Category tags + spent summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                    <div className="flex flex-wrap items-center gap-1">
                      {bucket.rule.categories.length > 0 ? (
                        bucket.rule.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-1.5 py-0.5 rounded bg-surface-container-low border border-outline/20 text-[10px]"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] italic">Belum ada kategori terhubung</span>
                      )}
                    </div>

                    <span className="font-mono text-[11px]">
                      Terpakai {formatRp(bucket.spent)} ({bucket.percentUsed}%)
                    </span>
                  </div>
                </div>
              );
            })}

            {progress.unmappedSpent > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">
                    Pengeluaran di luar kategori pos (otomatis kurangi Sisa Dana Belanja)
                  </span>
                </div>
                <span className="font-mono font-bold shrink-0">
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
