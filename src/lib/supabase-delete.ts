import { createBrowserClient } from './supabase/client';

export type SyncTable =
  | 'career_pipelines'
  | 'wallets'
  | 'transactions'
  | 'subscriptions'
  | 'tasks';

export interface PendingDeletion {
  table: SyncTable;
  id: string;
  deleted_at: number;
}

const STORAGE_KEY = 'chemicvll-pending-deletions';

export function getPendingDeletions(): PendingDeletion[] {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPendingDeletion(table: SyncTable, id: string): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    const pending = getPendingDeletions();
    if (!pending.some((p) => p.table === table && p.id === id)) {
      pending.push({ table, id, deleted_at: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    }
  } catch (err) {
    console.warn('[Sync] Failed to record pending deletion:', err);
  }
}

export function clearPendingDeletion(table: SyncTable, id: string): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    const pending = getPendingDeletions().filter(
      (p) => !(p.table === table && p.id === id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch (err) {
    console.warn('[Sync] Failed to clear pending deletion:', err);
  }
}

export function isPendingDeletion(table: SyncTable, id: string): boolean {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return false;
  return getPendingDeletions().some((p) => p.table === table && p.id === id);
}

export async function deleteFromCloud(table: SyncTable, id: string): Promise<boolean> {
  // Record locally first so refresh or network drop won't resurrect it
  recordPendingDeletion(table, id);

  const supabase = createBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`[Supabase] Delete ${id} from ${table} failed:`, error.message);
      return false;
    }
    // Successfully deleted in cloud, clear from pending queue
    clearPendingDeletion(table, id);
    return true;
  } catch (err) {
    console.warn(`[Supabase] Exception deleting ${id} from ${table}:`, err);
    return false;
  }
}

export async function flushPendingDeletions(): Promise<void> {
  const pending = getPendingDeletions();
  if (pending.length === 0) return;

  const supabase = createBrowserClient();
  if (!supabase) return;

  for (const item of pending) {
    try {
      const { error } = await supabase.from(item.table).delete().eq('id', item.id);
      if (!error) {
        clearPendingDeletion(item.table, item.id);
      }
    } catch {
      // Will retry on next sync cycle
    }
  }
}
