'use client';

import React from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useDevStore } from '@/stores/useDevStore';
import { getRadarStatus } from '@/lib/career-radar';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CheckCircle2,
  Briefcase,
  Terminal,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface MorningBriefingCardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickCapture?: () => void;
}

export function MorningBriefingCard({
  onNavigate,
  onOpenQuickCapture,
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
  let GreetingIcon = Sunrise;
  let greetingColor = 'text-amber-500';

  if (hour >= 11 && hour < 15) {
    greetingText = 'Selamat Siang';
    GreetingIcon = Sun;
    greetingColor = 'text-orange-500';
  } else if (hour >= 15 && hour < 18) {
    greetingText = 'Selamat Sore';
    GreetingIcon = Sunset;
    greetingColor = 'text-amber-600';
  } else if (hour >= 18 || hour < 4) {
    greetingText = 'Selamat Malam';
    GreetingIcon = Moon;
    greetingColor = 'text-indigo-400';
  }

  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Task metrics
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const dailyFocusTasks = pendingTasks.filter((t) => t.is_daily_focus);
  const highPriorityTasks = pendingTasks.filter((t) => t.priority === 1);

  // Career metrics
  const urgentFollowUps = careerItems.filter((i) => getRadarStatus(i).isUrgent);
  const activeInterviews = careerItems.filter((i) => i.stage === 'interview');

  // Dev metrics
  const runningServers = projects.filter((p) => p.serverState === 'running');

  // Finance metric
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0] || {
    name: 'Dompet Utama',
    balance: 0,
  };

  const handleTriggerQuickCapture = () => {
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-capture'));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container border border-outline/50 shadow-bento p-5 sm:p-6 mb-6">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header Row: Greeting & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-container-high border border-outline/30 flex items-center justify-center shadow-xs">
              <GreetingIcon className={`w-5 h-5 ${greetingColor}`} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
                <span>{greetingText},</span>
                <span className="text-primary-container">Ferrel</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-fixed/60 text-primary-container font-mono font-semibold">
                  Standup
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {dateFormatted} • Siap mengeksekusi hari ini?
              </p>
            </div>
          </div>

          {/* Quick Capture Floating Pill Button */}
          <button
            type="button"
            onClick={handleTriggerQuickCapture}
            className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm shadow-primary/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Quick Input (+)</span>
          </button>
        </div>

        {/* 4 Summary Grid Capsules */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Capsule 1: Tasks Today */}
          <div
            onClick={() => onNavigate('tasks')}
            className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
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
            className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
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
            className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
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
            className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-3.5 border border-outline/30 hover:border-primary-container/40 transition-all cursor-pointer group flex flex-col justify-between"
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
                  <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </button>
            </div>
            <div className="my-2">
              <div className="text-lg sm:text-xl font-bold text-on-surface truncate">
                {isPrivacyMode ? 'Rp •••••••' : `Rp ${activeWallet.balance.toLocaleString('id-ID')}`}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                {wallets.length} dompet terdaftar
              </p>
            </div>
            <div className="flex items-center text-[10px] text-on-surface-variant group-hover:text-primary-container font-medium gap-1 pt-1.5 border-t border-outline/10">
              <span>Buka Finance Vault</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
