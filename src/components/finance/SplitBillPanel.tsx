'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils';
import { Users, Plus, Check, MessageSquare, Trash2, X, Clock, ExternalLink } from 'lucide-react';

export function SplitBillPanel() {
  const { debts, wallets, activeWalletId, addDebt, settleDebt, deleteDebt, isPrivacyMode } =
    useFinanceStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [targetWalletId, setTargetWalletId] = useState(activeWalletId || wallets[0]?.id || 'w-bca');
  const [showSettled, setShowSettled] = useState(false);

  const activeWallet = wallets.find((w) => w.id === targetWalletId) || wallets[0];

  const pendingDebts = debts.filter((d) => !d.is_settled);
  const settledDebts = debts.filter((d) => d.is_settled);
  const displayedDebts = showSettled ? settledDebts : pendingDebts;

  const totalPendingAmount = pendingDebts.reduce((sum, d) => sum + d.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseRupiahInput(amountInput);
    if (!personName.trim() || cleanAmount <= 0) return;

    addDebt({
      user_id: 'ferrel',
      person_name: personName.trim(),
      amount: cleanAmount,
      description: description.trim() || 'Makan / Jajan Bareng',
      due_date: null,
      is_settled: false,
      target_wallet_id: targetWalletId,
    });

    setPersonName('');
    setAmountInput('');
    setDescription('');
    setIsAddOpen(false);
  };

  const handleOpenWhatsApp = (debt: (typeof debts)[0]) => {
    const w = wallets.find((item) => item.id === debt.target_wallet_id) || activeWallet;
    const paymentInfo = w
      ? `${w.name}${w.account_number ? ` (${w.account_number}) a.n. ${w.holder_name || 'FERREL'}` : ''}`
      : 'rekening biasanya';

    const text = `Halo ${debt.person_name}, mau ngingetin untuk talangan ${debt.description} sebesar Rp ${debt.amount.toLocaleString('id-ID')}. Nanti bisa transfer ke ${paymentInfo} yaa. Thank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container shrink-0">
            <Users className="w-4 h-4 text-primary-container" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Split Bill &amp; Talangan Teman</h3>
            <p className="text-xs text-on-surface-variant">
              Catat uang ditalangi &amp; reminder tagihan WhatsApp otomatis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
              Total Piutang
            </span>
            <span className="text-sm sm:text-base font-bold font-sans tabular-nums text-primary-container">
              {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalPendingAmount.toLocaleString('id-ID')}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white text-xs font-semibold shadow-xs transition active:scale-95 ml-2"
          >
            {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAddOpen ? 'Batal' : 'Catat Talangan'}</span>
          </button>
        </div>
      </div>

      {/* Inline Form */}
      {isAddOpen && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-2xl bg-surface-container-low border border-outline/40 space-y-3 animate-in fade-in"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Nama Teman *
              </label>
              <input
                type="text"
                required
                placeholder="cth. Budi, Sarah, Dimas..."
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/40 rounded-xl px-3 py-2 text-base sm:text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Nominal Ditalangi (Rp) *
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="cth. 45.000"
                value={amountInput}
                onChange={(e) => setAmountInput(formatRupiahInput(e.target.value))}
                className="w-full bg-surface-container-lowest border border-outline/40 rounded-xl px-3 py-2 text-base sm:text-xs tabular-nums font-bold text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Keterangan
              </label>
              <input
                type="text"
                placeholder="cth. Makan Nasi Padang, Spotify Family..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/40 rounded-xl px-3 py-2 text-base sm:text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Rekening Tujuan Pelunasan
              </label>
              <select
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/40 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-on-surface focus:outline-none focus:border-primary-container"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.account_number ? `(${w.account_number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-primary-container text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              Simpan Talangan
            </button>
          </div>
        </form>
      )}

      {/* Tabs Filter: Belum Lunas vs Riwayat */}
      <div className="flex items-center justify-between border-b border-outline/20 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowSettled(false)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
              !showSettled
                ? 'bg-inverse-surface dark:bg-primary-container text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Belum Lunas ({pendingDebts.length})
          </button>
          <button
            type="button"
            onClick={() => setShowSettled(true)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
              showSettled
                ? 'bg-inverse-surface dark:bg-primary-container text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Riwayat Selesai ({settledDebts.length})
          </button>
        </div>
      </div>

      {/* Debts List */}
      {displayedDebts.length === 0 ? (
        <div className="py-6 text-center text-xs text-on-surface-variant">
          {showSettled
            ? 'Belum ada riwayat talangan yang sudah selesai.'
            : 'Tidak ada talangan aktif. Semua uang aman terbayar!'}
        </div>
      ) : (
        <div className="divide-y divide-outline/20">
          {displayedDebts.map((debt) => (
            <div
              key={debt.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                    {debt.person_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      debt.is_settled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                    }`}
                  >
                    {debt.is_settled ? 'Lunas' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate">{debt.description}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs sm:text-sm font-bold font-sans tabular-nums text-on-surface">
                  {isPrivacyMode ? 'Rp •••••••' : `Rp ${debt.amount.toLocaleString('id-ID')}`}
                </span>

                <div className="flex items-center gap-1.5">
                  {!debt.is_settled && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(debt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition active:scale-95 shadow-xs"
                        title="Kirim pesan penagihan sopan ke WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WA Reminder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => settleDebt(debt.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white text-[11px] font-semibold transition active:scale-95 shadow-xs"
                        title="Tandai sudah lunas & catat pemasukan"
                      >
                        <Check className="w-3 h-3" />
                        <span>Lunaskan</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus catatan talangan ${debt.person_name}?`)) {
                        deleteDebt(debt.id);
                      }
                    }}
                    className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
