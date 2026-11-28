'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DashboardCockpit } from '@/components/dashboard/DashboardCockpit';
import { DailyBriefingModal } from '@/components/dashboard/DailyBriefingModal';
import { CareerKanban } from '@/components/career/CareerKanban';
import { TaskManager } from '@/components/tasks/TaskManager';
import { FinanceManager } from '@/components/finance/FinanceManager';
import { DevMissionControl } from '@/components/dev/DevMissionControl';
import { DropzonePanel } from '@/components/dropzone/DropzonePanel';
import { NotesAndContentStudio } from '@/components/notes/NotesAndContentStudio';
import { CommandBar } from '@/components/cmd/CommandBar';
import { QuickCaptureModal, QuickCaptureTab } from '@/components/layout/QuickCaptureModal';
import { PinGate } from '@/components/auth/PinGate';
import { useTaskStore } from '@/stores/useTaskStore';
import { toLocalDateKey } from '@/lib/budget-utils';
import { initSupabaseSync } from '@/lib/supabase-sync';
import { motion } from 'framer-motion';

const VALID_TABS = new Set([
  'dashboard',
  'career',
  'tasks',
  'finance',
  'dev',
  'dropzone',
  'notes',
]);

const VALID_QUICK_TABS = new Set<QuickCaptureTab>(['expense', 'task', 'drop']);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureTab, setQuickCaptureTab] = useState<QuickCaptureTab>('expense');
  const [rolledOverCount, setRolledOverCount] = useState(0);
  const executeDailyRollover = useTaskStore((state) => state.executeDailyRollover);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (!isInput && (e.key === 'q' || e.key === 'Q') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setQuickCaptureTab('expense');
        setIsQuickCaptureOpen(true);
      }
    };

    const handleCustomOpen = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: QuickCaptureTab }>).detail?.tab;
      setQuickCaptureTab(tab && VALID_QUICK_TABS.has(tab) ? tab : 'expense');
      setIsQuickCaptureOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-quick-capture', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-quick-capture', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    let hasDeepLink = false;
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const quickParam = params.get('quick') as QuickCaptureTab | null;

      if (tabParam && VALID_TABS.has(tabParam)) {
        setActiveTab(tabParam);
        hasDeepLink = true;
      }
      if (quickParam && VALID_QUICK_TABS.has(quickParam)) {
        setQuickCaptureTab(quickParam);
        setIsQuickCaptureOpen(true);
        hasDeepLink = true;
      }
      if (hasDeepLink) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    initSupabaseSync();

    try {
      const todayStr = toLocalDateKey();
      const lastDate = localStorage.getItem('personal_os_last_briefing');
      if (todayStr !== lastDate) {
        const res = executeDailyRollover(todayStr, lastDate);
        if (res.shouldBrief && !hasDeepLink) {
          setRolledOverCount(res.rolledOverCount);
          setIsBriefingOpen(true);
        }
      }
    } catch {
      // In case localStorage is blocked in private browsing
    }
  }, [executeDailyRollover]);

  const handleDismissBriefing = () => {
    try {
      const todayStr = toLocalDateKey();
      localStorage.setItem('personal_os_last_briefing', todayStr);
    } catch {
      // Ignore
    }
    setIsBriefingOpen(false);
  };

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleOpenCommand = () => {
    window.dispatchEvent(new CustomEvent('open-command-bar'));
  };

  return (
    <PinGate>
      <div className="flex flex-col md:flex-row h-[100dvh] w-full max-w-[100vw] bg-surface-container-low overflow-hidden font-sans">
      {/* 1. Collapsible Flex Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
      />

      {/* 2. Main Dashboard Canvas with Rounded Top-Left Corner */}
      <div className="flex-1 flex flex-col h-full min-w-0 max-w-full overflow-x-clip overflow-y-hidden bg-surface-container-lowest md:rounded-tl-3xl md:border-t md:border-l border-outline/50 shadow-[0_4px_24px_rgba(24,24,27,0.03)] relative">
        {/* Sticky Header pinned at top of canvas */}
        <Header
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onOpenCommandBar={handleOpenCommand}
        />

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto overflow-x-clip w-full max-w-full relative z-20 scroll-container">
          <main className="p-3.5 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full max-w-full overflow-x-clip pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-full overflow-x-clip"
            >
              {activeTab === 'dashboard' && (
                <DashboardCockpit
                  onNavigate={setActiveTab}
                  onOpenCommand={handleOpenCommand}
                />
              )}
              {activeTab === 'career' && <CareerKanban />}
              {activeTab === 'tasks' && <TaskManager />}
              {activeTab === 'finance' && <FinanceManager />}
              {activeTab === 'dev' && <DevMissionControl />}
              {activeTab === 'dropzone' && <DropzonePanel />}
              {activeTab === 'notes' && <NotesAndContentStudio />}
            </motion.div>
          </main>
        </div>

        {/* Mobile Bottom Navigation (PWA friendly) */}
        <MobileNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        />
      </div>

      {/* Global Modals & Notifications */}
      <CommandBar onNavigate={setActiveTab} onShowNotice={showNotification} />
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onNavigate={setActiveTab}
        onShowNotice={showNotification}
        initialTab={quickCaptureTab}
      />
      <DailyBriefingModal
        isOpen={isBriefingOpen}
        rolledOverCount={rolledOverCount}
        onDismiss={handleDismissBriefing}
        onNavigate={setActiveTab}
      />
      {notice && (
        <div className="fixed top-[4.5rem] inset-x-3 sm:inset-x-auto sm:top-20 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-sm bg-inverse-surface dark:bg-surface-container-highest text-white dark:text-on-surface text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-outline/30 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-primary-container shrink-0"></span>
          <span className="truncate">{notice}</span>
        </div>
      )}
    </div>
    </PinGate>
  );
}
