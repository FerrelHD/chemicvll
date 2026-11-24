import { useFinanceStore } from '@/stores/useFinanceStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useCareerStore } from '@/stores/useCareerStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import { useDevStore } from '@/stores/useDevStore';
import { clearAllPendingDeletions } from '@/lib/supabase-delete';
import { toLocalDateKey } from '@/lib/budget-utils';

export interface BackupPayload {
  app: string;
  version: string;
  exported_at: string;
  stores: {
    finance: {
      wallets: any[];
      transactions: any[];
      subscriptions: any[];
      budgetPlan: any;
      budgetHistory: any[];
      debts: any[];
    };
    tasks: {
      tasks: any[];
    };
    habits: {
      habits: any[];
    };
    career: {
      items: any[];
    };
    notes: {
      notes: any[];
      contentIdeas: any[];
    };
    dropzone: {
      items: any[];
    };
    dev?: {
      projects: any[];
    };
  };
}

export function generateBackupPayload(): BackupPayload {
  const finance = useFinanceStore.getState();
  const tasks = useTaskStore.getState();
  const habits = useHabitStore.getState();
  const career = useCareerStore.getState();
  const notes = useNotesStore.getState();
  const dropzone = useDropzoneStore.getState();
  const dev = useDevStore.getState();

  return {
    app: 'Personal OS (chemicvll)',
    version: '1.0',
    exported_at: new Date().toISOString(),
    stores: {
      finance: {
        wallets: finance.wallets || [],
        transactions: finance.transactions || [],
        subscriptions: finance.subscriptions || [],
        budgetPlan: finance.budgetPlan || null,
        budgetHistory: finance.budgetHistory || [],
        debts: finance.debts || [],
      },
      tasks: {
        tasks: tasks.tasks || [],
      },
      habits: {
        habits: habits.habits || [],
      },
      career: {
        items: career.items || [],
      },
      notes: {
        notes: notes.notes || [],
        contentIdeas: notes.contentIdeas || [],
      },
      dropzone: {
        items: dropzone.items || [],
      },
      dev: {
        projects: (dev.projects || []).map((p) => ({
          ...p,
          serverState: 'stopped',
          pid: null,
          logs: [],
        })),
      },
    },
  };
}

export function exportAllDataAsJson(): void {
  if (typeof window === 'undefined') return;

  const backupData = generateBackupPayload();
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = toLocalDateKey();
  a.download = `chemicvll-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface RestoreResult {
  success: boolean;
  message: string;
  counts?: {
    transactions: number;
    wallets: number;
    tasks: number;
    habits: number;
    career: number;
    notes: number;
    drops: number;
    projects: number;
  };
}

export function restoreBackupFromJson(rawInput: string | object): RestoreResult {
  try {
    let payload: any;
    if (typeof rawInput === 'string') {
      payload = JSON.parse(rawInput);
    } else {
      payload = rawInput;
    }

    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Invalid payload: data is not a valid JSON object' };
    }

    if (!payload.app || !payload.app.includes('Personal OS')) {
      return { success: false, message: 'Invalid backup file: not a recognized Personal OS backup' };
    }

    if (!payload.stores || typeof payload.stores !== 'object') {
      return { success: false, message: 'Invalid backup file: missing stores object' };
    }

    const { stores } = payload;

    // 1. Finance Store
    if (stores.finance) {
      useFinanceStore.setState((prev) => ({
        ...prev,
        wallets: Array.isArray(stores.finance.wallets) ? stores.finance.wallets : prev.wallets,
        transactions: Array.isArray(stores.finance.transactions) ? stores.finance.transactions : prev.transactions,
        subscriptions: Array.isArray(stores.finance.subscriptions) ? stores.finance.subscriptions : prev.subscriptions,
        budgetPlan: stores.finance.budgetPlan !== undefined ? stores.finance.budgetPlan : prev.budgetPlan,
        budgetHistory: Array.isArray(stores.finance.budgetHistory) ? stores.finance.budgetHistory : prev.budgetHistory,
        debts: Array.isArray(stores.finance.debts) ? stores.finance.debts : prev.debts,
      }));
    }

    // 2. Tasks Store
    if (stores.tasks && Array.isArray(stores.tasks.tasks)) {
      useTaskStore.setState((prev) => ({
        ...prev,
        tasks: stores.tasks.tasks,
      }));
    }

    // 3. Habits Store
    if (stores.habits && Array.isArray(stores.habits.habits)) {
      useHabitStore.setState((prev) => ({
        ...prev,
        habits: stores.habits.habits,
      }));
    }

    // 4. Career Store
    if (stores.career) {
      const items = stores.career.items || stores.career.applications || [];
      if (Array.isArray(items)) {
        useCareerStore.setState((prev) => ({
          ...prev,
          items,
        }));
      }
    }

    // 5. Notes Store
    if (stores.notes) {
      useNotesStore.setState((prev) => ({
        ...prev,
        notes: Array.isArray(stores.notes.notes) ? stores.notes.notes : prev.notes,
        contentIdeas: Array.isArray(stores.notes.contentIdeas) ? stores.notes.contentIdeas : prev.contentIdeas,
      }));
    }

    // 6. Dropzone Store
    if (stores.dropzone) {
      const items = stores.dropzone.items || stores.dropzone.drops || [];
      if (Array.isArray(items)) {
        useDropzoneStore.setState((prev) => ({
          ...prev,
          items,
        }));
      }
    }

    // 7. Dev Store (projects + encryptedEnv)
    if (stores.dev && Array.isArray(stores.dev.projects)) {
      useDevStore.setState((prev) => ({
        ...prev,
        projects: stores.dev.projects.map((p: any) => ({
          ...p,
          serverState: 'stopped',
          pid: null,
          logs: Array.isArray(p.logs) && p.logs.length > 0 ? p.logs : ['[Daemon] Restored from backup.'],
        })),
      }));
    }

    clearAllPendingDeletions();

    return {
      success: true,
      message: 'Backup data successfully restored into all stores',
      counts: {
        transactions: stores.finance?.transactions?.length || 0,
        wallets: stores.finance?.wallets?.length || 0,
        tasks: stores.tasks?.tasks?.length || 0,
        habits: stores.habits?.habits?.length || 0,
        career: (stores.career?.items || stores.career?.applications)?.length || 0,
        notes: stores.notes?.notes?.length || 0,
        drops: (stores.dropzone?.items || stores.dropzone?.drops)?.length || 0,
        projects: stores.dev?.projects?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to restore backup: ${err.message || 'Unknown error'}`,
    };
  }
}
