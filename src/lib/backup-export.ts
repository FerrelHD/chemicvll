import { useFinanceStore } from '@/stores/useFinanceStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useCareerStore } from '@/stores/useCareerStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
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
      applications: any[];
    };
    notes: {
      notes: any[];
      contentIdeas: any[];
    };
    dropzone: {
      drops: any[];
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
        applications: career.applications || [],
      },
      notes: {
        notes: notes.notes || [],
        contentIdeas: notes.contentIdeas || [],
      },
      dropzone: {
        drops: dropzone.drops || [],
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
