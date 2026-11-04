'use client';

import React from 'react';
import { Menu, Search, Bell, Lock, Plus } from 'lucide-react';
import { useSyncStore, pullFromCloud } from '@/lib/supabase-sync';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandBar?: () => void;
}

export function Header({ onOpenMobileMenu, onOpenCommandBar }: HeaderProps) {
  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncErrorMessage = useSyncStore((s) => s.errorMessage);

  const handleSyncClick = async () => {
    const success = await pullFromCloud();
    if (!success) {
      const msg = useSyncStore.getState().errorMessage;
      if (msg) {
        alert(`Supabase Sync Status: ${msg}`);
      }
    }
  };

  const triggerCommand = () => {
    if (onOpenCommandBar) {
      onOpenCommandBar();
    } else {
      window.dispatchEvent(new CustomEvent('open-command-bar'));
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline/30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 md:rounded-tl-3xl shadow-[0_1px_8px_rgba(24,24,27,0.02)]">
      {/* Left section: Hamburger (Mobile) + Search Bar (⌘K) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={onOpenMobileMenu}
          className="md:hidden w-9 h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* ⌘K Capsule Input */}
        <button
          type="button"
          onClick={triggerCommand}
          className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3.5 py-1.5 rounded-full border border-outline shadow-sm hover:border-zinc-400 transition cursor-pointer text-left max-w-[210px] md:max-w-xs"
        >
          <Search className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
          <span className="text-xs text-on-surface-variant pr-2 truncate">
            Search system, files...
          </span>
          <kbd className="bg-surface-container-high text-on-surface text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ml-auto flex-shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Quick Action Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-quick-capture'))}
          className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white px-3 py-1.5 rounded-full shadow-sm shadow-primary/20 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="Quick Capture (Q)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Quick Add</span>
          <kbd className="bg-white/20 text-white text-[10px] font-mono px-1 py-0.2 rounded font-semibold ml-0.5">
            Q
          </kbd>
        </button>
      </div>

      {/* Right section: Cloud Sync + Notif + Avatar Ferrel */}
      <div className="flex items-center gap-3">          
        {/* Cloud Sync Status Pill */}
        <button
          type="button"
          onClick={handleSyncClick}
          className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline shadow-sm text-xs hover:bg-surface-container-high transition cursor-pointer"
          title={
            syncStatus === 'synced'
              ? `Synced at ${lastSyncedAt || 'just now'} WIB. Click to sync now.`
              : syncStatus === 'offline'
              ? `Offline: ${syncErrorMessage || 'Click to retry / inspect reason'}`
              : 'Syncing in progress...'
          }
        >
          <div
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'syncing'
                ? 'bg-amber-500 animate-pulse'
                : syncStatus === 'synced'
                ? 'bg-emerald-500'
                : syncStatus === 'offline'
                ? 'bg-zinc-400'
                : 'bg-primary-container animate-pulse'
            }`}
          />
          <span className="font-semibold text-on-surface text-xs">Cloud Sync</span>
          <span className="text-on-surface-variant hidden md:inline text-[11px]">
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : syncStatus === 'synced'
              ? 'Synced'
              : syncStatus === 'offline'
              ? 'Offline'
              : 'Active'}
          </span>
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => alert('No new notifications.')}
          className="w-9 h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
        >
          <Bell className="w-4 h-4 text-on-surface-variant" />
        </button>

        {/* User Profile Avatar & Lock */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
            F
          </div>
          <span className="text-xs font-semibold text-on-surface hidden sm:inline">
            Ferrel
          </span>
          <button
            type="button"
            aria-label="Lock Workspace"
            onClick={() => window.dispatchEvent(new CustomEvent('personal_os_lock'))}
            className="w-7 h-7 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            title="Lock Personal OS (Master PIN)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
