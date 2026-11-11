'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { BudgetSplitRule, FixedAllocation } from '@/types/database';
import { DEFAULT_BUDGET_RULES, useFinanceStore } from '@/stores/useFinanceStore';
import { allocateNetBudget, computePaydayCycle, toLocalDateKey } from '@/lib/budget-utils';

interface PaydayBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  startFreshCycle?: boolean;
}

const PRESET_COLORS = ['#FF6B00', '#10B981', '#7C3AED', '#3B82F6', '#EC4899', '#F59E0B'];

export function PaydayBudgetModal({
  isOpen,
  onClose,
  startFreshCycle = false,
}: PaydayBudgetModalProps) {
  const { wallets, activeWalletId, subscriptions, budgetPlan, budgetRules, saveBudgetPlan } =
    useFinanceStore();

  const [mounted, setMounted] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');
  const [cycleStartDate, setCycleStartDate] = useState(() => toLocalDateKey());
  const [fixedItems, setFixedItems] = useState<FixedAllocation[]>([]);
  const [rules, setRules] = useState<BudgetSplitRule[]>(DEFAULT_BUDGET_RULES);
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [logToWallet, setLogToWallet] = useState(false);
  const [targetWalletId, setTargetWalletId] = useState(activeWalletId || wallets[0]?.id || 'w-bca');
  const [subNotice, setSubNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const todayKey = toLocalDateKey();

    if (budgetPlan && !startFreshCycle) {
      setSalaryInput(String(budgetPlan.salaryAmount));
      setCycleStartDate(budgetPlan.cycleStartDate);
      setFixedItems(budgetPlan.fixedItems.map((f) => ({ ...f })));
      setRules(budgetPlan.rules.map((r) => ({ ...r, categories: [...r.categories] })));
      setLogToWallet(false);
    } else if (budgetPlan && startFreshCycle) {
      // New payday: carry over fixed bill templates (reset isPaid) & saved split rules
      setSalaryInput(String(budgetPlan.salaryAmount));
      setCycleStartDate(todayKey);
      setFixedItems(budgetPlan.fixedItems.map((f) => ({ ...f, isPaid: false })));
      setRules(
        (budgetRules.length > 0 ? budgetRules : DEFAULT_BUDGET_RULES).map((r) => ({
          ...r,
          categories: [...r.categories],
        }))
      );
      setLogToWallet(false);
    } else {
      setSalaryInput('');
      setCycleStartDate(todayKey);
      setFixedItems([]);
      setRules(
        (budgetRules.length > 0 ? budgetRules : DEFAULT_BUDGET_RULES).map((r) => ({
          ...r,
          categories: [...r.categories],
        }))
      );
      setLogToWallet(false);
    }

    setTargetWalletId(activeWalletId || wallets[0]?.id || 'w-bca');
    setNewFixedName('');
    setNewFixedAmount('');
    setSubNotice(null);
  }, [isOpen, startFreshCycle, budgetPlan, budgetRules, activeWalletId, wallets]);

  const parsedSalary = Math.max(0, Math.round(Number(salaryInput) || 0));

  const cyclePreview = useMemo(() => computePaydayCycle(cycleStartDate), [cycleStartDate]);

  const allocation = useMemo(
    () => allocateNetBudget(parsedSalary, fixedItems, rules),
    [parsedSalary, fixedItems, rules]
  );

  if (!isOpen || !mounted) return null;

  const handleAddFixedItem = () => {
    const cleanName = newFixedName.trim();
    const cleanAmt = Math.max(0, Math.round(Number(newFixedAmount) || 0));
    if (!cleanName || cleanAmt <= 0) return;

    setFixedItems((prev) => [
      ...prev,
      {
        id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        amount: cleanAmt,
        isPaid: false,
      },
    ]);
    setNewFixedName('');
    setNewFixedAmount('');
  };

  const handleImportSubscriptions = () => {
    const activeSubs = subscriptions.filter((s) => s.is_active);
    if (activeSubs.length === 0) {
      setSubNotice('Belum ada subscription aktif di Vault.');
      return;
    }

    let addedCount = 0;
    const nextItems = [...fixedItems];

    for (const sub of activeSubs) {
      const exists = nextItems.some(
        (f) => f.sourceSubId === sub.id || f.name.trim().toLowerCase() === sub.name.trim().toLowerCase()
      );
      if (exists) continue;

      const monthlyCost =
        sub.billing_cycle === 'yearly' ? Math.round(sub.cost / 12) : Math.round(sub.cost);

      nextItems.push({
        id: `fx-sub-${sub.id}-${Date.now()}`,
        name: sub.billing_cycle === 'yearly' ? `${sub.name} (Est/bln)` : sub.name,
        amount: monthlyCost,
        isPaid: false,
        sourceSubId: sub.id,
      });
      addedCount += 1;
    }

    setFixedItems(nextItems);
    setSubNotice(
      addedCount > 0
        ? `${addedCount} langganan aktif berhasil ditarik ke Pos Fix.`
        : 'Semua langganan aktif sudah ada di daftar Pos Fix.'
    );
  };

  const handleUpdateFixedAmount = (id: string, val: string) => {
    const amt = Math.max(0, Math.round(Number(val) || 0));
    setFixedItems((prev) => prev.map((f) => (f.id === id ? { ...f, amount: amt } : f)));
  };

  const handleRemoveFixed = (id: string) => {
    setFixedItems((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateRule = (id: string, patch: Partial<BudgetSplitRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleAddRule = () => {
    const color = PRESET_COLORS[rules.length % PRESET_COLORS.length];
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: 'Pos Baru',
        percentage: 0,
        categories: [],
        color,
        isSavings: false,
      },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAutoBalance100 = () => {
    if (rules.length === 0) return;
    const otherSum = rules.slice(0, -1).reduce((s, r) => s + Math.max(0, Number(r.percentage) || 0), 0);
    if (otherSum <= 100) {
      const remainderPct = Number((100 - otherSum).toFixed(2));
      setRules((prev) =>
        prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, percentage: remainderPct } : r))
      );
      return;
    }
    // Proportional normalization if preceding rules exceed 100%
    const total = rules.reduce((s, r) => s + Math.max(0, Number(r.percentage) || 0), 0);
    if (total <= 0) {
      setRules(DEFAULT_BUDGET_RULES.map((r) => ({ ...r, categories: [...r.categories] })));
      return;
    }
    let running = 0;
    const scaled = rules.map((r, idx) => {
      if (idx === rules.length - 1) {
        return { ...r, percentage: Number((100 - running).toFixed(2)) };
      }
      const pct = Math.round(((Number(r.percentage) || 0) / total) * 100);
      running += pct;
      return { ...r, percentage: pct };
    });
    setRules(scaled);
  };

  const canSubmit =
    parsedSalary > 0 && !allocation.isOverAllocated && allocation.isValidRules;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    saveBudgetPlan({
      salaryAmount: parsedSalary,
      cycleStartDate: cyclePreview.cycleStartDate,
      fixedItems,
      rules,
      logIncomeToWalletId: logToWallet ? targetWalletId : null,
    });
    onClose();
  };

  const formatCycleDateLabel = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-3 sm:pb-4 border-b border-outline/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                {startFreshCycle ? 'Mulai Siklus Gajian Baru' : 'Atur Payday Budgeting Otomatis'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Input nominal gajian &amp; pos fix — sisa dana otomatis terbagi presisi hingga Rp 1.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          id="payday-budget-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6"
        >
          {/* Section 1: Nominal Gajian & Siklus */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              1. Nominal Gajian &amp; Siklus
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nominal Gajian Masuk (Rp) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="cth. 8000000"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-on-surface focus:outline-none focus:border-primary-container"
                />
                {parsedSalary > 0 && (
                  <span className="text-[11px] text-on-surface-variant mt-1 block font-mono">
                    = Rp {parsedSalary.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Tanggal Gajian (Awal Siklus)
                </label>
                <input
                  type="date"
                  required
                  value={cycleStartDate}
                  onChange={(e) => setCycleStartDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
                <span className="text-[11px] text-on-surface-variant mt-1 block">
                  Siklus aktif: {formatCycleDateLabel(cyclePreview.cycleStartDate)} -{' '}
                  {formatCycleDateLabel(cyclePreview.cycleEndDate)}
                </span>
              </div>
            </div>

            {/* Optional Wallet Income Recording */}
            <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-outline/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={logToWallet}
                  onChange={(e) => setLogToWallet(e.target.checked)}
                  className="rounded border-outline text-primary-container focus:ring-primary-container"
                />
                <span>Sekaligus catat gaji ini sebagai pemasukan ke dompet</span>
              </label>

              {logToWallet && wallets.length > 0 && (
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="bg-surface-container-lowest border border-outline/30 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-on-surface outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section 2: Pos Fix Bulanan */}
          <div className="space-y-3 pt-2 border-t border-outline/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  2. Pos Fix (Tagihan / Kewajiban Pasti)
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Dipotong di awal sebelum sisa gaji dibagi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={handleImportSubscriptions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-[11px] font-semibold text-on-surface transition"
              >
                <RefreshCw className="w-3 h-3 text-primary-container" />
                <span>Tarik Subscriptions</span>
              </button>
            </div>

            {subNotice && (
              <p className="text-[11px] text-primary-container font-medium">{subNotice}</p>
            )}

            {/* Add new Fixed Item inline */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nama pos fix (cth. Kos, Cicilan, Orang Tua)"
                value={newFixedName}
                onChange={(e) => setNewFixedName(e.target.value)}
                className="flex-1 bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Nominal (Rp)"
                  value={newFixedAmount}
                  onChange={(e) => setNewFixedAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFixedItem();
                    }
                  }}
                  className="w-36 bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-container"
                />
                <button
                  type="button"
                  onClick={handleAddFixedItem}
                  className="px-3.5 py-2 rounded-xl bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {fixedItems.length > 0 && (
              <div className="space-y-2">
                {fixedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-container-low border border-outline/20"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        setFixedItems((prev) =>
                          prev.map((f) => (f.id === item.id ? { ...f, name: e.target.value } : f))
                        )
                      }
                      className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-on-surface-variant font-mono">Rp</span>
                      <input
                        type="number"
                        min={0}
                        value={item.amount}
                        onChange={(e) => handleUpdateFixedAmount(item.id, e.target.value)}
                        className="w-28 bg-surface-container-lowest border border-outline/30 rounded-lg px-2 py-1 text-xs font-mono text-right text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFixed(item.id)}
                        className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 transition"
                        title="Hapus pos fix"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Net Disposable Summary Strip */}
            <div
              className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                allocation.isOverAllocated
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div>
                <span className="font-semibold">Total Pos Fix: </span>
                <span className="font-mono font-bold">
                  Rp {allocation.fixedTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                {allocation.isOverAllocated ? (
                  <span className="font-bold flex items-center gap-1 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Defisit Rp {allocation.deficitAmount.toLocaleString('id-ID')} (Pos fix melebihi gaji)
                  </span>
                ) : (
                  <>
                    <span className="font-semibold">Sisa Dana Dibagi Otomatis: </span>
                    <span className="font-mono font-bold">
                      Rp {allocation.disposableAmount.toLocaleString('id-ID')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Aturan Auto-Split Sisa Gajian (%) */}
          <div className="space-y-3 pt-2 border-t border-outline/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  3. Aturan Auto-Split Sisa Gajian (%)
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Total persentase harus tepat 100% agar pembagian Rupiah akurat.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    allocation.isValidRules
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {allocation.isValidRules ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  Total: {allocation.totalRulePercentage}%
                </span>

                {!allocation.isValidRules && (
                  <button
                    type="button"
                    onClick={handleAutoBalance100}
                    className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold hover:opacity-90 transition"
                  >
                    Auto-Pas 100%
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setRules(DEFAULT_BUDGET_RULES.map((r) => ({ ...r, categories: [...r.categories] })))
                  }
                  className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                  title="Reset aturan default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {allocation.buckets.map(({ rule, allocatedAmount }) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-2xl bg-surface-container-low border border-outline/20 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rule.color }}
                      />
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                        className="flex-1 min-w-0 bg-surface-container-lowest border border-outline/20 rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline/30 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={rule.percentage}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              percentage: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-11 text-xs font-mono font-bold text-right text-on-surface bg-transparent focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-on-surface-variant">%</span>
                      </div>

                      <span className="text-xs font-mono font-bold text-on-surface min-w-[105px] text-right">
                        Rp {allocatedAmount.toLocaleString('id-ID')}
                      </span>

                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 transition"
                          title="Hapus pos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-outline/10">
                    <input
                      type="text"
                      placeholder="Kategori transaksi (pisah koma: Makan & Minum, Transportasi)"
                      value={rule.categories.join(', ')}
                      onChange={(e) =>
                        handleUpdateRule(rule.id, {
                          categories: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="flex-1 bg-transparent text-[11px] text-on-surface-variant focus:text-on-surface focus:outline-none"
                    />

                    <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant cursor-pointer shrink-0 select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(rule.isSavings)}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { isSavings: e.target.checked })
                        }
                        className="rounded border-outline text-emerald-600 focus:ring-emerald-600"
                      />
                      <span>Kunci sebagai Tabungan</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddRule}
              className="w-full py-2 rounded-2xl border border-dashed border-outline/40 hover:border-outline text-xs font-semibold text-on-surface-variant hover:text-on-surface transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pos Pembagian Otomatis</span>
            </button>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:px-6 sm:py-3.5 border-t border-outline/20 bg-surface-container-lowest shrink-0">
          <span className="text-[11px] text-on-surface-variant hidden sm:inline">
            {!canSubmit
              ? parsedSalary <= 0
                ? 'Masukkan nominal gajian terlebih dahulu.'
                : allocation.isOverAllocated
                ? 'Kurangi Pos Fix agar tidak melebihi nominal gajian.'
                : 'Pastikan total aturan split tepat 100%.'
              : 'Semua hitungan sudah seimbang & siap diterapkan.'}
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="payday-budget-form"
              disabled={!canSubmit}
              className={`px-6 py-2 rounded-full text-xs font-semibold shadow-md transition ${
                canSubmit
                  ? 'bg-inverse-surface text-white hover:bg-black active:scale-95'
                  : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
              }`}
            >
              Terapkan Budget Gajian
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
