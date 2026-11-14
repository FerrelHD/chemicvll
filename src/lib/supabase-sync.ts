'use client';

import { createBrowserClient } from './supabase/client';
import { flushPendingDeletions, isPendingDeletion } from './supabase-delete';
import {
  budgetPlanToRow,
  isMissingTableError,
  rowToBudgetPlan,
  type BudgetPlanRow,
} from './budget-utils';
import { useCareerStore } from '@/stores/useCareerStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useTaskStore } from '@/stores/useTaskStore';
import type { MonthlyBudgetPlan } from '@/types/database';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { DevProject, useDevStore } from '@/stores/useDevStore';
import { create } from 'zustand';

export { budgetPlanToRow, isMissingTableError, rowToBudgetPlan };

function toProjectPayload(project: DevProject) {
  return {
    id: project.id,
    user_id: 'ferrel',
    name: project.name,
    description: project.description,
    status: project.status,
    color_code: project.color_code,
    repo_url: project.repo_url ?? null,
    prod_url: project.prod_url ?? null,
    local_path: project.local_path ?? null,
    start_command: project.start_command ?? null,
    default_port: project.default_port ?? null,
    target_date: project.target_date ?? null,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type BudgetCloudStatus = 'unknown' | 'synced' | 'migration_needed';

interface SyncState {
  status: SyncStatus;
  budgetCloudStatus: BudgetCloudStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  setStatus: (status: SyncStatus) => void;
  setBudgetCloudStatus: (status: BudgetCloudStatus) => void;
  setLastSyncedAt: (date: string) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  budgetCloudStatus: 'unknown',
  lastSyncedAt: null,
  errorMessage: null,
  setStatus: (status) => set({ status }),
  setBudgetCloudStatus: (budgetCloudStatus) => set({ budgetCloudStatus }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

let isInitialized = false;
let isSyncingDown = false;
let syncTimeout: NodeJS.Timeout | null = null;

const SYNC_TIMEOUT_MS = 10000;

export async function pullFromCloud(): Promise<boolean> {
  const supabase = createBrowserClient();
  if (!supabase) {
    useSyncStore.getState().setErrorMessage('Missing Supabase credentials in .env.local');
    useSyncStore.getState().setStatus('offline');
    return false;
  }

  try {
    useSyncStore.getState().setStatus('syncing');
    isSyncingDown = true;

    // Flush any pending deletions first before fetching
    await flushPendingDeletions();

    // Parallel fetch with 10s timeout to allow cold connection handshake
    const [
      careerRes,
      walletRes,
      txRes,
      subRes,
      taskRes,
      budgetRes,
      dropzoneRes,
      notesRes,
      contentRes,
      projectRes,
    ] = await Promise.race([
      Promise.all([
        supabase.from('career_pipelines').select('*'),
        supabase.from('wallets').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('budget_plans').select('*'),
        supabase.from('dropzone_items').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('content_ideas').select('*'),
        supabase.from('projects').select('*'),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Koneksi timeout (>10 detik). Supabase belum merespon.')),
          SYNC_TIMEOUT_MS
        )
      ),
    ]);

    const firstErr =
      careerRes.error ||
      walletRes.error ||
      txRes.error ||
      subRes.error ||
      taskRes.error ||
      dropzoneRes.error ||
      notesRes.error ||
      contentRes.error ||
      projectRes.error;

    if (firstErr) {
      const errMsg = firstErr.message || 'Database query error';
      console.warn('Supabase fetch error, fallback to local cache:', errMsg);
      useSyncStore.getState().setErrorMessage(errMsg);
      useSyncStore.getState().setStatus('offline');
      isSyncingDown = false;
      return false;
    }

    const budgetMissing = budgetRes.error ? isMissingTableError(budgetRes.error) : false;
    if (budgetMissing) {
      useSyncStore.getState().setBudgetCloudStatus('migration_needed');
    } else if (budgetRes.error) {
      console.warn('Supabase budget_plans fetch error:', budgetRes.error.message);
    } else {
      useSyncStore.getState().setBudgetCloudStatus('synced');
    }

    const filteredCareer = (careerRes.data || []).filter(
      (item: any) => !isPendingDeletion('career_pipelines', item.id)
    );
    const filteredWallets = (walletRes.data || []).filter(
      (w: any) => !isPendingDeletion('wallets', w.id)
    );
    const filteredTx = (txRes.data || []).filter(
      (tx: any) => !isPendingDeletion('transactions', tx.id)
    );
    const filteredSubs = (subRes.data || []).filter(
      (s: any) => !isPendingDeletion('subscriptions', s.id)
    );
    const filteredTasks = (taskRes.data || []).filter(
      (task: any) => !isPendingDeletion('tasks', task.id)
    );
    const filteredDropzone = (dropzoneRes.data || []).filter(
      (item: any) => !isPendingDeletion('dropzone_items', item.id)
    );
    const filteredNotes = (notesRes.data || []).filter(
      (note: any) => !isPendingDeletion('notes', note.id)
    );
    const filteredContentIdeas = (contentRes.data || []).filter(
      (idea: any) => !isPendingDeletion('content_ideas', idea.id)
    );
    const filteredProjects = (projectRes.data || []).filter(
      (project: any) => !isPendingDeletion('projects', project.id)
    );

    const filteredBudgetRows = !budgetRes.error
      ? (budgetRes.data || [])
          .filter((b: any) => !isPendingDeletion('budget_plans', b.id))
          .sort((a: any, b: any) =>
            String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
          )
      : [];

    const activeCloudRows = filteredBudgetRows.filter((b: any) => b.is_active !== false);
    const inactiveCloudRows = filteredBudgetRows.filter((b: any) => b.is_active === false);
    const activeCloudPlan: MonthlyBudgetPlan | null =
      activeCloudRows.length > 0 ? rowToBudgetPlan(activeCloudRows[0]) : null;
    const cloudHistory: MonthlyBudgetPlan[] = [
      ...activeCloudRows.slice(1).map((r: any) => rowToBudgetPlan(r)),
      ...inactiveCloudRows.map((r: any) => rowToBudgetPlan(r)),
    ].slice(0, 12);

    // Check if cloud already has stored data
    const hasRemoteData =
      filteredCareer.length > 0 ||
      filteredWallets.length > 0 ||
      filteredTasks.length > 0 ||
      filteredBudgetRows.length > 0 ||
      filteredDropzone.length > 0 ||
      filteredNotes.length > 0 ||
      filteredContentIdeas.length > 0 ||
      filteredProjects.length > 0;

    let shouldPushLocalPlan = false;

    if (hasRemoteData) {
      if (careerRes.data) {
        useCareerStore.setState({ items: filteredCareer });
      }
      if (walletRes.data) {
        const localFinance = useFinanceStore.getState();
        const localPlan = localFinance.budgetPlan;
        let nextBudgetPlan = localPlan;
        let nextBudgetHistory = localFinance.budgetHistory;

        if (!budgetRes.error) {
          if (activeCloudPlan) {
            if (localPlan && localPlan.id === activeCloudPlan.id) {
              if (localPlan.updated_at > activeCloudPlan.updated_at) {
                nextBudgetPlan = localPlan;
                shouldPushLocalPlan = true;
              } else {
                nextBudgetPlan = activeCloudPlan;
              }
            } else if (
              localPlan &&
              !localPlan.syncedToCloud &&
              localPlan.updated_at > activeCloudPlan.updated_at
            ) {
              nextBudgetPlan = localPlan;
              shouldPushLocalPlan = true;
            } else {
              nextBudgetPlan = activeCloudPlan;
            }
          } else if (localPlan?.syncedToCloud) {
            nextBudgetPlan = null;
          } else if (localPlan) {
            shouldPushLocalPlan = true;
          }

          if (cloudHistory.length > 0) {
            nextBudgetHistory = cloudHistory;
          }
        }

        const hasCoreFinanceRemote =
          filteredWallets.length > 0 || filteredTx.length > 0 || filteredSubs.length > 0;
        useFinanceStore.setState({
          ...(hasCoreFinanceRemote
            ? {
                wallets: filteredWallets,
                transactions: filteredTx,
                subscriptions: filteredSubs,
              }
            : {}),
          budgetPlan: nextBudgetPlan,
          budgetHistory: nextBudgetHistory,
        });
        if (!hasCoreFinanceRemote) {
          shouldPushLocalPlan = true;
        }
      }
      if (taskRes.data) {
        useTaskStore.setState({ tasks: filteredTasks });
      }
      if (dropzoneRes.data) {
        useDropzoneStore.setState({ items: filteredDropzone });
      }
      if (notesRes.data && filteredNotes.length > 0) {
        useNotesStore.setState({ notes: filteredNotes });
      }
      if (contentRes.data && filteredContentIdeas.length > 0) {
        useNotesStore.setState({ contentIdeas: filteredContentIdeas });
      }
      if (projectRes.data && filteredProjects.length > 0) {
        const existingById = new Map(
          useDevStore.getState().projects.map((p) => [p.id, p])
        );
        const mergedProjects: DevProject[] = filteredProjects.map((remote: any) => {
          const local = existingById.get(remote.id);
          return {
            ...remote,
            serverState: local?.serverState ?? 'stopped',
            pid: local?.pid,
            logs: local?.logs ?? [],
            encryptedEnv: local?.encryptedEnv,
          };
        });
        useDevStore.setState({ projects: mergedProjects });
      }
      if (shouldPushLocalPlan) {
        await pushAllToCloud(true);
      }
    } else {
      // First time cloud initialization: push existing local data to cloud
      await pushAllToCloud(true);
    }

    useSyncStore.getState().setStatus('synced');
    useSyncStore.getState().setErrorMessage(null);
    useSyncStore.getState().setLastSyncedAt(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    );
    isSyncingDown = false;
    return true;
  } catch (err: any) {
    const msg = err?.message || 'Connection timeout';
    console.warn('Failed to sync from cloud:', msg);
    useSyncStore.getState().setErrorMessage(msg);
    useSyncStore.getState().setStatus('offline');
    isSyncingDown = false;
    return false;
  }
}

export async function pushAllToCloud(force = false): Promise<void> {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  const supabase = createBrowserClient();
  if (!supabase || (!force && isSyncingDown)) return;

  try {
    useSyncStore.getState().setStatus('syncing');

    // Flush any pending deletions before upserting active items
    await flushPendingDeletions();

    const careerItems = useCareerStore.getState().items;
    const {
      wallets,
      transactions,
      subscriptions,
      budgetPlan,
      budgetHistory,
    } = useFinanceStore.getState();
    const tasks = useTaskStore.getState().tasks;
    const dropzoneItems = useDropzoneStore.getState().items;
    const { notes, contentIdeas } = useNotesStore.getState();
    const projects = useDevStore.getState().projects;

    const coreUpserts = [];

    if (careerItems.length > 0) {
      coreUpserts.push(
        supabase.from('career_pipelines').upsert(
          careerItems.map((item) => ({ ...item, user_id: 'ferrel' }))
        )
      );
    }

    if (wallets.length > 0) {
      coreUpserts.push(
        supabase.from('wallets').upsert(
          wallets.map((w) => ({ ...w, user_id: 'ferrel' }))
        )
      );
    }

    if (transactions.length > 0) {
      coreUpserts.push(
        supabase.from('transactions').upsert(
          transactions.map((tx) => ({ ...tx, user_id: 'ferrel' }))
        )
      );
    }

    if (subscriptions.length > 0) {
      coreUpserts.push(
        supabase.from('subscriptions').upsert(
          subscriptions.map((sub) => ({ ...sub, user_id: 'ferrel' }))
        )
      );
    }

    if (tasks.length > 0) {
      coreUpserts.push(
        supabase.from('tasks').upsert(
          tasks.map((task) => ({ ...task, user_id: 'ferrel' }))
        )
      );
    }

    if (dropzoneItems.length > 0) {
      coreUpserts.push(
        supabase.from('dropzone_items').upsert(
          dropzoneItems.map((item) => ({ ...item, user_id: 'ferrel' }))
        )
      );
    }

    if (notes.length > 0) {
      coreUpserts.push(
        supabase.from('notes').upsert(
          notes.map((note) => ({ ...note, user_id: 'ferrel' }))
        )
      );
    }

    if (contentIdeas.length > 0) {
      coreUpserts.push(
        supabase.from('content_ideas').upsert(
          contentIdeas.map((idea) => ({ ...idea, user_id: 'ferrel' }))
        )
      );
    }

    if (projects.length > 0) {
      coreUpserts.push(
        supabase.from('projects').upsert(projects.map(toProjectPayload))
      );
    }

    const budgetRows: BudgetPlanRow[] = [];
    if (budgetPlan) {
      budgetRows.push(budgetPlanToRow(budgetPlan, 'ferrel', true));
    }
    const seenHistoryIds = new Set(budgetPlan ? [budgetPlan.id] : []);
    for (const oldPlan of budgetHistory || []) {
      if (!oldPlan?.id || seenHistoryIds.has(oldPlan.id)) continue;
      seenHistoryIds.add(oldPlan.id);
      budgetRows.push(budgetPlanToRow(oldPlan, 'ferrel', false));
    }

    const budgetPromise =
      budgetRows.length > 0
        ? supabase.from('budget_plans').upsert(budgetRows)
        : null;

    if (coreUpserts.length > 0 || budgetPromise) {
      const [coreResults, budgetResult] = await Promise.race([
        Promise.all([
          coreUpserts.length > 0 ? Promise.all(coreUpserts) : Promise.resolve([]),
          budgetPromise ?? Promise.resolve(null),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Push timeout')), SYNC_TIMEOUT_MS)
        ),
      ]);

      const anyCoreError = coreResults.find((r) => r && r.error);
      if (anyCoreError) {
        console.warn('Supabase push error:', anyCoreError.error);
        useSyncStore.getState().setStatus('offline');
        return;
      }

      if (budgetResult && budgetResult.error) {
        if (isMissingTableError(budgetResult.error)) {
          useSyncStore.getState().setBudgetCloudStatus('migration_needed');
        } else {
          console.warn('Supabase budget_plans push error:', budgetResult.error.message);
        }
      } else if (budgetRows.length > 0) {
        useSyncStore.getState().setBudgetCloudStatus('synced');
        if (budgetPlan && !budgetPlan.syncedToCloud) {
          const prevSyncingDown = isSyncingDown;
          isSyncingDown = true;
          try {
            useFinanceStore.setState((state) =>
              state.budgetPlan && state.budgetPlan.id === budgetPlan.id
                ? { budgetPlan: { ...state.budgetPlan, syncedToCloud: true } }
                : state
            );
          } finally {
            isSyncingDown = prevSyncingDown;
          }
        }
      }
    }

    useSyncStore.getState().setStatus('synced');
    useSyncStore.getState().setLastSyncedAt(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    );
  } catch (err) {
    console.warn('Failed to push to cloud:', err);
    useSyncStore.getState().setStatus('offline');
  }
}

function debouncePushToCloud() {
  if (isSyncingDown) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushAllToCloud();
  }, 1200);
}

export function initSupabaseSync(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // Initial pull from cloud on startup
  pullFromCloud();

  // Subscribe to changes in local stores to auto-push
  useCareerStore.subscribe(() => {
    if (!isSyncingDown) debouncePushToCloud();
  });

  useFinanceStore.subscribe(() => {
    if (!isSyncingDown) debouncePushToCloud();
  });

  useTaskStore.subscribe(() => {
    if (!isSyncingDown) debouncePushToCloud();
  });

  useDropzoneStore.subscribe(() => {
    if (!isSyncingDown) debouncePushToCloud();
  });

  useNotesStore.subscribe(() => {
    if (!isSyncingDown) debouncePushToCloud();
  });

  useDevStore.subscribe((state, prevState) => {
    if (isSyncingDown) return;
    if (
      JSON.stringify(state.projects.map(toProjectPayload)) !==
      JSON.stringify(prevState.projects.map(toProjectPayload))
    ) {
      debouncePushToCloud();
    }
  });
}
