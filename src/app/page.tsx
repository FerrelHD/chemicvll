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
import { CommandBar } from '@/components/cmd/CommandBar';
import { PinGate } from '@/components/auth/PinGate';
import { useTaskStore } from '@/stores/useTaskStore';
import { initSupabaseSync } from '@/lib/supabase-sync';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [rolledOverCount, setRolledOverCount] = useState(0);
  const executeDailyRollover = useTaskStore((state) => state.executeDailyRollover);

  useEffect(() => {
    initSupabaseSync();

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDate = localStorage.getItem('personal_os_last_briefing');
      if (todayStr !== lastDate) {
        const res = executeDailyRollover(todayStr, lastDate);
        if (res.shouldBrief) {
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
      const todayStr = new Date().toISOString().split('T')[0];
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
      <div className="flex flex-col md:flex-row h-screen w-full bg-surface-container-low overflow-hidden font-sans">
      {/* 1. Collapsible Flex Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
      />

      {/* 2. Main Dashboard Canvas with Rounded Top-Left Corner */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-surface-container-lowest md:rounded-tl-3xl border-t border-l border-outline/50 shadow-[0_4px_24px_rgba(24,24,27,0.03)] relative">
        {/* Sticky Header pinned at top of canvas */}
        <Header
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onOpenCommandBar={handleOpenCommand}
        />

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto w-full">
          <main className="p-4 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
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
          </main>
        </div>

        {/* Mobile Bottom Navigation (PWA friendly) */}
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Global Modals & Notifications */}
      <CommandBar onNavigate={setActiveTab} onShowNotice={showNotification} />
      <DailyBriefingModal
        isOpen={isBriefingOpen}
        rolledOverCount={rolledOverCount}
        onDismiss={handleDismissBriefing}
        onNavigate={setActiveTab}
      />
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-inverse-surface text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-outline/30 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          <span>{notice}</span>
        </div>
      )}
    </div>
    </PinGate>
  );
}
