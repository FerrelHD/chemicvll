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
import { useTaskStore } from '@/stores/useTaskStore';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [rolledOverCount, setRolledOverCount] = useState(0);
  const executeDailyRollover = useTaskStore((state) => state.executeDailyRollover);

  useEffect(() => {
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
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* 1. Persistent Left Sidebar (Desktop) / Slide-over Drawer (Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Layout Container (Offset by Collapsed Sidebar on lg screens) */}
      <div className="lg:pl-[72px] flex flex-col min-h-screen">
        
        {/* Sticky Header Bar */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCommandBar={handleOpenCommand}
        />

        {/* Floating Toast Notification */}
        {notice && (
          <div className="fixed top-20 right-6 z-50 bg-inverse-surface text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-outline/30 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span>{notice}</span>
          </div>
        )}

        {/* Global Command Bar Modal */}
        <CommandBar onNavigate={setActiveTab} onShowNotice={showNotification} />

        {/* Automated Daily Morning Briefing Modal */}
        <DailyBriefingModal
          isOpen={isBriefingOpen}
          rolledOverCount={rolledOverCount}
          onDismiss={handleDismissBriefing}
          onNavigate={setActiveTab}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full pt-20 px-4 md:px-8 pb-24 lg:pb-12 max-w-7xl">
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

        {/* 3. Mobile Bottom Navigation (PWA friendly) */}
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
