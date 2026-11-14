import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Wallet,
  Transaction,
  Subscription,
  BudgetSplitRule,
  FixedAllocation,
  MonthlyBudgetPlan,
} from '@/types/database';
import { deleteFromCloud } from '@/lib/supabase-delete';
import {
  computePaydayCycle,
  getReversibleCycleTransactionIds,
  isFixedPaymentCategory,
  parseFixedPaymentCategory,
} from '@/lib/budget-utils';

function syncFinanceChangesNow(): void {
  if (typeof window === 'undefined') return;
  void import('@/lib/supabase-sync').then(({ pushAllToCloud }) => pushAllToCloud());
}

export const DEFAULT_BUDGET_RULES: BudgetSplitRule[] = [
  {
    id: 'rule-needs',
    name: 'Kebutuhan & Makan',
    percentage: 45,
    categories: ['Makan & Minum', 'Transportasi', 'Tagihan'],
    color: '#FF6B00',
  },
  {
    id: 'rule-savings',
    name: 'Tabungan & Investasi',
    percentage: 30,
    categories: ['Tabungan', 'Investasi'],
    color: '#10B981',
    isSavings: true,
  },
  {
    id: 'rule-lifestyle',
    name: 'Lifestyle & Tech',
    percentage: 15,
    categories: ['Belanja', 'Dev / Tech'],
    color: '#7C3AED',
  },
  {
    id: 'rule-reserve',
    name: 'Dana Cadangan',
    percentage: 10,
    categories: ['Lainnya', 'Umum'],
    color: '#3B82F6',
  },
];

export interface SaveBudgetPlanInput {
  salaryAmount: number;
  cycleStartDate: string;
  fixedItems: FixedAllocation[];
  rules: BudgetSplitRule[];
  logIncomeToWalletId?: string | null;
}

interface FinanceState {
  wallets: Wallet[];
  activeWalletId: string;
  transactions: Transaction[];
  subscriptions: Subscription[];
  budgetPlan: MonthlyBudgetPlan | null;
  budgetRules: BudgetSplitRule[];
  budgetHistory: MonthlyBudgetPlan[];
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (val: boolean) => void;
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
  deleteTransaction: (id: string) => void;
  addSubscription: (sub: Omit<Subscription, 'id' | 'created_at'>) => void;
  deleteSubscription: (id: string) => void;
  saveBudgetPlan: (input: SaveBudgetPlanInput) => void;
  updateBudgetRules: (rules: BudgetSplitRule[]) => void;
  toggleFixedItemPaid: (fixedId: string, deductWalletId?: string | null) => void;
  resetBudgetPlan: (options?: { revertTransactions?: boolean }) => void;
}

function applyBalanceDelta(
  wallets: Wallet[],
  walletId: string,
  toWalletId: string | null,
  type: 'income' | 'expense' | 'transfer',
  amount: number
): Wallet[] {
  return wallets.map((w) => {
    if (type === 'income' && w.id === walletId) {
      return { ...w, balance: w.balance + amount };
    }
    if (type === 'expense' && w.id === walletId) {
      return { ...w, balance: w.balance - amount };
    }
    if (type === 'transfer') {
      if (w.id === walletId) return { ...w, balance: w.balance - amount };
      if (w.id === toWalletId) return { ...w, balance: w.balance + amount };
    }
    return w;
  });
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
    (set, get) => ({
      wallets: INITIAL_WALLETS,
      activeWalletId: 'w-bca',
      transactions: INITIAL_TRANSACTIONS,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      budgetPlan: null,
      budgetRules: DEFAULT_BUDGET_RULES,
      budgetHistory: [],
      isPrivacyMode: true,
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
      setPrivacyMode: (val) => set({ isPrivacyMode: val }),
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
      deleteWallet: (id) => {
        set((state) => {
          const filtered = state.wallets.filter((w) => w.id !== id);
          return {
            wallets: filtered,
            transactions: state.transactions
              .filter((tx) => tx.wallet_id !== id)
              .map((tx) => (tx.to_wallet_id === id ? { ...tx, to_wallet_id: null } : tx)),
            subscriptions: state.subscriptions.map((s) =>
              s.wallet_id === id ? { ...s, wallet_id: null } : s
            ),
            activeWalletId: state.activeWalletId === id ? (filtered[0]?.id || '') : state.activeWalletId,
          };
        });
        deleteFromCloud('wallets', id);
      },
      addTransaction: ({ wallet_id, to_wallet_id, type, category, amount, note }) =>
        set((state) => {
          const nowIso = new Date().toISOString();
          const newTx: Transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            wallet_id,
            to_wallet_id: to_wallet_id || null,
            project_id: null,
            type,
            category,
            amount,
            note: note || null,
            transaction_date: nowIso,
            created_at: nowIso,
          };

          const updatedWallets = applyBalanceDelta(
            state.wallets,
            wallet_id,
            to_wallet_id || null,
            type,
            amount
          );

          return {
            wallets: updatedWallets,
            transactions: [newTx, ...state.transactions],
          };
        }),
      deleteTransaction: (id) => {
        const targetTx = get().transactions.find((t) => t.id === id);
        if (!targetTx) return;

        void deleteFromCloud('transactions', id);

        set((state) => {
          const nextWallets = applyBalanceDelta(
            state.wallets,
            targetTx.wallet_id,
            targetTx.to_wallet_id ?? null,
            targetTx.type,
            -targetTx.amount
          );
          const nextTransactions = state.transactions.filter((t) => t.id !== id);

          let nextBudgetPlan = state.budgetPlan;
          if (nextBudgetPlan) {
            const prevLinked = nextBudgetPlan.linkedTransactionIds || [];
            const nextLinked = prevLinked.filter((txId) => txId !== id);
            let nextFixed = nextBudgetPlan.fixedItems;

            if (targetTx.type === 'expense' && isFixedPaymentCategory(targetTx.category)) {
              const targetCatLower = targetTx.category.trim().toLowerCase();
              nextFixed = nextBudgetPlan.fixedItems.map((item) =>
                item.isPaid &&
                parseFixedPaymentCategory(item.name).toLowerCase() === targetCatLower
                  ? { ...item, isPaid: false }
                  : item
              );
            }

            if (
              nextLinked.length !== prevLinked.length ||
              nextFixed !== nextBudgetPlan.fixedItems
            ) {
              nextBudgetPlan = {
                ...nextBudgetPlan,
                fixedItems: nextFixed,
                linkedTransactionIds: nextLinked,
                updated_at: new Date().toISOString(),
              };
            }
          }

          return {
            wallets: nextWallets,
            transactions: nextTransactions,
            budgetPlan: nextBudgetPlan,
          };
        });

        syncFinanceChangesNow();
      },
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
      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }));
        deleteFromCloud('subscriptions', id);
      },
      saveBudgetPlan: ({ salaryAmount, cycleStartDate, fixedItems, rules, logIncomeToWalletId }) =>
        set((state) => {
          const nowIso = new Date().toISOString();
          const { cycleStartDate: startKey, cycleEndDate } = computePaydayCycle(cycleStartDate);
          const cleanSalary = Math.max(0, Math.round(salaryAmount || 0));
          const cleanFixed = fixedItems.map((item) => ({
            ...item,
            amount: Math.max(0, Math.round(item.amount || 0)),
          }));

          const isSameCycle = state.budgetPlan?.cycleStartDate === startKey;
          const nextLinkedIds =
            isSameCycle && state.budgetPlan?.linkedTransactionIds
              ? [...state.budgetPlan.linkedTransactionIds]
              : [];

          let nextWallets = state.wallets;
          let nextTransactions = state.transactions;

          if (logIncomeToWalletId && cleanSalary > 0) {
            const incomeTx: Transaction = {
              id: `tx-payday-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              wallet_id: logIncomeToWalletId,
              to_wallet_id: null,
              project_id: null,
              type: 'income',
              category: 'Gajian / Payday',
              amount: cleanSalary,
              note: `Alokasi gajian siklus ${startKey} s/d ${cycleEndDate}`,
              transaction_date: nowIso,
              created_at: nowIso,
            };
            nextLinkedIds.push(incomeTx.id);
            nextWallets = applyBalanceDelta(
              state.wallets,
              logIncomeToWalletId,
              null,
              'income',
              cleanSalary
            );
            nextTransactions = [incomeTx, ...state.transactions];
          }

          const nextPlan: MonthlyBudgetPlan = {
            id:
              isSameCycle && state.budgetPlan
                ? state.budgetPlan.id
                : `budget-${startKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            cycleStartDate: startKey,
            cycleEndDate,
            salaryAmount: cleanSalary,
            fixedItems: cleanFixed,
            rules,
            linkedTransactionIds: nextLinkedIds,
            syncedToCloud: false,
            created_at: isSameCycle && state.budgetPlan ? state.budgetPlan.created_at : nowIso,
            updated_at: nowIso,
          };

          const shouldArchivePrev = state.budgetPlan && state.budgetPlan.cycleStartDate !== startKey;
          const nextHistory = shouldArchivePrev && state.budgetPlan
            ? [state.budgetPlan, ...state.budgetHistory].slice(0, 12)
            : state.budgetHistory;

          return {
            budgetPlan: nextPlan,
            budgetRules: rules,
            budgetHistory: nextHistory,
            wallets: nextWallets,
            transactions: nextTransactions,
          };
        }),
      updateBudgetRules: (rules) =>
        set((state) => ({
          budgetRules: rules,
          budgetPlan: state.budgetPlan
            ? {
                ...state.budgetPlan,
                rules,
                syncedToCloud: false,
                updated_at: new Date().toISOString(),
              }
            : null,
        })),
      toggleFixedItemPaid: (fixedId, deductWalletId) =>
        set((state) => {
          if (!state.budgetPlan) return state;
          const target = state.budgetPlan.fixedItems.find((f) => f.id === fixedId);
          if (!target) return state;

          const nextPaid = !target.isPaid;
          const updatedFixed = state.budgetPlan.fixedItems.map((f) =>
            f.id === fixedId ? { ...f, isPaid: nextPaid } : f
          );

          let nextWallets = state.wallets;
          let nextTransactions = state.transactions;
          let nextLinkedIds = Array.isArray(state.budgetPlan.linkedTransactionIds)
            ? [...state.budgetPlan.linkedTransactionIds]
            : getReversibleCycleTransactionIds(state.budgetPlan, state.transactions);

          if (nextPaid && deductWalletId && target.amount > 0) {
            const nowIso = new Date().toISOString();
            const payTx: Transaction = {
              id: `tx-fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              wallet_id: deductWalletId,
              to_wallet_id: null,
              project_id: null,
              type: 'expense',
              category: parseFixedPaymentCategory(target.name),
              amount: Math.round(target.amount),
              note: `Pembayaran pos fix: ${target.name}`,
              transaction_date: nowIso,
              created_at: nowIso,
            };
            nextLinkedIds = [...nextLinkedIds, payTx.id];
            nextWallets = applyBalanceDelta(
              state.wallets,
              deductWalletId,
              null,
              'expense',
              Math.round(target.amount)
            );
            nextTransactions = [payTx, ...state.transactions];
          }

          return {
            budgetPlan: {
              ...state.budgetPlan,
              fixedItems: updatedFixed,
              linkedTransactionIds: nextLinkedIds,
              syncedToCloud: false,
              updated_at: new Date().toISOString(),
            },
            wallets: nextWallets,
            transactions: nextTransactions,
          };
        }),
      resetBudgetPlan: (options) => {
        const state = get();
        const prevPlan = state.budgetPlan;
        const revertTransactions = Boolean(options?.revertTransactions);
        const reversibleIds =
          revertTransactions && prevPlan
            ? new Set(getReversibleCycleTransactionIds(prevPlan, state.transactions))
            : new Set<string>();

        for (const txId of reversibleIds) {
          void deleteFromCloud('transactions', txId);
        }
        if (prevPlan?.id) {
          void deleteFromCloud('budget_plans', prevPlan.id);
        }

        set((curr) => {
          let nextWallets = curr.wallets;
          let nextTransactions = curr.transactions;

          if (reversibleIds.size > 0) {
            for (const tx of curr.transactions) {
              if (!reversibleIds.has(tx.id)) continue;
              nextWallets = applyBalanceDelta(
                nextWallets,
                tx.wallet_id,
                tx.to_wallet_id ?? null,
                tx.type,
                -tx.amount
              );
            }
            nextTransactions = curr.transactions.filter((tx) => !reversibleIds.has(tx.id));
          }

          return {
            budgetPlan: null,
            wallets: nextWallets,
            transactions: nextTransactions,
          };
        });

        syncFinanceChangesNow();
      },
    }),
    {
      name: 'chemicvll-finance-storage',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        return {
          ...persistedState,
          budgetPlan: persistedState.budgetPlan ?? null,
          budgetRules:
            Array.isArray(persistedState.budgetRules) && persistedState.budgetRules.length > 0
              ? persistedState.budgetRules
              : DEFAULT_BUDGET_RULES,
          budgetHistory: Array.isArray(persistedState.budgetHistory)
            ? persistedState.budgetHistory
            : [],
        };
      },
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
