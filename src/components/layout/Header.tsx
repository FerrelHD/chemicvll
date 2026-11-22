'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Lock, Sun, Moon } from 'lucide-react';
import { useSyncStore, pullFromCloud } from '@/lib/supabase-sync';
import { QuickCaptureMark } from '@/components/icons/ChemicIcons';
import { useCareerStore } from '@/stores/useCareerStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { computeCycleTimeline } from '@/lib/budget-utils';
import { formatBillingDate, getDaysUntilDate } from '@/lib/utils';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandBar?: () => void;
}

export function Header({ onOpenMobileMenu, onOpenCommandBar }: HeaderProps) {
  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncErrorMessage = useSyncStore((s) => s.errorMessage);
  const careerItems = useCareerStore((s) => s.items);
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const budgetPlan = useFinanceStore((s) => s.budgetPlan);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const handleThemeEvent = (e: Event) => {
      const customDetail = (e as CustomEvent<{ dark?: boolean }>).detail;
      if (customDetail?.dark !== undefined) {
        setIsDark(customDetail.dark);
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    window.addEventListener('theme-changed', handleThemeEvent);
    return () => window.removeEventListener('theme-changed', handleThemeEvent);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('chemicvll_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('chemicvll_theme', 'light');
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: nextDark } }));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const urgentFollowUps = careerItems.filter((i) => {
    if (!i.next_follow_up_date || i.stage === 'rejected' || i.stage === 'offer') return false;
    const diff =
      (new Date(i.next_follow_up_date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000;
    return diff <= 2;
  });

  const urgentSubs = subscriptions.filter((sub) => {
    if (!sub.is_active) return false;
    return getDaysUntilDate(sub.next_billing_date) <= 3;
  });

  const isBudgetExpired = budgetPlan
    ? computeCycleTimeline(budgetPlan.cycleStartDate, budgetPlan.cycleEndDate).isExpired
    : false;

  const totalAlerts = urgentFollowUps.length + urgentSubs.length + (isBudgetExpired ? 1 : 0);

  const handleSyncClick = async () => {
    const success = await pullFromCloud();
    if (!success) {
      const msg = useSyncStore.getState().errorMessage;
      if (msg) {
        console.warn(`Supabase Sync Status: ${msg}`);
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
    <header className="sticky top-0 z-30 w-full h-16 bg-surface-container-lowest border-b border-outline flex items-center justify-between px-3.5 sm:px-6 lg:px-8 shrink-0 md:rounded-tl-3xl">
      {/* Left section: Hamburger (Mobile) + Search Bar (Cmd+K) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={onOpenMobileMenu}
          className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Mobile Search Button (Cmd+K) */}
        <button
          type="button"
          aria-label="Search"
          onClick={triggerCommand}
          className="sm:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container shrink-0"
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4 text-on-surface-variant" />
        </button>

        {/* Cmd+K Capsule Input */}
        <button
          type="button"
          onClick={triggerCommand}
          className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3.5 py-2 rounded-full border border-outline shadow-sm hover:border-zinc-400 transition cursor-pointer text-left max-w-[210px] md:max-w-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <Search className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
          <span className="text-xs text-on-surface-variant pr-2 truncate">
            Search system, files...
          </span>
          <kbd className="bg-surface-container-high text-on-surface text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ml-auto flex-shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Quick Action Charcoal Pill Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-quick-capture'))}
          className="hidden md:flex items-center gap-1.5 bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white px-3.5 py-2 rounded-full shadow-sm text-xs font-semibold active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          title="Quick Capture (Q)"
        >
          <QuickCaptureMark className="w-3.5 h-3.5" />
          <span>Quick Add</span>
          <kbd className="bg-white/15 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ml-0.5">
            Q
          </kbd>
        </button>
      </div>

      {/* Right section: Cloud Sync + Notif + Avatar Ferrel */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status Pill (Desktop/Tablet) */}
        <button
          type="button"
          onClick={handleSyncClick}
          className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline shadow-sm text-xs hover:bg-surface-container-high transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          title={
            syncStatus === 'synced'
              ? `Synced at ${lastSyncedAt || 'just now'} WIB. Click to sync now.`
              : syncStatus === 'offline'
              ? `Offline: ${syncErrorMessage || 'Click to retry'}`
              : 'Syncing in progress...'
          }
        >
          <div
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'syncing'
                ? 'bg-amber-500 animate-pulse'
                : syncStatus === 'synced'
                ? 'bg-emerald-600'
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

        {/* Warm Obsidian Dark Mode Toggle */}
        <button
          type="button"
          aria-label={isDark ? 'Switch to Warm Linen Light Mode' : 'Switch to Warm Obsidian Dark Mode'}
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container cursor-pointer shrink-0"
          title={isDark ? 'Light Mode (Warm Linen)' : 'Dark Mode (Warm Obsidian)'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-primary-container transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-on-surface-variant transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotifOpen}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container shrink-0"
          >
            <Bell className="w-4 h-4 text-on-surface-variant" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <>
              {/* Mobile dismiss backdrop */}
              <div
                className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                onClick={() => setIsNotifOpen(false)}
              />

              <div className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-surface-container-lowest border border-outline rounded-3xl shadow-xl p-3.5 z-50 space-y-2.5 text-xs max-h-[75vh] flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-outline shrink-0">
                  <span className="font-bold text-on-surface">Radar Notifikasi</span>
                  <span className="text-[11px] font-semibold tabular-nums text-on-surface-variant">
                    {totalAlerts} item
                  </span>
                </div>

                {totalAlerts === 0 ? (
                  <p className="text-on-surface-variant py-4 text-center">
                    Semua jadwal follow-up, tagihan, dan siklus gaji aman.
                  </p>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-[60vh]">
                    {isBudgetExpired && (
                      <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                        Siklus Payday Budget sudah selesai. Atur gajian baru di Vault.
                      </div>
                    )}
                    {urgentFollowUps.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-2xl bg-surface-container-low border border-outline text-on-surface"
                      >
                        Follow-up <strong>{item.entity_name}</strong> ({item.role_or_program})
                      </div>
                    ))}
                    {urgentSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                      >
                        <div>
                          Tagihan <strong>{sub.name}</strong> — Rp{' '}
                          <span className="tabular-nums font-semibold">
                            {sub.cost.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 tabular-nums">
                          Jatuh tempo: {formatBillingDate(sub.next_billing_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar with Mobile Sync Indicator & Lock */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-0.5">
          <div
            className="relative cursor-pointer"
            onClick={handleSyncClick}
            title={
              syncStatus === 'synced'
                ? 'Cloud Synced'
                : syncStatus === 'offline'
                ? 'Offline (Click to sync)'
                : 'Syncing...'
            }
          >
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs shadow-sm">
              F
            </div>
            {/* Mobile-only Mini Cloud Sync LED dot */}
            <span
              className={`sm:hidden absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface-container-lowest ${
                syncStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : syncStatus === 'synced'
                  ? 'bg-emerald-600'
                  : syncStatus === 'offline'
                  ? 'bg-zinc-400'
                  : 'bg-primary-container animate-pulse'
              }`}
            />
          </div>

          <span className="text-xs font-semibold text-on-surface hidden sm:inline">
            Ferrel
          </span>
          <button
            type="button"
            aria-label="Lock Workspace"
            onClick={() => window.dispatchEvent(new CustomEvent('personal_os_lock'))}
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container shrink-0"
            title="Lock Personal OS (Master PIN)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
