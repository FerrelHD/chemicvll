'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DashboardCockpit } from '@/components/dashboard/DashboardCockpit';
import { CareerKanban } from '@/components/career/CareerKanban';
import { TaskManager } from '@/components/tasks/TaskManager';
import { FinanceManager } from '@/components/finance/FinanceManager';
import { DevMissionControl } from '@/components/dev/DevMissionControl';
import { DropzonePanel } from '@/components/dropzone/DropzonePanel';
import { CommandBar } from '@/components/cmd/CommandBar';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

      {/* 2. Main Layout Container (Offset by Sidebar on lg screens) */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        
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
