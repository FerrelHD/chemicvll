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
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (date: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  setStatus: (status) => set({ status }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
}));

let isInitialized = false;
let isSyncingDown = false;
let syncTimeout: NodeJS.Timeout | null = null;

export async function pullFromCloud(): Promise<boolean> {
  const supabase = createBrowserClient();
  if (!supabase) {
    useSyncStore.getState().setStatus('offline');
    return false;
  }

  try {
    useSyncStore.getState().setStatus('syncing');
    isSyncingDown = true;

    // 1. Fetch Career Pipelines
    const { data: remoteCareer, error: careerErr } = await supabase
      .from('career_pipelines')
      .select('*');

    // 2. Fetch Wallets, Transactions, Subscriptions
    const { data: remoteWallets, error: walletErr } = await supabase
      .from('wallets')
      .select('*');
    const { data: remoteTx, error: txErr } = await supabase
      .from('transactions')
      .select('*');
    const { data: remoteSubs, error: subErr } = await supabase
      .from('subscriptions')
      .select('*');

    // 3. Fetch Tasks
    const { data: remoteTasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*');

    if (careerErr || walletErr || txErr || subErr || taskErr) {
      console.warn('Supabase fetch error, fallback to local cache:', {
        careerErr,
        walletErr,
        txErr,
        subErr,
        taskErr,
      });
      useSyncStore.getState().setStatus('offline');
      isSyncingDown = false;
      return false;
    }

    const careerStore = useCareerStore.getState();
    const financeStore = useFinanceStore.getState();
    const taskStore = useTaskStore.getState();

    // Check if cloud has data
    const hasRemoteData =
      (remoteCareer && remoteCareer.length > 0) ||
      (remoteWallets && remoteWallets.length > 0) ||
      (remoteTasks && remoteTasks.length > 0);

    if (hasRemoteData) {
      // Hydrate local stores from Cloud
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
      await pushAllToCloud();
    }

    useSyncStore.getState().setStatus('synced');
    useSyncStore.getState().setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    isSyncingDown = false;
    return true;
  } catch (err) {
    console.error('Failed to sync from cloud:', err);
    useSyncStore.getState().setStatus('offline');
    isSyncingDown = false;
    return false;
  }
}

export async function pushAllToCloud(): Promise<void> {
  const supabase = createBrowserClient();
  if (!supabase || isSyncingDown) return;

  try {
    useSyncStore.getState().setStatus('syncing');

    const careerItems = useCareerStore.getState().items;
    const { wallets, transactions, subscriptions } = useFinanceStore.getState();
    const tasks = useTaskStore.getState().tasks;

    if (careerItems.length > 0) {
      await supabase.from('career_pipelines').upsert(
        careerItems.map((item) => ({
          ...item,
          user_id: 'ferrel',
        }))
      );
    }

    if (wallets.length > 0) {
      await supabase.from('wallets').upsert(
        wallets.map((w) => ({
          ...w,
          user_id: 'ferrel',
        }))
      );
    }

    if (transactions.length > 0) {
      await supabase.from('transactions').upsert(
        transactions.map((tx) => ({
          ...tx,
          user_id: 'ferrel',
        }))
      );
    }

    if (subscriptions.length > 0) {
      await supabase.from('subscriptions').upsert(
        subscriptions.map((sub) => ({
          ...sub,
          user_id: 'ferrel',
        }))
      );
    }

    if (tasks.length > 0) {
      await supabase.from('tasks').upsert(
        tasks.map((task) => ({
          ...task,
          user_id: 'ferrel',
        }))
      );
    }

    useSyncStore.getState().setStatus('synced');
    useSyncStore.getState().setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  } catch (err) {
    console.error('Failed to push to cloud:', err);
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
