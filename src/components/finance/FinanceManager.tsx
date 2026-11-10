'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Calendar,
  Plus,
  Send,
  Download,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';

export function FinanceManager() {
  const {
    wallets,
    activeWalletId,
    setActiveWalletId,
    addWallet,
    updateWallet,
    deleteWallet,
    transactions,
    subscriptions,
    isPrivacyMode,
    togglePrivacyMode,
    addTransaction,
    addSubscription,
    deleteSubscription,
  } = useFinanceStore();

  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [walletForm, setWalletForm] = useState({
    name: '',
    type: 'bank' as const,
    card_label: 'Rekening Utama',
    account_number: '',
    holder_name: 'FERREL',
    expiry: '11/28',
    balance: 0,
    color: '#0066CC',
  });

  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Quick transaction form state
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan & Minum');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'w-bca');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'w-gopay');
  const [note, setNote] = useState('');

  // Subscription form state
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState('');
  const [subCycle, setSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subDate, setSubDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [subWalletId, setSubWalletId] = useState(wallets[0]?.id || 'w-bca');

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subCost) return;
    addSubscription({
      name: subName.trim(),
      cost: parseFloat(subCost),
      billing_cycle: subCycle,
      next_billing_date: subDate,
      wallet_id: subWalletId || null,
      is_active: true,
    });
    setSubName('');
    setSubCost('');
    setIsAddSubOpen(false);
  };

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  // Calculate monthly stats from transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    addTransaction({
      wallet_id: walletId,
      to_wallet_id: txType === 'transfer' ? toWalletId : null,
      type: txType,
      category,
      amount: num,
      note,
    });

    setAmount('');
    setNote('');
    setIsLoggingOpen(false);
  };

  const handleOpenAddWallet = () => {
    setEditingWallet(null);
    setWalletForm({
      name: '',
      type: 'bank',
      card_label: 'Rekening Utama',
      account_number: '',
      holder_name: 'FERREL',
      expiry: '11/28',
      balance: 0,
      color: '#0066CC',
    });
    setIsWalletModalOpen(true);
  };

  const handleOpenEditWallet = (w: any) => {
    setEditingWallet(w);
    setWalletForm({
      name: w.name,
      type: w.type,
      card_label: w.card_label || 'Rekening Utama',
      account_number: w.account_number || '',
      holder_name: w.holder_name || 'FERREL',
      expiry: w.expiry || '11/28',
      balance: w.balance,
      color: w.color || '#0066CC',
    });
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletForm.name.trim()) return;

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        name: walletForm.name,
        type: walletForm.type as any,
        card_label: walletForm.card_label,
        account_number: walletForm.account_number,
        holder_name: walletForm.holder_name,
        expiry: walletForm.expiry,
        balance: Number(walletForm.balance) || 0,
        color: walletForm.color,
      });
    } else {
      addWallet({
        name: walletForm.name,
        type: walletForm.type as any,
        card_label: walletForm.card_label,
        account_number: walletForm.account_number,
        holder_name: walletForm.holder_name,
        expiry: walletForm.expiry,
        balance: Number(walletForm.balance) || 0,
        color: walletForm.color,
      });
    }
    setIsWalletModalOpen(false);
  };

  const handleDeleteWallet = () => {
    if (editingWallet && wallets.length > 1) {
      deleteWallet(editingWallet.id);
      setIsWalletModalOpen(false);
    }
  };

  // Active wallet and stack arrangement
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0];
  const backgroundWallets = wallets.filter((w) => w.id !== activeWallet?.id);

  // Dynamic weekly capsules from actual transactions
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const weeklyCapsules = [1, 2, 3, 4].map((weekNum) => {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = weekNum === 4 ? 31 : weekNum * 7;
    const txInWeek = currentMonthTransactions.filter((t) => {
      const day = new Date(t.transaction_date).getDate();
      return day >= startDay && day <= endDay;
    });

    const inc = txInWeek.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = txInWeek.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const maxVal = Math.max(inc, exp, 1);

    return {
      label: `Week ${weekNum}`,
      inVal: inc > 0 ? Math.max(10, Math.round((inc / maxVal) * 100)) : 0,
      outVal: exp > 0 ? Math.max(10, Math.round((exp / maxVal) * 100)) : 0,
      inRp: `Rp ${inc.toLocaleString('id-ID')}`,
      outRp: `Rp ${exp.toLocaleString('id-ID')}`,
    };
  });

  return (
    <section className="space-y-6">
      
      {/* Top Bar: Overview Greeting & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Financial Vault &amp; Cashflow
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Track bank accounts, savings allocations, and real-time monthly cashflow.
          </p>
        </div>

        {/* Quick Toolbars Matching Reference */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-outline/30 shadow-sm text-on-surface text-xs font-medium whitespace-nowrap shrink-0">
            <Calendar className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
            <span>Nov 2026</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLoggingOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Bento Tiles (Compact 2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Tile 1: Saldo Utama */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 min-h-[115px] sm:min-h-[130px] flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">Net Balance</span>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col gap-1 sm:gap-1.5">
            <span className="text-base sm:text-2xl font-bold text-on-surface tracking-tight font-sans truncate">
              {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalBalance.toLocaleString('id-ID')}`}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {transactions.length === 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
                    0%
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0">No activity</span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
                    <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                    {totalIncome >= totalExpense ? '+' : '-'}
                    {totalExpense > 0
                      ? Math.round((Math.abs(totalIncome - totalExpense) / totalExpense) * 100)
                      : 100}% net
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0 hidden sm:inline">Active</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tile 2: Total Tabungan */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 min-h-[115px] sm:min-h-[130px] flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">Total Savings</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface shrink-0">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col gap-1 sm:gap-1.5">
            <span className="text-base sm:text-2xl font-bold text-on-surface tracking-tight font-sans truncate">
              {isPrivacyMode ? 'Rp •••••••' : 'Rp 0'}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
                Cash Allocation
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0">Ready</span>
            </div>
          </div>
        </div>

        {/* Tile 3: Pemasukan Bulan Ini */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 min-h-[115px] sm:min-h-[130px] flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">Monthly Income</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col gap-1 sm:gap-1.5">
            <span className="text-base sm:text-2xl font-bold text-on-surface tracking-tight font-sans truncate">
              Rp {totalIncome.toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
                Total Inflow
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0">Active</span>
            </div>
          </div>
        </div>

        {/* Tile 4: Pengeluaran Bulan Ini */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 min-h-[115px] sm:min-h-[130px] flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">Monthly Expenses</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col gap-1 sm:gap-1.5">
            <span className="text-base sm:text-2xl font-bold text-on-surface tracking-tight font-sans truncate">
              Rp {totalExpense.toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
                Total Outflow
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0">Controlled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Middle Bento Cockpit (Wallet Card Stack + Bento Capsule Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Stacked Cards (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Rekening &amp; Kartu</h2>
              <p className="text-xs text-on-surface-variant">
                {wallets.length} Akun Aktif Terhubung
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddWallet}
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition"
              title="Add New Account / Card"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Stacked Cards Visual Representation */}
          <div className="relative flex flex-col pt-2 min-h-[280px] justify-end">
            {/* Background Cards (Up to 2) */}
            {backgroundWallets.slice(0, 2).map((bw, idx) => {
              const isBack2 = idx === 1;
              return (
                <div
                  key={bw.id}
                  onClick={() => setActiveWalletId(bw.id)}
                  style={{
                    backgroundColor: bw.color || (isBack2 ? '#7C3AED' : '#52525B'),
                  }}
                  className={`cursor-pointer rounded-2xl text-white p-4 shadow-sm transition-all hover:-translate-y-1.5 ${
                    isBack2
                      ? 'relative z-10 w-full opacity-80'
                      : 'relative z-20 -mt-10 w-full border-t-2 border-white/40'
                  }`}
                  title="Klik untuk jadikan kartu aktif"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs tracking-wider uppercase truncate max-w-[180px]">
                      {bw.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      {bw.card_label || 'REKENING'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs opacity-90 font-mono">
                    <span>•••• {bw.account_number || '8492'}</span>
                    <span>{isPrivacyMode ? 'Rp •••••••' : `Rp ${bw.balance.toLocaleString('id-ID')}`}</span>
                  </div>
                </div>
              );
            })}

            {/* Front Active Card */}
            {activeWallet && (
              <div
                className={`relative z-30 w-full rounded-2xl text-white p-5 shadow-lg ${
                  backgroundWallets.length > 0 ? '-mt-10 border-t-2 border-white' : ''
                }`}
                style={{
                  background: activeWallet.color
                    ? `linear-gradient(135deg, ${activeWallet.color}, #18181B)`
                    : 'linear-gradient(135deg, #0066CC, #003E8A)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-widest uppercase truncate max-w-[220px]">
                    {activeWallet.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full">
                      {activeWallet.card_label || 'DEBIT CARD'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditWallet(activeWallet)}
                      className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition ml-1"
                      title="Edit Rekening / Kartu Ini"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-white/80 block">Saldo Aktif</span>
                    <div className="text-2xl font-bold tracking-tight text-white font-sans">
                      {isPrivacyMode ? 'Rp •••••••' : `Rp ${activeWallet.balance.toLocaleString('id-ID')}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={togglePrivacyMode}
                    className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
                    title={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                  >
                    {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-white/90 pt-1 font-mono">
                  <span className="tracking-widest">•••• •••• •••• {activeWallet.account_number || '8492'}</span>
                  <span className="font-sans font-semibold">{activeWallet.holder_name || 'FERREL'}</span>
                </div>

                {/* Card Embedded Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletId(activeWallet.id);
                      setTxType('transfer');
                      setIsLoggingOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletId(activeWallet.id);
                      setTxType('income');
                      setIsLoggingOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white text-on-surface text-xs font-semibold hover:bg-zinc-100 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Top Up</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Switcher Indicator */}
          <div className="flex items-center justify-between pt-4 mt-2">
            <span className="text-[11px] text-on-surface-variant font-medium">Default for Quick-Transfer</span>
            <div className="flex items-center gap-1.5">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWalletId(w.id)}
                  className={`h-2 rounded-full transition-all ${
                    w.id === activeWallet?.id
                      ? 'w-5 bg-primary-container'
                      : 'w-2 bg-surface-container-high hover:bg-zinc-400'
                  }`}
                  title={w.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Bento Capsule Cashflow Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Total Cash Outflow</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                <span className="text-xs text-on-surface-variant">Current Month</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight mt-0.5">
                Rp {totalExpense.toLocaleString('id-ID')}<span className="text-xs text-on-surface-variant font-normal"> / mo</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface-container-low p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setChartMode('weekly')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    chartMode === 'weekly'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('monthly')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    chartMode === 'monthly'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>

          {/* Bento Capsule Chart Visualization */}
          <div className="relative w-full pt-4 pb-4">
            {transactions.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center p-6 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline/40 text-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <BarChart3 className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-on-surface">No transaction history yet</p>
                  <p className="text-xs text-on-surface-variant max-w-sm">
                    Weekly and monthly cashflow will automatically calculate as you record income or expense transactions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoggingOpen(true)}
                  className="mt-1 px-4 py-1.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition"
                >
                  Record First Transaction
                </button>
              </div>
            ) : (
              <>
                {/* Vertical Rounded Capsule Bars */}
                <div className="grid grid-cols-4 gap-3 sm:gap-8 items-end h-56 px-2 sm:px-6">
                  {weeklyCapsules.map((cap) => (
                    <div key={cap.label} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-8 sm:w-10 bg-surface-container-low rounded-full p-1 sm:p-1.5 flex flex-col justify-end gap-1 sm:gap-1.5 h-44 shadow-inner relative">
                        {/* Income capsule (Purple) */}
                        <div
                          className="w-full bg-[#a387f6] rounded-full transition-all duration-500 group-hover:opacity-90"
                          style={{ height: `${cap.inVal}%` }}
                          title={`In: ${cap.inRp}`}
                        />
                        {/* Expense capsule (Orange) */}
                        <div
                          className="w-full bg-primary-container rounded-full transition-all duration-500 group-hover:scale-105"
                          style={{ height: `${cap.outVal}%` }}
                          title={`Out: ${cap.outRp}`}
                        />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-on-surface-variant group-hover:text-on-surface tracking-tight mt-0.5">
                        {cap.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-4 pt-2.5 border-t border-outline/20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a387f6]" />
                    <span className="text-on-surface-variant font-medium">Income (Cash In)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    <span className="text-on-surface-variant font-medium">Expenses (Cash Out)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Riwayat Mutasi & Radar Tagihan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Riwayat Mutasi Terkini */}
        <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">Recent Transactions</h3>
            <span className="text-xs text-on-surface-variant font-medium shrink-0 whitespace-nowrap">
              {transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>

          <div className="divide-y divide-outline/20">
            {transactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : tx.type === 'expense'
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'expense' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface block">{tx.category}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {tx.note || new Date(tx.transaction_date || Date.now()).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold block ${
                      tx.type === 'income'
                        ? 'text-emerald-600'
                        : tx.type === 'expense'
                        ? 'text-on-surface'
                        : 'text-zinc-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase truncate max-w-[120px] block">
                    {wallets.find((w) => w.id === tx.wallet_id)?.name || tx.wallet_id.replace('w-', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Langganan & Dana Darurat */}
        <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-on-surface">Subscription Radar</h3>
              <p className="text-xs text-on-surface-variant">Auto-alert 3 days before scheduled debit</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant whitespace-nowrap shrink-0">
                {subscriptions.length} {subscriptions.length === 1 ? 'Service' : 'Services'}
              </span>
              <button
                type="button"
                onClick={() => setIsAddSubOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-surface-container-low border border-dashed border-outline/30 space-y-2">
                <p className="text-xs text-on-surface-variant">No active subscriptions tracked yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-xs font-semibold text-on-surface transition"
                >
                  <Plus className="w-3.5 h-3.5 text-primary-container" />
                  <span>Track First Subscription</span>
                </button>
              </div>
            ) : (
              subscriptions.map((sub) => {
                const diffDays = Math.ceil(
                  (new Date(sub.next_billing_date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isUrgent = diffDays <= 3 && diffDays >= 0;

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface">
                        {sub.name[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface block">{sub.name}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          Cycle: {sub.billing_cycle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="font-bold text-on-surface block">
                          Rp {sub.cost.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {diffDays <= 0 ? 'Due today' : `Due in ${diffDays} days`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteSubscription(sub.id)}
                        className="text-on-surface-variant hover:text-error p-1 transition"
                        title="Delete subscription"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Quick Transaction */}
      {isLoggingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <h3 className="font-bold text-base text-on-surface">Record Transaction</h3>
              <button
                type="button"
                onClick={() => setIsLoggingOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecord} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-surface-container-high rounded-full">
                {(['expense', 'income', 'transfer'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                      txType === t
                        ? 'bg-inverse-surface text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t === 'expense' ? 'Expense' : t === 'income' ? 'Income' : 'Transfer'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Amount (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Source Account</label>
                <div className="relative">
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {isPrivacyMode ? '' : `(Rp ${w.balance.toLocaleString('id-ID')})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {txType === 'transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Destination Account</label>
                  <div className="relative">
                    <select
                      value={toWalletId}
                      onChange={(e) => setToWalletId(e.target.value)}
                      className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                    >
                      {wallets
                        .filter((w) => w.id !== walletId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Note</label>
                <input
                  type="text"
                  placeholder="Transaction description..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/20">
                <button
                  type="button"
                  onClick={() => setIsLoggingOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kelola Rekening & Kartu (Add / Edit) */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-outline/20">
              <h3 className="font-bold text-sm text-on-surface">
                {editingWallet ? 'Edit Account / Card' : 'Add New Account / Card'}
              </h3>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Bank / Wallet Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank BCA, Jenius, Bank Jago"
                  value={walletForm.name}
                  onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Account Type
                  </label>
                  <div className="relative">
                    <select
                      value={walletForm.type}
                      onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value as any })}
                      className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                    >
                      <option value="bank">Bank</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="cash">Cash</option>
                      <option value="investment">Investment</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Card Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Pocket"
                    value={walletForm.card_label}
                    onChange={(e) => setWalletForm({ ...walletForm, card_label: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="8492"
                    value={walletForm.account_number}
                    onChange={(e) => setWalletForm({ ...walletForm, account_number: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Holder Name
                  </label>
                  <input
                    type="text"
                    value={walletForm.holder_name}
                    onChange={(e) => setWalletForm({ ...walletForm, holder_name: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="11/28"
                    value={walletForm.expiry}
                    onChange={(e) => setWalletForm({ ...walletForm, expiry: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Account Balance (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={walletForm.balance}
                  onChange={(e) => setWalletForm({ ...walletForm, balance: Number(e.target.value) || 0 })}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Card Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#0066CC', name: 'BCA Blue' },
                    { color: '#FF6B00', name: 'Jenius Orange' },
                    { color: '#7C3AED', name: 'Jago Purple' },
                    { color: '#059669', name: 'Emerald' },
                    { color: '#18181B', name: 'Carbon Dark' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setWalletForm({ ...walletForm, color: c.color })}
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        walletForm.color === c.color ? 'scale-110 border-black shadow-sm' : 'border-transparent hover:scale-105'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline/20">
                {editingWallet && wallets.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleDeleteWallet}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
                  >
                    {editingWallet ? 'Save Changes' : 'Add Account'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Subscription */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/30 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <h3 className="font-bold text-sm text-on-surface">Add Active Subscription</h3>
              <button
                type="button"
                onClick={() => setIsAddSubOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Spotify, ChatGPT Plus, iCloud"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Cost (IDR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 54000"
                    value={subCost}
                    onChange={(e) => setSubCost(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Billing Cycle
                  </label>
                  <div className="relative">
                    <select
                      value={subCycle}
                      onChange={(e) => setSubCycle(e.target.value as 'monthly' | 'yearly')}
                      className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Next Debit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Charged Account
                  </label>
                  <div className="relative">
                    <select
                      value={subWalletId}
                      onChange={(e) => setSubWalletId(e.target.value)}
                      className="w-full appearance-none bg-surface-container-low hover:bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface transition-all cursor-pointer outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline/20">
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
                >
                  Add Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
