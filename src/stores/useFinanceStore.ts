import { create } from 'zustand';
import { Wallet, Transaction, Subscription } from '@/types/database';

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
  subscriptions: Subscription[];
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
  { id: 'w-bca', name: 'Bank BCA', type: 'bank', balance: 14500000, color: '#0066CC' },
  { id: 'w-gopay', name: 'GoPay', type: 'ewallet', balance: 650000, color: '#00AA13' },
  { id: 'w-cash', name: 'Cash', type: 'cash', balance: 250000, color: '#5856D6' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    wallet_id: 'w-bca',
    to_wallet_id: null,
    project_id: null,
    type: 'income',
    category: 'Gaji / Stipend',
    amount: 5000000,
    note: 'Stipend Magang Oktober',
    transaction_date: '2026-10-31T00:00:00Z',
  },
  {
    id: 'tx-2',
    wallet_id: 'w-gopay',
    to_wallet_id: null,
    project_id: null,
    type: 'expense',
    category: 'Makan & Minum',
    amount: 35000,
    note: 'Kopi & Makan Siang',
    transaction_date: '2026-11-02T12:00:00Z',
  },
];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-github',
    wallet_id: 'w-bca',
    name: 'GitHub Copilot / Pro',
    cost: 160000,
    billing_cycle: 'monthly',
    next_billing_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // H-2 (Alert!)
    is_active: true,
  },
  {
    id: 'sub-chatgpt',
    wallet_id: 'w-bca',
    name: 'ChatGPT Plus',
    cost: 320000,
    billing_cycle: 'monthly',
    next_billing_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    is_active: true,
  },
];

export const useFinanceStore = create<FinanceState>((set) => ({
  wallets: INITIAL_WALLETS,
  transactions: INITIAL_TRANSACTIONS,
  subscriptions: INITIAL_SUBSCRIPTIONS,
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
}));

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

