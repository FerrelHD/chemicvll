import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, Subscription } from '@/types/database';

interface FinanceState {
  wallets: Wallet[];
  activeWalletId: string;
  transactions: Transaction[];
  subscriptions: Subscription[];
  setActiveWalletId: (id: string) => void;
  addWallet: (wallet: Omit<Wallet, 'id' | 'created_at'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addTransaction: (data: {
    wallet_id: string;
    to_wallet_id?: string | null;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    amount: number;
    note?: string | null;
  }) => void;
  addSubscription: (sub: Omit<Subscription, 'id' | 'created_at'>) => void;
  deleteSubscription: (id: string) => void;
}

const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w-bca',
    name: 'Bank BCA',
    type: 'bank',
    balance: 0,
    color: '#0066CC',
    card_label: 'Rekening Utama',
    account_number: '8492',
    holder_name: 'FERREL',
    expiry: '11/28',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      wallets: INITIAL_WALLETS,
      activeWalletId: 'w-bca',
      transactions: INITIAL_TRANSACTIONS,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      setActiveWalletId: (id) => set({ activeWalletId: id }),
      addWallet: (wallet) =>
        set((state) => {
          const newWallet: Wallet = {
            ...wallet,
            id: `w-${Date.now()}`,
            created_at: new Date().toISOString(),
          };
          return {
            wallets: [...state.wallets, newWallet],
            activeWalletId: state.wallets.length === 0 ? newWallet.id : state.activeWalletId,
          };
        }),
      updateWallet: (id, updates) =>
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      deleteWallet: (id) =>
        set((state) => {
          const filtered = state.wallets.filter((w) => w.id !== id);
          return {
            wallets: filtered,
            activeWalletId: state.activeWalletId === id ? (filtered[0]?.id || '') : state.activeWalletId,
          };
        }),
      addTransaction: ({ wallet_id, to_wallet_id, type, category, amount, note }) =>
        set((state) => {
          const newTx: Transaction = {
            id: `tx-${Date.now()}`,
            wallet_id,
            to_wallet_id: to_wallet_id || null,
            project_id: null,
            type,
            category,
            amount,
            note: note || null,
            transaction_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          // Update wallet balances optimistically
          const updatedWallets = state.wallets.map((w) => {
            if (type === 'income' && w.id === wallet_id) {
              return { ...w, balance: w.balance + amount };
            }
            if (type === 'expense' && w.id === wallet_id) {
              return { ...w, balance: w.balance - amount };
            }
            if (type === 'transfer') {
              if (w.id === wallet_id) return { ...w, balance: w.balance - amount };
              if (w.id === to_wallet_id) return { ...w, balance: w.balance + amount };
            }
            return w;
          });

          return {
            wallets: updatedWallets,
            transactions: [newTx, ...state.transactions],
          };
        }),
      addSubscription: (sub) =>
        set((state) => ({
          subscriptions: [
            {
              ...sub,
              id: `sub-${Date.now()}`,
              created_at: new Date().toISOString(),
            },
            ...state.subscriptions,
          ],
        })),
      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'chemicvll-finance-storage',
    }
  )
);

// Quick Command Bar expense listener
if (typeof window !== 'undefined') {
  window.addEventListener('quick-add-expense', ((e: CustomEvent) => {
    if (e.detail?.amount) {
      const store = useFinanceStore.getState();
      const targetWallet =
        store.wallets.find((w) =>
          w.name.toLowerCase().includes((e.detail.walletName || '').toLowerCase())
        ) || store.wallets[0];

      store.addTransaction({
        wallet_id: targetWallet ? targetWallet.id : 'w-bca',
        type: 'expense',
        category: 'Umum',
        amount: e.detail.amount,
        note: e.detail.note,
      });
    }
  }) as EventListener);
}

