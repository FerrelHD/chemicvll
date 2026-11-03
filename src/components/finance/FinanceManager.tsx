'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, AlertCircle, Plus, Calendar } from 'lucide-react';

export function FinanceManager() {
  const { wallets, transactions, subscriptions, addTransaction, addSubscription, deleteSubscription } =
    useFinanceStore();

  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan & Minum');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'w-bca');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'w-gopay');
  const [note, setNote] = useState('');

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

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
  };

  // Check H-3 subscription alert
  const getSubAlert = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3 && diffDays >= 0) {
      return { isDueSoon: true, label: `Perpanjangan H-${diffDays}` };
    }
    return { isDueSoon: false, label: `${diffDays} hari lagi` };
  };

  return (
    <section className="space-y-6">
      
      {/* Header & Total Net Worth */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
            Keuangan & Radar Langganan
          </h2>
          <p className="text-xs text-appleText-secondary mt-0.5">
            Multi-wallet, pencatatan transaksi kilat &lt; 5 detik, dan radar tagihan berulang.
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-appleBorder shadow-apple">
          <span className="text-[11px] font-mono text-appleText-muted uppercase block">
            Total Saldo Bersih
          </span>
          <span className="text-lg font-bold text-appleText-primary font-mono block">
            Rp {totalBalance.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {wallets.map((w) => (
          <div key={w.id} className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-appleText-primary">{w.name}</span>
              <span className="text-[10px] font-mono uppercase text-appleText-muted">{w.type}</span>
            </div>
            <div className="text-base font-bold font-mono text-appleText-primary">
              Rp {w.balance.toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Quick Transaction & Subscription Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Quick Transaction Logging */}
        <div className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-appleText-primary font-mono">
              Catat Transaksi Cepat
            </h3>
            {/* Type selector */}
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`px-2.5 py-0.5 rounded font-medium transition ${
                  txType === 'expense' ? 'bg-red-50 text-red-700 font-bold' : 'text-appleText-muted'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`px-2.5 py-0.5 rounded font-medium transition ${
                  txType === 'income' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-appleText-muted'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={`px-2.5 py-0.5 rounded font-medium transition ${
                  txType === 'transfer' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-appleText-muted'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          <form onSubmit={handleRecord} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-appleText-secondary mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="35000"
                  className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-appleText-secondary mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Makan, Transport, dll"
                  className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-appleText-secondary mb-1">
                  {txType === 'transfer' ? 'Dari Dompet' : 'Dompet'}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {txType === 'transfer' ? (
                <div>
                  <label className="block text-appleText-secondary mb-1">Ke Dompet</label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-appleText-secondary mb-1">Catatan</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Makan siang & kopi"
                    className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition shadow-sm active:scale-95"
            >
              Simpan Transaksi
            </button>
          </form>
        </div>

        {/* Subscription Radar (H-3 Warning Badges) */}
        <div className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-appleText-primary font-mono">
              Radar Langganan (Subscription)
            </h3>
            <span className="text-[11px] text-appleText-muted">Peringatan H-3</span>
          </div>

          <div className="space-y-2.5">
            {subscriptions.map((sub) => {
              const alert = getSubAlert(sub.next_billing_date);

              return (
                <div
                  key={sub.id}
                  className={`p-3 rounded-lg border space-y-1 transition ${
                    alert.isDueSoon
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-appleBorder bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-appleText-primary">{sub.name}</span>
                    <span className="font-mono text-appleText-primary font-bold">
                      Rp {sub.cost.toLocaleString('id-ID')} / {sub.billing_cycle === 'monthly' ? 'bln' : 'thn'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-appleText-secondary flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      Tagihan: {sub.next_billing_date}
                    </span>
                    <span
                      className={`font-mono font-medium ${
                        alert.isDueSoon ? 'text-amber-700 font-bold' : 'text-appleText-muted'
                      }`}
                    >
                      {alert.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </section>
  );
}

