'use client';

import { createBrowserClient } from './supabase/client';
import { useCareerStore } from '@/stores/useCareerStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (date: string) => void;
  setErrorMessage: (msg: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  errorMessage: null,
  setStatus: (status) => set({ status }),
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

    // Parallel fetch with 10s timeout to allow cold connection handshake
    const [careerRes, walletRes, txRes, subRes, taskRes] = await Promise.race([
      Promise.all([
        supabase.from('career_pipelines').select('*'),
        supabase.from('wallets').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('tasks').select('*'),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Koneksi timeout (>10 detik). Supabase belum merespon.')),
          SYNC_TIMEOUT_MS
        )
      ),
    ]);

    const hasError =
      careerRes.error ||
      walletRes.error ||
      txRes.error ||
      subRes.error ||
      taskRes.error;

    if (hasError) {
      const firstErr =
        careerRes.error ||
        walletRes.error ||
        txRes.error ||
        subRes.error ||
        taskRes.error;
      const errMsg = firstErr?.message || 'Database query error';
      console.warn('Supabase fetch error, fallback to local cache:', errMsg);
      useSyncStore.getState().setErrorMessage(errMsg);
      useSyncStore.getState().setStatus('offline');
      isSyncingDown = false;
      return false;
    }

    const remoteCareer = careerRes.data;
    const remoteWallets = walletRes.data;
    const remoteTx = txRes.data;
    const remoteSubs = subRes.data;
    const remoteTasks = taskRes.data;

    // Check if cloud already has stored data
    const hasRemoteData =
      (remoteCareer && remoteCareer.length > 0) ||
      (remoteWallets && remoteWallets.length > 0) ||
      (remoteTasks && remoteTasks.length > 0);

    if (hasRemoteData) {
      if (remoteCareer && remoteCareer.length > 0) {
        useCareerStore.setState({ items: remoteCareer });
      }
      if (remoteWallets && remoteWallets.length > 0) {
        useFinanceStore.setState({
          wallets: remoteWallets,
          transactions: remoteTx || [],
          subscriptions: remoteSubs || [],
        });
      }
      if (remoteTasks && remoteTasks.length > 0) {
        useTaskStore.setState({ tasks: remoteTasks });
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
  const supabase = createBrowserClient();
  if (!supabase || (!force && isSyncingDown)) return;

  try {
    useSyncStore.getState().setStatus('syncing');

    const careerItems = useCareerStore.getState().items;
    const { wallets, transactions, subscriptions } = useFinanceStore.getState();
    const tasks = useTaskStore.getState().tasks;

    const upserts = [];

    if (careerItems.length > 0) {
      upserts.push(
        supabase.from('career_pipelines').upsert(
          careerItems.map((item) => ({ ...item, user_id: 'ferrel' }))
        )
      );
    }

    if (wallets.length > 0) {
      upserts.push(
        supabase.from('wallets').upsert(
          wallets.map((w) => ({ ...w, user_id: 'ferrel' }))
        )
      );
    }

    if (transactions.length > 0) {
      upserts.push(
        supabase.from('transactions').upsert(
          transactions.map((tx) => ({ ...tx, user_id: 'ferrel' }))
        )
      );
    }

    if (subscriptions.length > 0) {
      upserts.push(
        supabase.from('subscriptions').upsert(
          subscriptions.map((sub) => ({ ...sub, user_id: 'ferrel' }))
        )
      );
    }

    if (tasks.length > 0) {
      upserts.push(
        supabase.from('tasks').upsert(
          tasks.map((task) => ({ ...task, user_id: 'ferrel' }))
        )
      );
    }

    if (upserts.length > 0) {
      const results = await Promise.race([
        Promise.all(upserts),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Push timeout')), SYNC_TIMEOUT_MS)
        ),
      ]);

      const anyError = results.find((r) => r && r.error);
      if (anyError) {
        console.warn('Supabase push error:', anyError.error);
        useSyncStore.getState().setStatus('offline');
        return;
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
}
