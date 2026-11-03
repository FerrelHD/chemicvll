'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CareerKanban } from '@/components/career/CareerKanban';
import { TaskManager } from '@/components/tasks/TaskManager';
import { FinanceManager } from '@/components/finance/FinanceManager';
import { DevMissionControl } from '@/components/dev/DevMissionControl';
import { DropzonePanel } from '@/components/dropzone/DropzonePanel';
import { NotesAndContentStudio } from '@/components/notes/NotesAndContentStudio';
import { CommandBar } from '@/components/cmd/CommandBar';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { Briefcase, CheckSquare, Wallet, Terminal, Clipboard, BookOpen } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('career');
  const [notice, setNotice] = useState<string | null>(null);

  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const wallets = useFinanceStore((state) => state.wallets);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const navItems = [
    { id: 'career', label: 'Karir & Magang', icon: Briefcase },
    { id: 'tasks', label: 'Tugas & Fokus', icon: CheckSquare },
    { id: 'finance', label: 'Keuangan', icon: Wallet },
    { id: 'dev', label: 'Dev Server', icon: Terminal },
    { id: 'dropzone', label: 'Dropzone', icon: Clipboard },
    { id: 'notes', label: 'Catatan & Konten', icon: BookOpen },
  ];

  // Quick summary counts
  const totalActiveCareer = careerItems.filter((i) => i.stage !== 'rejected' && i.stage !== 'offer').length;
  const totalDailyTasks = tasks.filter((t) => t.is_daily_focus && t.status !== 'done').length;
  const totalNetBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <div className="min-h-screen bg-canvas flex flex-col pb-20 md:pb-8">
      {/* Topbar */}
      <Header />

      {/* Global Command Bar modal */}
      <CommandBar onNavigate={setActiveTab} onShowNotice={showNotification} />

      {/* Floating Notice Toast */}
      {notice && (
        <div className="fixed top-16 right-4 z-40 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{notice}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Bento KPI Summary Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className="bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple text-left hover:border-zinc-300 transition"
          >
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Lamaran Aktif
            </span>
            <span className="text-xl font-bold text-appleText-primary mt-1 block">
              {totalActiveCareer}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className="bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple text-left hover:border-zinc-300 transition"
          >
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Daily Focus
            </span>
            <span className="text-xl font-bold text-amber-700 mt-1 block">
              {totalDailyTasks} Prioritas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className="col-span-2 sm:col-span-1 bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple text-left hover:border-zinc-300 transition"
          >
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Saldo Dompet
            </span>
            <span className="text-xl font-bold text-appleText-primary font-mono mt-1 block">
              Rp {totalNetBalance.toLocaleString('id-ID')}
            </span>
          </button>
        </section>

        {/* Desktop Module Navigation Tabs */}
        <div className="hidden md:flex items-center gap-6 border-b border-appleBorder pb-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 pb-2 transition-all ${
                  isActive
                    ? 'font-bold text-appleText-primary border-b-2 border-zinc-900'
                    : 'text-appleText-muted hover:text-appleText-primary font-normal'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module View */}
        <div className="pt-2">
          {activeTab === 'career' && <CareerKanban />}
          {activeTab === 'tasks' && <TaskManager />}
          {activeTab === 'finance' && <FinanceManager />}
          {activeTab === 'dev' && <DevMissionControl />}
          {activeTab === 'dropzone' && <DropzonePanel />}
          {activeTab === 'notes' && <NotesAndContentStudio />}
        </div>
      </main>

      {/* Mobile Bottom Navigation for PWA */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
