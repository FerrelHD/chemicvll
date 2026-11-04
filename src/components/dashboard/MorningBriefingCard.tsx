'use client';

import React, { useMemo } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useDevStore } from '@/stores/useDevStore';
import { getRadarStatus } from '@/lib/career-radar';
import {
  CheckCircle2,
  Briefcase,
  Terminal,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface MorningBriefingCardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickCapture?: () => void;
  onOpenCommand?: () => void;
}

export function MorningBriefingCard({
  onNavigate,
  onOpenQuickCapture,
  onOpenCommand,
}: MorningBriefingCardProps) {
  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const wallets = useFinanceStore((state) => state.wallets);
  const activeWalletId = useFinanceStore((state) => state.activeWalletId);
  const isPrivacyMode = useFinanceStore((state) => state.isPrivacyMode);
  const togglePrivacyMode = useFinanceStore((state) => state.togglePrivacyMode);
  const projects = useDevStore((state) => state.projects);

  // Time & Greeting
  const now = new Date();
  const hour = now.getHours();

  let greetingText = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) {
    greetingText = 'Selamat Siang';
  } else if (hour >= 15 && hour < 18) {
    greetingText = 'Selamat Sore';
  } else if (hour >= 18 || hour < 4) {
    greetingText = 'Selamat Malam';
  }

  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Memoized metrics for optimal rendering performance
  const { pendingTasks, dailyFocusTasks, highPriorityTasks } = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== 'done');
    return {
      pendingTasks: pending,
      dailyFocusTasks: pending.filter((t) => t.is_daily_focus),
      highPriorityTasks: pending.filter((t) => t.priority === 1),
    };
  }, [tasks]);

  const { urgentFollowUps, activeInterviews } = useMemo(() => {
    return {
      urgentFollowUps: careerItems.filter((i) => getRadarStatus(i).isUrgent),
      activeInterviews: careerItems.filter((i) => i.stage === 'interview'),
    };
  }, [careerItems]);

  const runningServers = useMemo(() => {
    return projects.filter((p) => p.serverState === 'running');
  }, [projects]);

  const activeWallet = useMemo(() => {
    return wallets.find((w) => w.id === activeWalletId) || wallets[0] || {
      name: 'Dompet Utama',
      balance: 0,
    };
  }, [wallets, activeWalletId]);

  const handleTriggerQuickCapture = () => {
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-capture'));
    }
  };

  return (
    <div className="relative rounded-3xl bg-surface-container-lowest border border-outline/40 shadow-bento p-5 sm:p-6 mb-6">
      <div className="relative z-10 flex flex-col gap-5">
        {/* Header Row: Greeting & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline/20">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              {greetingText}, <span className="text-primary-container">Ferrel</span>
            </h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {dateFormatted} • Siap mengeksekusi hari ini?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenCommand && (
              <button
                type="button"
                onClick={onOpenCommand}
                className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold px-3.5 py-2 rounded-full border border-outline/40 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-primary-container" />
                <span>Quick Action (⌘K)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTriggerQuickCapture}
              className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Quick Input (+)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Grid Capsules - Clean solid background without GPU blur stalls */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Capsule 1: Tasks Today */}
          <div
            onClick={() => onNavigate('tasks')}
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Tasks Hari Ini
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-bold text-on-surface">
                {pendingTasks.length}{' '}
                <span className="text-xs font-normal text-on-surface-variant">pending</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                {dailyFocusTasks.length > 0 ? (
                  <span className="text-amber-600 font-semibold">
                    ⭐ {dailyFocusTasks.length} fokus harian
                  </span>
                ) : highPriorityTasks.length > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    🔴 {highPriorityTasks.length} prioritas P1
                  </span>
                ) : (
                  'Inbox rapi & terkendali'
                )}
              </p>
            </div>
            <div className="flex items-center text-[10px] text-on-surface-variant group-hover:text-primary-container font-medium gap-1 pt-1.5 border-t border-outline/10">
              <span>Buka Task Manager</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Capsule 2: Career Follow-up */}
          <div
            onClick={() => onNavigate('career')}
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Career Radar
              </span>
              <Briefcase className="w-4 h-4 text-primary-container group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-bold text-on-surface">
                {urgentFollowUps.length}{' '}
                <span className="text-xs font-normal text-on-surface-variant">follow-up</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                {urgentFollowUps.length > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    ⚠️ {urgentFollowUps[0].entity_name} (&gt;5 hari)
                  </span>
                ) : activeInterviews.length > 0 ? (
                  <span className="text-primary-container font-semibold">
                    🎉 {activeInterviews.length} sesi interview
                  </span>
                ) : (
                  'Semua lamaran up to date'
                )}
              </p>
            </div>
            <div className="flex items-center text-[10px] text-on-surface-variant group-hover:text-primary-container font-medium gap-1 pt-1.5 border-t border-outline/10">
              <span>Cek Pipeline Karir</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Capsule 3: Dev Servers */}
          <div
            onClick={() => onNavigate('dev')}
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Dev Mission
              </span>
              <Terminal className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-bold text-on-surface">
                {runningServers.length}{' '}
                <span className="text-xs font-normal text-on-surface-variant">server</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                {runningServers.length > 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    🟢 {runningServers.map((p) => `:${p.default_port}`).join(', ')}
                  </span>
                ) : (
                  'Laptop relay standby'
                )}
              </p>
            </div>
            <div className="flex items-center text-[10px] text-on-surface-variant group-hover:text-primary-container font-medium gap-1 pt-1.5 border-t border-outline/10">
              <span>Mission Control</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Capsule 4: Wallet Balance */}
          <div
            onClick={() => onNavigate('finance')}
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider truncate">
                {activeWallet.name}
              </span>
              <button
                type="button"
                aria-label="Toggle Privacy"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePrivacyMode();
                }}
                className="text-on-surface-variant hover:text-on-surface p-0.5 rounded-full hover:bg-surface-container"
              >
                {isPrivacyMode ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-bold text-on-surface font-mono">
                {isPrivacyMode ? 'Rp •••••••' : `Rp ${activeWallet.balance.toLocaleString('id-ID')}`}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Dompet aktif tersinkron
              </p>
            </div>
            <div className="flex items-center text-[10px] text-on-surface-variant group-hover:text-primary-container font-medium gap-1 pt-1.5 border-t border-outline/10">
              <span>Buka Finansial</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
