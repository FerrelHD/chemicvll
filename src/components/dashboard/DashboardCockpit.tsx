'use client';

import React, { useState } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useDevStore } from '@/stores/useDevStore';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import { MorningBriefingCard } from './MorningBriefingCard';
import {
  PipelineMark,
  VaultMark,
  FocusMark,
  ConsoleMark,
  RelayMark,
} from '@/components/icons/ChemicIcons';
import {
  ArrowRight,
  TrendingUp,
  CreditCard,
  Send,
  PlusCircle,
  Video,
  BarChart3,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  Monitor,
  ExternalLink,
  X,
  Calendar,
} from 'lucide-react';
import { computeBudgetProgress } from '@/lib/budget-utils';
import { getUnifiedAgenda } from '@/lib/agenda-utils';

interface DashboardCockpitProps {
  onNavigate: (tab: string) => void;
  onOpenCommand: () => void;
}

export function DashboardCockpit({ onNavigate, onOpenCommand }: DashboardCockpitProps) {
  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const wallets = useFinanceStore((state) => state.wallets);
  const activeWalletId = useFinanceStore((state) => state.activeWalletId);
  const transactions = useFinanceStore((state) => state.transactions);
  const subscriptions = useFinanceStore((state) => state.subscriptions);
  const budgetPlan = useFinanceStore((state) => state.budgetPlan);
  const isPrivacyMode = useFinanceStore((state) => state.isPrivacyMode);
  const togglePrivacyMode = useFinanceStore((state) => state.togglePrivacyMode);
  const projects = useDevStore((state) => state.projects);
  const dropzoneItems = useDropzoneStore((state) => state.items);
  const deleteDropzoneItem = useDropzoneStore((state) => state.deleteItem);
  const addTask = useTaskStore((state) => state.addTask);
  const addCareerItem = useCareerStore((state) => state.addItem);

  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const budgetProgress = React.useMemo(() => {
    if (!budgetPlan) return null;
    return computeBudgetProgress(budgetPlan, transactions);
  }, [budgetPlan, transactions]);

  const unifiedAgenda = React.useMemo(() => {
    return getUnifiedAgenda(careerItems, subscriptions, tasks);
  }, [careerItems, subscriptions, tasks]);

  const recentDrops = React.useMemo(() => {
    return [...dropzoneItems]
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      .slice(0, 3);
  }, [dropzoneItems]);

  const openQuickTab = (tab: 'expense' | 'task' | 'drop') => {
    window.dispatchEvent(new CustomEvent('open-quick-capture', { detail: { tab } }));
  };

  const flashFeedback = (key: string) => {
    setFeedbackId(key);
    setTimeout(() => setFeedbackId((prev) => (prev === key ? null : prev)), 1500);
  };

  const handleCopyDrop = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      flashFeedback(`copy-${id}`);
    } catch {
      // Clipboard blocked in non-secure context
    }
  };

  const handlePromoteDropToTask = (id: string, content: string) => {
    const cleanTitle = content.replace(/\s+/g, ' ').trim().slice(0, 140);
    addTask(cleanTitle, 2, false);
    flashFeedback(`task-${id}`);
  };

  const handlePromoteDropToCareer = (id: string, content: string, type: 'text' | 'link' | 'code') => {
    const isLink = type === 'link' || /^https?:\/\//i.test(content.trim());
    let entity = 'New Opportunity';
    if (isLink) {
      try {
        entity = new URL(content.trim()).hostname.replace(/^www\./, '');
      } catch {
        entity = 'Saved Link';
      }
    } else {
      entity = content.trim().slice(0, 60);
    }

    addCareerItem({
      entity_name: entity,
      role_or_program: 'Review from Dropzone',
      category: 'internship',
      stage: 'wishlist',
      applied_date: null,
      deadline: null,
      platform_source: 'Dropzone',
      work_type: 'onsite',
      location: null,
      resume_version: null,
      stipend_or_salary: null,
      contact_person: null,
      next_follow_up_date: null,
      portal_url: isLink ? content.trim() : null,
      notes: isLink ? null : content,
    });
    flashFeedback(`career-${id}`);
  };

  const activeCareerCount = careerItems.filter(
    (i) => i.stage !== 'rejected' && i.stage !== 'offer'
  ).length;
  const interviewCount = careerItems.filter((i) => i.stage === 'interview').length;

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const activeWallet = wallets.find((w) => w.id === activeWalletId) || wallets[0];

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const taskRatioPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const runningServers = projects.filter((p) => p.serverState === 'running').length;

  // Monthly cashflow calculation from real transactions
  const { cashflowMonths, maxVal } = React.useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: monthNames[d.getMonth()],
      };
    });

    const months = last6Months.map((m) => {
      const txInMonth = transactions.filter((t) => {
        const td = new Date(t.transaction_date);
        return td.getFullYear() === m.year && td.getMonth() === m.monthIndex;
      });
      const income = txInMonth.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = txInMonth.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return {
        month: m.label,
        in: income / 1_000_000,
        out: expense / 1_000_000,
        rawIn: income,
        rawOut: expense,
      };
    });

    const max = Math.max(1, ...months.map((m) => Math.max(m.in, m.out)));
    return { cashflowMonths: months, maxVal: max };
  }, [transactions]);

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Morning Briefing & Unified Header */}
      <MorningBriefingCard onNavigate={onNavigate} onOpenCommand={onOpenCommand} />

      {/* Safe-to-Spend Daily Burn Rate Meter (When Payday budget is active) */}
      {budgetProgress && (
        <div
          onClick={() => onNavigate('finance')}
          className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                budgetProgress.remainingToday >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-on-surface">Safe-to-Spend Hari Ini</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-semibold text-on-surface-variant tabular-nums">
                  {budgetProgress.timeline.daysRemaining} hari ke gajian
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                Jatah harian:{' '}
                <span className="font-semibold text-on-surface tabular-nums">
                  Rp {budgetProgress.dailyAllowanceToday.toLocaleString('id-ID')}
                </span>{' '}
                • Terpakai hari ini:{' '}
                <span className="tabular-nums font-medium">
                  Rp {budgetProgress.todaySpent.toLocaleString('id-ID')}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-outline/20">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Sisa Jajan Aman
              </span>
              <span
                className={`text-base sm:text-lg font-bold font-sans tabular-nums ${
                  budgetProgress.remainingToday >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isPrivacyMode
                  ? 'Rp •••••••'
                  : `Rp ${budgetProgress.remainingToday.toLocaleString('id-ID')}`}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary-container group-hover:translate-x-1 transition" />
          </div>
        </div>
      )}

      {/* Mobile 1-Tap Action Strip (hidden on desktop) */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => openQuickTab('expense')}
          className="flex items-center justify-center gap-1 min-h-[44px] py-2 px-1.5 rounded-2xl bg-inverse-surface dark:bg-primary-container text-white text-[11px] font-semibold shadow-sm active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <PlusCircle className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span className="truncate">Jajan</span>
        </button>
        <button
          type="button"
          onClick={() => openQuickTab('task')}
          className="flex items-center justify-center gap-1 min-h-[44px] py-2 px-1.5 rounded-2xl bg-surface-container-lowest border border-outline/40 text-on-surface text-[11px] font-semibold active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <PlusCircle className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span className="truncate">Task</span>
        </button>
        <button
          type="button"
          onClick={() => openQuickTab('drop')}
          className="flex items-center justify-center gap-1 min-h-[44px] py-2 px-1.5 rounded-2xl bg-surface-container-lowest border border-outline/40 text-on-surface text-[11px] font-semibold active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <PlusCircle className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span className="truncate">Drop</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('dropzone')}
          className="flex items-center justify-center gap-1 min-h-[44px] py-2 px-1.5 rounded-2xl bg-primary-fixed/50 border border-primary-container/25 text-on-primary-fixed-variant text-[11px] font-semibold active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          <RelayMark active className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Vault</span>
        </button>
      </div>

      {/* Cross-Device Dropzone Handoff Strip */}
      {recentDrops.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <RelayMark active className="w-4 h-4 text-primary-container shrink-0" />
              <span className="text-xs font-bold text-on-surface truncate">
                Tangkapan Terbaru (Dropzone)
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-surface-container text-[10px] font-bold text-on-surface-variant tabular-nums shrink-0">
                {dropzoneItems.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dropzone')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-primary-container transition shrink-0"
            >
              <span>Buka Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-outline/20 max-h-[240px] overflow-y-auto scroll-container bento-fade-mask">
            {recentDrops.map((item) => {
              const safeHref = /^https?:\/\//i.test(item.content.trim())
                ? item.content.trim()
                : null;
              return (
                <div
                  key={item.id}
                  className="py-2 first:pt-0.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container text-[10px] font-semibold text-on-surface-variant shrink-0"
                      title={`Dari ${item.device_source}`}
                    >
                      {item.device_source === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-primary-container" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      <span>{item.device_source === 'mobile' ? 'HP' : 'PC'}</span>
                    </span>
                    {safeHref ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-on-surface hover:text-primary-container truncate inline-flex items-center gap-1 min-w-0"
                      >
                        <span className="truncate">{item.content}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-on-surface-variant" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-on-surface truncate">
                        {item.content}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyDrop(item.id, item.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-[10px] font-semibold text-on-surface transition"
                    >
                      {feedbackId === `copy-${item.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromoteDropToTask(item.id, item.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-[10px] font-semibold text-on-surface transition"
                    >
                      {feedbackId === `task-${item.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>→ Task</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromoteDropToCareer(item.id, item.content, item.type)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-[10px] font-semibold text-on-surface transition"
                    >
                      {feedbackId === `career-${item.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <span>→ Career</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDropzoneItem(item.id)}
                      className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition"
                      title="Hapus dari Dropzone"
                      aria-label="Hapus dari Dropzone"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 1: 4 Quick Stats Bento Cards (Compact 2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Stat 1: Karir */}
        <div
          onClick={() => onNavigate('career')}
          className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-outline/30 hover:border-outline/60 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">
              Career Pipeline
            </span>
            <PipelineMark active className="w-[18px] h-[18px] text-on-surface shrink-0" />
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl xl:text-2xl font-bold text-on-surface font-sans tabular-nums">
                {activeCareerCount}
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium truncate">Active Applications</span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed-variant tabular-nums text-[10px] font-bold whitespace-nowrap shrink-0">
                {interviewCount} Interview
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant whitespace-nowrap shrink-0 hidden sm:inline">advanced stage</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-2.5 border-t border-outline/20 flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[10px] sm:text-[11px] truncate">Open Pipeline</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

        {/* Stat 2: Keuangan */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-outline/30 hover:border-outline/60 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">
              Tracked Balance
            </span>
            <VaultMark active className="w-[18px] h-[18px] text-on-surface shrink-0" />
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                {isPrivacyMode ? (
                  <span className="text-base sm:text-xl xl:text-2xl font-bold font-sans tabular-nums text-on-surface">
                    Rp •••••••
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant">Rp</span>
                    <span className="text-base sm:text-xl xl:text-2xl font-bold font-sans tabular-nums text-on-surface truncate">
                      {totalBalance.toLocaleString('id-ID')}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePrivacyMode();
                }}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container text-on-surface tabular-nums text-[10px] font-semibold whitespace-nowrap shrink-0">
                {wallets.length} Wallets
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5 whitespace-nowrap shrink-0">
                <TrendingUp className="w-3 h-3 shrink-0" /> Liquid
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-2.5 border-t border-outline/20 flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[10px] sm:text-[11px] truncate">Open Ledger</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

        {/* Stat 3: Tugas & Fokus */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-outline/30 hover:border-outline/60 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">
              Daily Target
            </span>
            <FocusMark active className="w-[18px] h-[18px] text-on-surface shrink-0" />
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-on-surface font-sans tabular-nums">
                {completedTasks}/{totalTasks}
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium truncate">Completed</span>
            </div>
            <div className="mt-1.5 sm:mt-2">
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${taskRatioPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-2 sm:pt-2.5 border-t border-outline/20 flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[10px] sm:text-[11px] truncate">
              {completedTasks === totalTasks && totalTasks > 0
                ? 'All Done'
                : `${taskRatioPercent}% Today`}
            </span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

        {/* Stat 4: Dev Server */}
        <div
          onClick={() => onNavigate('dev')}
          className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-outline/30 hover:border-outline/60 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider truncate">
              Dev Ports
            </span>
            <ConsoleMark active className="w-[18px] h-[18px] text-on-surface shrink-0" />
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-on-surface font-sans">
                {runningServers > 0 ? `${runningServers} Running` : 'Standby'}
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 font-mono text-[10px]">
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold whitespace-nowrap shrink-0">
                :3000
              </span>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold whitespace-nowrap shrink-0 hidden sm:inline">
                :5432
              </span>
              <span className="text-on-surface-variant whitespace-nowrap shrink-0 text-[10px]">
                {runningServers > 0 ? 'Listening' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-2.5 border-t border-outline/20 flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[10px] sm:text-[11px] truncate">Open Console</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

      </div>

      {/* Row 2: Cashflow Capsule Chart & Active Debit Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Module A: Cashflow Capsule Bars (Col span 7) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Monthly Cashflow (Capsule Chart)</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Comparison of Income (Orange) vs Expenses (Charcoal) in million IDR.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                <span className="text-primary-container font-semibold">In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-inverse-surface dark:bg-zinc-600"></span>
                <span className="text-on-surface-variant">Out</span>
              </div>
            </div>
          </div>

          {/* Capsule Chart Graphic */}
          {transactions.length === 0 ? (
            <div className="h-44 sm:h-48 flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline/40 text-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <BarChart3 className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-on-surface">No transaction history yet</p>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Cashflow chart will automatically populate as you record income or expense transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('finance')}
                className="mt-1 px-4 py-1.5 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white text-xs font-semibold shadow-sm transition"
              >
                Record First Transaction
              </button>
            </div>
          ) : (
            <div className="h-44 sm:h-48 flex items-end justify-between gap-1.5 sm:gap-4 pt-3 sm:pt-4 px-1 sm:px-2">
              {cashflowMonths.map((m, idx) => {
                const inHeight = `${Math.max(4, (m.in / maxVal) * 100)}%`;
                const outHeight = `${Math.max(4, (m.out / maxVal) * 100)}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group relative">
                    {/* Floating Interactive Tooltip */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 flex flex-col items-center group-hover:-translate-y-1">
                      <div className="bg-zinc-900 dark:bg-zinc-950 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl border border-white/10 dark:border-primary-container/30 whitespace-nowrap flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-3 font-semibold pb-1 border-b border-white/15">
                          <span className="font-bold text-primary-container">{m.month}</span>
                          <span className={`tabular-nums ${m.rawIn >= m.rawOut ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.rawIn >= m.rawOut ? '+' : ''}Rp {(m.rawIn - m.rawOut).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0" />
                          <span className="text-white/80">In:</span>
                          <span className="font-medium text-white">Rp {m.rawIn.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                          <span className="text-white/80">Out:</span>
                          <span className="font-medium text-white">Rp {m.rawOut.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-950 rotate-45 -mt-1" />
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* In Bar */}
                      <div
                        style={{ height: inHeight }}
                        className="w-2.5 sm:w-3.5 bg-primary-container rounded-full transition-all duration-300 group-hover:brightness-110 group-hover:scale-y-[1.03]"
                      ></div>
                      {/* Out Bar */}
                      <div
                        style={{ height: outHeight }}
                        className="w-2.5 sm:w-3.5 bg-inverse-surface/80 dark:bg-zinc-700/80 rounded-full transition-all duration-300 group-hover:bg-inverse-surface dark:group-hover:bg-zinc-600 group-hover:scale-y-[1.03]"
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-variant font-medium group-hover:text-on-surface transition-colors">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Module B: Active Debit Card & Quick Action (Col span 5) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Active Card (Wallet Stack)</h3>
            <span className="text-[10px] font-mono uppercase bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-semibold">
              Primary Card
            </span>
          </div>

          {/* Realistic Virtual Card */}
          <div
            className="p-4 sm:p-5 rounded-2xl text-white shadow-none border border-white/10 space-y-3.5 sm:space-y-4"
            style={{
              background: activeWallet?.color
                ? `linear-gradient(135deg, ${activeWallet.color}, #18181B)`
                : 'linear-gradient(135deg, #0066CC, #003E8A)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider text-white/95 uppercase">
                {activeWallet?.name || 'BANK BCA'}
              </span>
              <CreditCard className="w-5 h-5 text-white/90" />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/80 block uppercase font-medium tracking-wider">
                  {activeWallet?.card_label || 'MAIN BALANCE'}
                </span>
                <span className="text-xl font-bold tabular-nums tracking-tight text-white block">
                  {isPrivacyMode ? 'Rp •••••••' : `Rp ${(activeWallet?.balance || 0).toLocaleString('id-ID')}`}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs tabular-nums text-white/90">
              <span>•••• {activeWallet?.account_number || '8492'}</span>
              <span>{activeWallet?.expiry || '11/28'}</span>
            </div>
          </div>

          {/* Quick Transaction Action Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5 text-primary-container" />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Top Up</span>
            </button>
          </div>
        </div>

      </div>

      {/* Row 3: Unified Daily Agenda & Schedule */}
      <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container shrink-0"></span>
            <h3 className="text-sm font-bold text-on-surface truncate">
              Unified Agenda &amp; Upcoming Milestones
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant tabular-nums shrink-0">
              {unifiedAgenda.length} agenda
            </span>
          </div>
          <span className="text-xs text-on-surface-variant font-mono whitespace-nowrap shrink-0">
            WIB Timezone
          </span>
        </div>

        {unifiedAgenda.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low border border-dashed border-outline/70 text-center flex flex-col items-center justify-center gap-2">
            <Calendar className="w-6 h-6 text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface">Tidak ada agenda penting terjadwal</p>
            <p className="text-[11px] text-on-surface-variant">
              Jadwal interview, deadline coding test, tagihan langganan H-3, dan task P1 akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
            {unifiedAgenda.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline/70 flex flex-col justify-between gap-3 min-h-[120px]"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-xs text-on-surface-variant tabular-nums font-medium whitespace-nowrap shrink-0">
                      {item.isToday ? 'Hari Ini' : item.dateKey}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-on-surface leading-snug truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{item.subtitle}</p>
                </div>
                <div className="flex items-center justify-end pt-1">
                  {item.actionUrl ? (
                    <a
                      href={item.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-inverse-surface dark:bg-primary-container text-white text-xs font-medium hover:bg-black dark:hover:bg-primary transition active:scale-95 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Open Meet</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate(item.moduleTab)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-semibold transition"
                    >
                      <span>Buka Detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

