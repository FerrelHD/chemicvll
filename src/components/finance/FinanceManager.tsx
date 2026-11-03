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
} from 'lucide-react';

export function FinanceManager() {
  const {
    wallets,
    transactions,
    subscriptions,
    addTransaction,
    addSubscription,
    deleteSubscription,
  } = useFinanceStore();

  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Quick transaction form state
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan & Minum');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'w-bca');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'w-gopay');
  const [note, setNote] = useState('');

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

  // Weekly capsule mock visualization
  const weeklyCapsules = [
    { label: 'Pekan 1', inVal: 45, outVal: 25, inRp: 'Rp 2.250.000', outRp: 'Rp 1.100.000' },
    { label: 'Pekan 2', inVal: 80, outVal: 40, inRp: 'Rp 4.500.000', outRp: 'Rp 1.200.000', active: true },
    { label: 'Pekan 3', inVal: 30, outVal: 55, inRp: 'Rp 1.000.000', outRp: 'Rp 820.000' },
    { label: 'Pekan 4', inVal: 60, outVal: 30, inRp: 'Rp 2.000.000', outRp: 'Rp 300.000' },
  ];

  return (
    <section className="space-y-6">
      
      {/* Top Bar: Overview Greeting & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Keuangan &amp; Arus Kas
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Kelola saldo rekening, alokasi tabungan, dan pantau cashflow bulanan Ferrel secara real-time.
          </p>
        </div>

        {/* Quick Toolbars Matching Reference */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3.5 py-1.5 rounded-full border border-outline/30 shadow-sm text-on-surface text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Nov 2026</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLoggingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Bento Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Saldo Utama */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Saldo Utama (Net)</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-on-surface tracking-tight font-sans">
              Rp {totalBalance.toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3 text-primary-container" />
                +18% pekan ini
              </span>
              <span className="text-[11px] text-on-surface-variant">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Total Tabungan */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Total Tabungan</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-on-surface tracking-tight font-sans">
              Rp 0
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
                Alokasi Kas
              </span>
              <span className="text-[11px] text-on-surface-variant">Siap diisi</span>
            </div>
          </div>
        </div>

        {/* Tile 3: Pemasukan Bulan Ini */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-on-surface tracking-tight font-sans">
              Rp {totalIncome.toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
                Total Arus Masuk
              </span>
              <span className="text-[11px] text-on-surface-variant">Aktif</span>
            </div>
          </div>
        </div>

        {/* Tile 4: Pengeluaran Bulan Ini */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-on-surface tracking-tight font-sans">
              Rp {totalExpense.toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
                Total Arus Keluar
              </span>
              <span className="text-[11px] text-on-surface-variant">Terkontrol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Middle Bento Cockpit (Wallet Card Stack + Bento Capsule Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Stacked Cards (4 Cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Rekening &amp; Kartu</h2>
              <p className="text-xs text-on-surface-variant">3 Akun Aktif Terhubung</p>
            </div>
            <button
              type="button"
              onClick={() => setIsLoggingOpen(true)}
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Stacked Cards Visual Representation */}
          <div className="relative flex flex-col pt-2">
            {/* Top Card: Bank Jago */}
            <div className="relative z-10 w-full rounded-2xl bg-[#a387f6] text-white p-4 shadow-sm transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm tracking-wider">JAGO</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/30 px-2 py-0.5 rounded-full">
                  Kantong Utama
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs opacity-90 font-mono">
                <span>•••• 8821</span>
                <span>12/28</span>
              </div>
            </div>

            {/* Middle Card: BCA Digital */}
            <div className="relative z-20 -mt-10 w-full rounded-2xl bg-[#e3e3de] text-on-surface p-4 shadow-sm border-t-2 border-white transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm tracking-wider">BCA BLU</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-full">
                  Payroll Magang
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-on-surface-variant font-mono">
                <span>•••• 4190</span>
                <span>09/27</span>
              </div>
            </div>

            {/* Front Active Card: Jenius Signature Orange */}
            <div className="relative z-30 -mt-10 w-full rounded-2xl bg-primary-container text-white p-5 shadow-lg border-t-2 border-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm tracking-widest uppercase">JENIUS m-Card</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                  Debit Card
                </span>
              </div>
              <div className="mt-4 mb-2">
                <span className="text-[11px] text-white/80 block">Saldo Aktif</span>
                <div className="text-2xl font-bold tracking-tight text-white font-sans">
                  Rp {(wallets.find((w) => w.id === 'w-jenius')?.balance || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-white/90 pt-1 font-mono">
                <span className="tracking-widest">•••• •••• •••• 9012</span>
                <span className="font-sans font-semibold">FERREL</span>
              </div>

              {/* Card Embedded Actions */}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setIsLoggingOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoggingOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white text-on-surface text-xs font-semibold hover:bg-zinc-100 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Top Up</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Switcher Indicator */}
          <div className="flex items-center justify-between pt-4 mt-2">
            <span className="text-[11px] text-on-surface-variant font-medium">Default untuk Quick-Transfer</span>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-surface-container-high" />
              <span className="w-2 h-2 rounded-full bg-surface-container-high" />
              <span className="w-5 h-2 rounded-full bg-primary-container" />
            </div>
          </div>
        </div>

        {/* Right Column: Bento Capsule Cashflow Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Total Arus Kas Keluar</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                <span className="text-xs text-on-surface-variant">November 2026</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight mt-0.5">
                Rp 3.420.000<span className="text-xs text-on-surface-variant font-normal"> / bln</span>
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
                  Mingguan
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
                  Bulanan
                </button>
              </div>
            </div>
          </div>

          {/* Bento Capsule Chart Visualization */}
          <div className="relative w-full pt-10 pb-4">
            {/* Floating Interactive Tooltip */}
            <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-20 bg-inverse-surface text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70">Pekan 2 (8-14 Nov)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#a387f6]" />
                  <span className="font-semibold">Masuk: Rp 4.500.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  <span className="font-semibold">Keluar: Rp 1.200.000</span>
                </div>
              </div>
              <div className="border-l border-white/20 pl-3">
                <span className="font-bold text-primary-fixed">Net +Rp 3,3jt</span>
              </div>
            </div>

            {/* Vertical Rounded Capsule Bars */}
            <div className="grid grid-cols-4 gap-6 items-end h-56 px-4">
              {weeklyCapsules.map((cap) => (
                <div key={cap.label} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-12 sm:w-16 bg-surface-container-low rounded-full p-1.5 flex flex-col justify-end gap-1.5 h-44 shadow-inner relative">
                    {/* Income capsule (Purple) */}
                    <div
                      className="w-full bg-[#a387f6] rounded-full transition-all duration-500 group-hover:opacity-90"
                      style={{ height: `${cap.inVal}%` }}
                    />
                    {/* Expense capsule (Orange) */}
                    <div
                      className="w-full bg-primary-container rounded-full transition-all duration-500 group-hover:scale-105"
                      style={{ height: `${cap.outVal}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface">
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-outline/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a387f6]" />
                <span className="text-on-surface-variant font-medium">Pemasukan (Cash In)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                <span className="text-on-surface-variant font-medium">Pengeluaran (Cash Out)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Riwayat Mutasi & Radar Tagihan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Riwayat Mutasi Terkini */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Mutasi Terkini</h3>
            <span className="text-xs text-on-surface-variant font-medium">
              {transactions.length} Transaksi
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
                  <span className="text-[10px] text-on-surface-variant font-mono uppercase">
                    {tx.wallet_id.replace('w-', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Langganan & Dana Darurat */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Radar Langganan</h3>
              <p className="text-xs text-on-surface-variant">Peringatan otomatis H-3 sebelum auto-debit</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
              {subscriptions.length} Layanan
            </span>
          </div>

          <div className="space-y-3">
            {subscriptions.map((sub) => {
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
                        Siklus: {sub.billing_cycle}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="font-bold text-on-surface block">
                        Rp {sub.cost.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {isUrgent ? `H-${diffDays} tagihan` : `${diffDays} hari lagi`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSubscription(sub.id)}
                      className="text-on-surface-variant hover:text-error p-1 transition"
                      title="Hapus langganan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Quick Transaction */}
      {isLoggingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <h3 className="font-bold text-base text-on-surface">Catat Transaksi Cepat</h3>
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
                    {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Jumlah (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Misal: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Sumber Rekening</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {txType === 'transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Rekening Tujuan</label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                  >
                    {wallets
                      .filter((w) => w.id !== walletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan transaksi..."
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
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
