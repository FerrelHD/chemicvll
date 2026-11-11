'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { getAvailableBudgetCategories } from '@/lib/budget-utils';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import { X, CornerDownLeft, ChevronDown } from 'lucide-react';
import { VaultMark, FocusMark, RelayMark } from '@/components/icons/ChemicIcons';
import { motion, AnimatePresence } from 'framer-motion';

export type QuickCaptureTab = 'expense' | 'task' | 'drop';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onShowNotice?: (msg: string) => void;
  initialTab?: QuickCaptureTab;
}

const EXPENSE_CATEGORIES = [
  'Makan & Minum',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Dev / Tech',
  'Lainnya',
];

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

export function QuickCaptureModal({
  isOpen,
  onClose,
  onNavigate,
  onShowNotice,
  initialTab = 'expense',
}: QuickCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<QuickCaptureTab>(initialTab);

  // Expense State
  const wallets = useFinanceStore((s) => s.wallets);
  const activeWalletId = useFinanceStore((s) => s.activeWalletId);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const budgetPlan = useFinanceStore((s) => s.budgetPlan);
  const budgetRules = useFinanceStore((s) => s.budgetRules);
  const expenseCategories = getAvailableBudgetCategories(budgetPlan?.rules || budgetRules);

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseWalletId, setExpenseWalletId] = useState(activeWalletId || wallets[0]?.id || 'w-bca');
  const [expenseNote, setExpenseNote] = useState('');

  // Task State
  const addTask = useTaskStore((s) => s.addTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<1 | 2 | 3>(2);
  const [taskIsDailyFocus, setTaskIsDailyFocus] = useState(false);

  // Dropzone State
  const addItem = useDropzoneStore((s) => s.addItem);
  const [dropContent, setDropContent] = useState('');

  // Focus ref
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Sync wallet default when wallets load
  useEffect(() => {
    if (activeWalletId) {
      setExpenseWalletId(activeWalletId);
    } else if (wallets[0]?.id) {
      setExpenseWalletId(wallets[0].id);
    }
  }, [activeWalletId, wallets]);

  // Reset & focus on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setExpenseAmount('');
      setExpenseNote('');
      setTaskTitle('');
      setTaskPriority(2);
      setTaskIsDailyFocus(false);
      setDropContent('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handlers
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number(expenseAmount.replace(/[^0-9]/g, ''));
    if (!cleanNum || cleanNum <= 0) return;

    addTransaction({
      wallet_id: expenseWalletId,
      type: 'expense',
      category: expenseCategory,
      amount: cleanNum,
      note: expenseNote.trim() || undefined,
    });

    onShowNotice?.(`Pengeluaran Rp ${cleanNum.toLocaleString('id-ID')} berhasil dicatat`);
    onClose();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask(taskTitle.trim(), taskPriority, taskIsDailyFocus);
    onShowNotice?.(`Task "${taskTitle.trim()}" ditambahkan ke Inbox`);
    onClose();
  };

  const handleDropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropContent.trim()) return;

    addItem(dropContent.trim());
    onShowNotice?.('Tersimpan ke Dropzone');
    onClose();
  };

  const addQuickAmount = (val: number) => {
    const current = Number(expenseAmount.replace(/[^0-9]/g, '')) || 0;
    setExpenseAmount(String(current + val));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 350 }}
        className="w-full sm:max-w-md bg-surface-container-lowest border border-outline/40 shadow-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline/20">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-on-surface">Quick Capture</h3>
            <p className="text-[11px] text-on-surface-variant">Catat instan ke sistem tanpa berpindah tab</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-low rounded-2xl mt-4 border border-outline/20">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'expense'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <VaultMark active={activeTab === 'expense'} className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'task'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FocusMark active={activeTab === 'task'} className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drop')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'drop'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <RelayMark active={activeTab === 'drop'} className="w-3.5 h-3.5" />
            <span>Quick Drop</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="mt-4 flex-1 overflow-y-auto">
          {/* TAB 1: QUICK EXPENSE */}
          {activeTab === 'expense' && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nominal Pengeluaran
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                    Rp
                  </span>
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={
                      expenseAmount
                        ? Number(expenseAmount.replace(/[^0-9]/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => setExpenseAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-surface-container-low border border-outline/40 rounded-2xl pl-11 pr-4 py-2.5 text-base font-bold tabular-nums text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed/50 transition"
                  />
                </div>

                {/* Quick Add Amount Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {QUICK_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => addQuickAmount(val)}
                      className="text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface px-2.5 py-1 rounded-full border border-outline/30 transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                  {expenseAmount && (
                    <button
                      type="button"
                      onClick={() => setExpenseAmount('')}
                      className="text-[11px] text-error hover:underline px-1.5"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="cth. Es Kopi Susu, Bensin Shell..."
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/40 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container transition"
                />
              </div>

              {/* Category Chips */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {expenseCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExpenseCategory(cat)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        expenseCategory === cat
                          ? 'bg-primary-fixed text-primary-container border-primary-container/30 font-semibold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant border-outline/20 hover:border-outline/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Selector */}
              {wallets.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Sumber Dompet
                  </label>
                  <div className="relative">
                    <select
                      value={expenseWalletId}
                      onChange={(e) => setExpenseWalletId(e.target.value)}
                      className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2.5 pr-9 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.card_label || w.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 min-h-[44px] bg-inverse-surface hover:bg-black text-white font-semibold py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
              >
                <span>Catat Pengeluaran</span>
                <CornerDownLeft className="w-4 h-4 opacity-80" />
              </button>
            </form>
          )}

          {/* TAB 2: QUICK TASK */}
          {activeTab === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Nama Task / To-Do
                </label>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  required
                  placeholder="cth. Review PR fersya-shop, Bayar internet..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/40 rounded-2xl px-4 py-2.5 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed/50 transition"
                />
              </div>

              {/* Priority Chips */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskPriority(1)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      taskPriority === 1
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline/20 hover:border-outline/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>P1 High</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskPriority(2)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      taskPriority === 2
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline/20 hover:border-outline/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>P2 Medium</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskPriority(3)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      taskPriority === 3
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline/20 hover:border-outline/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>P3 Low</span>
                  </button>
                </div>
              </div>

              {/* Daily Focus Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/20 cursor-pointer select-none hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={taskIsDailyFocus}
                  onChange={(e) => setTaskIsDailyFocus(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-container focus:ring-primary-fixed border-outline/50"
                />
                <div>
                  <span className="text-xs font-semibold text-on-surface block">
                    Jadikan Fokus Hari Ini ⭐
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Langsung tampil di sorotan Daily Focus dashboard
                  </span>
                </div>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 min-h-[44px] bg-inverse-surface hover:bg-black text-white font-semibold py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
              >
                <span>Tambahkan Task ke Inbox</span>
                <CornerDownLeft className="w-4 h-4 opacity-80" />
              </button>
            </form>
          )}

          {/* TAB 3: QUICK DROP */}
          {activeTab === 'drop' && (
            <form onSubmit={handleDropSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Konten Scratchpad / Link / Snippet
                </label>
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  required
                  rows={4}
                  placeholder="Paste link artikel, potongan kode curl, atau draft ide cepat..."
                  value={dropContent}
                  onChange={(e) => setDropContent(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/40 rounded-2xl p-3.5 text-xs text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed/50 transition resize-none font-mono"
                />
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  Otomatis mendeteksi tipe Link URL atau Code Snippet. Disimpan aman dengan auto-purge 24 jam.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 min-h-[44px] bg-inverse-surface hover:bg-black text-white font-semibold py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
              >
                <span>Simpan ke Dropzone</span>
                <CornerDownLeft className="w-4 h-4 opacity-80" />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

