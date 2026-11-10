'use client';

import React from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useDevStore } from '@/stores/useDevStore';
import { MorningBriefingCard } from './MorningBriefingCard';
import {
  Briefcase,
  Wallet,
  CheckCircle2,
  Terminal,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Send,
  PlusCircle,
  Video,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  const isPrivacyMode = useFinanceStore((state) => state.isPrivacyMode);
  const togglePrivacyMode = useFinanceStore((state) => state.togglePrivacyMode);
  const projects = useDevStore((state) => state.projects);

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
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low group-hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-container" />
            </div>
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-on-surface font-sans">{activeCareerCount}</span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium truncate">Active Applications</span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
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
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low group-hover:bg-surface-container flex items-center justify-center text-primary-container transition-colors shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-container" />
            </div>
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                {isPrivacyMode ? (
                  <span className="text-base sm:text-2xl font-bold font-mono text-on-surface">
                    Rp •••••••
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant">Rp</span>
                    <span className="text-base sm:text-2xl font-bold font-mono text-on-surface truncate">
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
                className="p-1 sm:p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition shrink-0"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-mono text-[10px] font-semibold whitespace-nowrap shrink-0">
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
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low group-hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
          </div>

          <div className="my-2 sm:my-3">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-on-surface font-sans">
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
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-container-low group-hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors shrink-0">
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
            </div>
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
                <span>In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-inverse-surface"></span>
                <span>Out</span>
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
                className="mt-1 px-4 py-1.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition"
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
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* In Bar */}
                      <div
                        style={{ height: inHeight }}
                        className="w-2.5 sm:w-3.5 bg-primary-container rounded-full transition-all group-hover:brightness-110"
                        title={`In: Rp ${m.rawIn.toLocaleString('id-ID')}`}
                      ></div>
                      {/* Out Bar */}
                      <div
                        style={{ height: outHeight }}
                        className="w-2.5 sm:w-3.5 bg-inverse-surface/80 rounded-full transition-all group-hover:bg-inverse-surface"
                        title={`Out: Rp ${m.rawOut.toLocaleString('id-ID')}`}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-variant font-medium">
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
            className="p-4 sm:p-5 rounded-2xl text-white shadow-[0_8px_24px_rgba(0,102,204,0.2)] space-y-3.5 sm:space-y-4"
            style={{
              background: activeWallet?.color
                ? `linear-gradient(135deg, ${activeWallet.color}, #18181B)`
                : 'linear-gradient(135deg, #0066CC, #003E8A)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider text-white/95 font-mono uppercase">
                {activeWallet?.name || 'BANK BCA'}
              </span>
              <CreditCard className="w-5 h-5 text-white/90" />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/80 font-mono block uppercase">
                  {activeWallet?.card_label || 'MAIN BALANCE'}
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-white block">
                  {isPrivacyMode ? 'Rp •••••••' : `Rp ${(activeWallet?.balance || 0).toLocaleString('id-ID')}`}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition focus:outline-none"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono text-white/90">
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

      {/* Row 3: Timeline Hari Ini & Agenda Interview */}
      <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
            <h3 className="text-sm font-bold text-on-surface">Today&apos;s Schedule &amp; Up Next</h3>
          </div>
          <span className="text-xs text-on-surface-variant font-mono">WIB Timezone</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Timeline Item 1: Interview */}
          {careerItems.some((i) => i.stage === 'interview') ? (
            (() => {
              const interviewItem = careerItems.find((i) => i.stage === 'interview')!;
              return (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/70 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold whitespace-nowrap shrink-0">
                        ADVANCED INTERVIEW
                      </span>
                      {interviewItem.next_follow_up_date && (
                        <span className="text-xs text-on-surface-variant font-mono">
                          {interviewItem.next_follow_up_date}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-on-surface">
                      {interviewItem.entity_name} • {interviewItem.role_or_program}
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      {interviewItem.notes || 'Technical interview & CV screening prep'}
                    </p>
                  </div>
                  {interviewItem.portal_url && (
                    <a
                      href={interviewItem.portal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-inverse-surface text-white text-xs font-medium hover:bg-black transition flex-shrink-0"
                    >
                      <Video className="w-3 h-3" />
                      <span>Open Meet</span>
                    </a>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-dashed border-outline/70 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  No interviews scheduled
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Record new applications or update pipeline status to interview.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('career')}
                className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-semibold transition"
              >
                + Application
              </button>
            </div>
          )}

          {/* Timeline Item 2: Pomodoro Deep Work / Priority Task */}
          {tasks.some((t) => t.status !== 'done') ? (
            (() => {
              const activeTask = tasks.find((t) => t.is_daily_focus && t.status !== 'done') || tasks.find((t) => t.status !== 'done')!;
              return (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/70 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold whitespace-nowrap shrink-0">
                        P{activeTask.priority} DEEP WORK
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono whitespace-nowrap shrink-0">Daily Priority</span>
                    </div>
                    <h4 className="text-sm font-semibold text-on-surface">{activeTask.title}</h4>
                    <p className="text-xs text-on-surface-variant">25-minute sprint with zero distraction</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-semibold transition flex-shrink-0"
                  >
                    Start Timer
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-dashed border-outline/70 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  No active focus tasks running
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Add today&apos;s priority target in the Tasks &amp; Focus module.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-semibold transition"
              >
                + Task
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

