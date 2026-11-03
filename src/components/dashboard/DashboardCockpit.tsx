'use client';

import React from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useDevStore } from '@/stores/useDevStore';
import {
  Briefcase,
  Wallet,
  CheckCircle2,
  Terminal,
  Calendar,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Send,
  PlusCircle,
  Video,
} from 'lucide-react';

interface DashboardCockpitProps {
  onNavigate: (tab: string) => void;
  onOpenCommand: () => void;
}

export function DashboardCockpit({ onNavigate, onOpenCommand }: DashboardCockpitProps) {
  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const wallets = useFinanceStore((state) => state.wallets);
  const projects = useDevStore((state) => state.projects);

  const activeCareerCount = careerItems.filter(
    (i) => i.stage !== 'rejected' && i.stage !== 'offer'
  ).length;
  const interviewCount = careerItems.filter((i) => i.stage === 'interview').length;

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const taskRatioPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const runningServers = projects.filter((p) => p.serverState === 'running').length;

  // Monthly cashflow capsule mock data (6 months)
  const cashflowMonths = [
    { month: 'Jun', in: 6.5, out: 3.2 },
    { month: 'Jul', in: 7.0, out: 4.1 },
    { month: 'Agt', in: 5.5, out: 3.8 },
    { month: 'Sep', in: 8.2, out: 4.5 },
    { month: 'Okt', in: 9.0, out: 5.2 },
    { month: 'Nov', in: 8.5, out: 4.0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Greeting & Cockpit Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Welcome Back, <span className="text-primary-container">Ferrel</span>
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[11px]">
              chemicv11
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Personal OS Cockpit — Sinkronisasi cloud, karir, dan produktivitas hari ini.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline shadow-sm text-xs text-on-surface font-medium">
            <Calendar className="w-3.5 h-3.5 text-primary-container" />
            <span>Hari ini</span>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline shadow-sm text-xs text-on-surface font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span>Focus Sprint #3</span>
          </div>

          <button
            type="button"
            onClick={onOpenCommand}
            className="flex items-center gap-2 bg-inverse-surface hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Quick Action (⌘K)</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Quick Stats Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Stat 1: Karir */}
        <div
          onClick={() => onNavigate('career')}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline shadow-bento hover:shadow-bentoHover cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Pipeline Karir
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">{activeCareerCount}</span>
              <span className="text-xs text-on-surface-variant font-medium">Lamaran Aktif</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-mono text-[10px] font-bold">
                {interviewCount} Interview
              </span>
              <span className="text-[11px] text-on-surface-variant">tahap lanjut</span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[11px] truncate">Buka Kanban Pelacak</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Stat 2: Keuangan */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline shadow-bento hover:shadow-bentoHover cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Saldo Terpantau
            </span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-on-surface-variant">Rp</span>
              <span className="text-2xl font-bold font-mono text-on-surface">
                {totalBalance.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-mono text-[10px] font-semibold">
                {wallets.length} Dompet Aktif
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Likuid
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[11px]">Buka Mutasi & Radar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Stat 3: Tugas & Fokus */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline shadow-bento hover:shadow-bentoHover cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Target Tugas Harian
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">
                {completedTasks}/{totalTasks}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">Tuntas</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${taskRatioPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-outline flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[11px]">{taskRatioPercent}% Selesai hari ini</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Stat 4: Dev Server */}
        <div
          onClick={() => onNavigate('dev')}
          className="bg-surface-container-lowest rounded-2xl p-5 border border-outline shadow-bento hover:shadow-bentoHover cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Active Dev Ports
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Terminal className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">
                {runningServers > 0 ? `${runningServers} Running` : 'Standby'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px]">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold">
                :3000
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold">
                :5432
              </span>
              <span className="text-on-surface-variant">Listening</span>
            </div>
          </div>

          <div className="pt-2 border-t border-outline flex items-center justify-between text-xs text-on-surface-variant group-hover:text-primary-container transition">
            <span className="text-[11px]">Buka Console & Runner</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Row 2: Cashflow Capsule Chart & Active Debit Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Module A: Cashflow Capsule Bars (Col span 7) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 border border-outline shadow-bento space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Arus Kas Bulanan (Capsule Chart)</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Perbandingan Pemasukan (Oranye) vs Pengeluaran (Arang) dalam juta Rupiah.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
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
          <div className="h-48 flex items-end justify-between gap-4 pt-4 px-2">
            {cashflowMonths.map((m, idx) => {
              const inHeight = `${(m.in / 10) * 100}%`;
              const outHeight = `${(m.out / 10) * 100}%`;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* In Bar */}
                    <div
                      style={{ height: inHeight }}
                      className="w-3.5 bg-primary-container rounded-full transition-all group-hover:brightness-110"
                      title={`In: Rp ${m.in}M`}
                    ></div>
                    {/* Out Bar */}
                    <div
                      style={{ height: outHeight }}
                      className="w-3.5 bg-inverse-surface/80 rounded-full transition-all group-hover:bg-inverse-surface"
                      title={`Out: Rp ${m.out}M`}
                    ></div>
                  </div>
                  <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Module B: Active Debit Card & Quick Action (Col span 5) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 border border-outline shadow-bento space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Kartu Aktif (Wallet Stack)</h3>
            <span className="text-[10px] font-mono uppercase bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-semibold">
              Primary Card
            </span>
          </div>

          {/* Realistic Virtual Card (Bank Jago / Jenius aesthetic) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#18181B] text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider text-purple-300 font-mono">
                JENIUS M-CARD
              </span>
              <CreditCard className="w-5 h-5 text-white/80" />
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-white/60 font-mono block">SALDO UTAMA</span>
              <span className="text-xl font-bold font-mono tracking-tight text-white block">
                Rp {totalBalance.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono text-white/70">
              <span>•••• 8492</span>
              <span>11/28</span>
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
              <span>Kirim Saldo</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Top Up Kas</span>
            </button>
          </div>
        </div>

      </div>

      {/* Row 3: Timeline Hari Ini & Agenda Interview */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline shadow-bento space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
            <h3 className="text-sm font-bold text-on-surface">Timeline & Agenda Terdekat Hari Ini</h3>
          </div>
          <span className="text-xs text-on-surface-variant font-mono">WIB Timezone</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Timeline Item 1: Interview */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/70 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                  INTERVIEW TECH LEAD
                </span>
                <span className="text-xs text-on-surface-variant font-mono">14:00 WIB</span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface">GovTech Edu • Fullstack Web Intern</h4>
              <p className="text-xs text-on-surface-variant">User Interview via Google Meet</p>
            </div>
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-inverse-surface text-white text-xs font-medium hover:bg-black transition flex-shrink-0"
            >
              <Video className="w-3 h-3" />
              <span>Buka Meet</span>
            </a>
          </div>

          {/* Timeline Item 2: Pomodoro Deep Work */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/70 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                  DEEP WORK WORKSTATION
                </span>
                <span className="text-xs text-on-surface-variant font-mono">16:30 WIB</span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface">Go Gin Backend & Supabase Realtime Setup</h4>
              <p className="text-xs text-on-surface-variant">Fokus 50 menit Sprint tanpa distraksi</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition flex-shrink-0"
            >
              Mulai Timer
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

