'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Zap,
  Flame,
  Plus,
  Trash2,
  Star,
  Headphones,
  Calendar,
  X,
} from 'lucide-react';

export function TaskManager() {
  const { tasks, addTask, toggleDone, toggleDailyFocus, deleteTask } = useTaskStore();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [ambientSound, setAmbientSound] = useState<'off' | 'lofi' | 'brown' | 'rain'>('off');

  // Focus Timer state (25 minutes default)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(3);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      setSessionsCompleted((prev) => prev + 1);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle, newPriority);
    setNewTitle('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'p1') return t.priority === 1;
    if (filterMode === 'p2') return t.priority === 2;
    if (filterMode === 'p3') return t.priority === 3;
    return true;
  });

  const p1Tasks = filteredTasks.filter((t) => t.priority === 1 && t.status !== 'done');
  const p2Tasks = filteredTasks.filter((t) => t.priority === 2 && t.status !== 'done');
  const p3Tasks = filteredTasks.filter((t) => t.priority === 3 && t.status !== 'done');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const p1Remaining = tasks.filter((t) => t.priority === 1 && t.status !== 'done').length;

  return (
    <section className="space-y-6">
      
      {/* Sub-header action strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
            <span>Personal OS</span>
            <span>•</span>
            <span className="text-primary-container">Tugas &amp; Fokus</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Deep Work &amp; Productivity Cockpit
          </h1>
        </div>

        {/* Right Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3.5 py-1.5 rounded-full border border-outline/30 shadow-sm text-on-surface text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-primary-container" />
            <span>Hari ini</span>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-full shadow-inner text-xs font-semibold">
            {(['all', 'p1', 'p2', 'p3'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1 rounded-full uppercase transition ${
                  filterMode === mode
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {mode === 'all' ? 'Semua' : mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bento KPI Top Row (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pomodoro Sessions */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Sesi Fokus Hari Ini</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                {sessionsCompleted}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">Sesi</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-on-surface-variant">
              <span>{sessionsCompleted * 25} Menit deep work</span>
              <span className="font-semibold text-on-surface">Target: 6</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((sessionsCompleted / 6) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: P1 Tasks */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Prioritas Mendesak (P1)</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                {p1Remaining}
              </span>
              <span className="text-xs text-rose-600 font-semibold">Tersisa</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-on-surface-variant">
              <span>Do First</span>
              <span className="font-semibold text-rose-600">Tinggi</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, p1Remaining * 25)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Weekly Completion Rate */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Penyelesaian Task</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                {completionRate}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold">+6%</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-on-surface-variant">
              <span>{completedTasks} dari {totalTasks} selesai</span>
              <span className="font-semibold text-emerald-600">Optimal</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Daily Streak */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Daily Habit Streak</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                12
              </span>
              <span className="text-xs text-primary-container font-semibold">Hari Aktif</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-on-surface-variant">
              <span>Rekor: 14 hari</span>
              <span className="font-semibold text-primary-container">🔥 Rekor</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-700"
                style={{ width: '86%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Core Workspace: 5 Cols (Pomodoro Engine) vs 7 Cols (Eisenhower Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT: Pomodoro Hero Engine & Energy Stack (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Interactive Pomodoro Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary-container/10 blur-3xl pointer-events-none -z-10" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
                <span className="text-xs font-bold text-on-surface uppercase tracking-wide">
                  Fokus Deep Work
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface-variant text-[11px] font-semibold">
                <span>Sesi {sessionsCompleted + 1}/6</span>
              </div>
            </div>

            {/* Timer Display Block */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="text-6xl sm:text-7xl font-bold font-mono text-on-surface tracking-tight">
                {formatTimer(timeLeft)}
              </div>
              <span className="text-xs text-on-surface-variant font-medium mt-2">
                {timerRunning ? 'Sesi fokus sedang berjalan — minimalkan gangguan' : 'Siap untuk deep work sprint'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-inverse-surface text-white text-xs font-bold shadow-md hover:bg-black transition active:scale-95"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'Jeda Sesi' : 'Mulai Fokus'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimeLeft(25 * 60);
                }}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-dim flex items-center justify-center text-on-surface transition"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Ambient Sound Pills */}
            <div className="mt-8 pt-4 border-t border-outline/20">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
                <Headphones className="w-3.5 h-3.5 text-primary-container" />
                <span className="font-semibold">Suara Ambien Fokus</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'off', label: 'Hening' },
                  { id: 'lofi', label: 'Lofi Chill' },
                  { id: 'brown', label: 'Brown Noise' },
                  { id: 'rain', label: 'Hujan Malam' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAmbientSound(s.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      ambientSound === s.id
                        ? 'bg-inverse-surface text-white shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mental Energy Rhythm Stack */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-3">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Ritme Energi Mental Hari Ini
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Pagi (08:00 - 12:00)</span>
                <span className="font-bold text-emerald-600">Peak Focus (90%)</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-on-surface-variant">Siang (13:00 - 17:00)</span>
                <span className="font-bold text-primary-container">Execution (65%)</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full rounded-full" style={{ width: '65%' }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-on-surface-variant">Sore/Malam (19:00 - 22:00)</span>
                <span className="font-bold text-zinc-500">Cool-down (40%)</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-zinc-400 h-full rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Eisenhower Task Matrix (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Quick Add Bar */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)]">
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tulis target tugas berikutnya... (Enter untuk simpan)"
                className="flex-1 px-4 py-2 rounded-xl bg-surface-container-low border border-outline/30 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value) as 1 | 2 | 3)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline/30 text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value={1}>P1: Mendesak</option>
                <option value={2}>P2: Terjadwal</option>
                <option value={3}>P3: Quick Win</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quadrant List Containers */}
          <div className="space-y-4">
            
            {/* P1: Urgent & Important */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    P1: Mendesak &amp; Berdampak Tinggi (Do First)
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                  {p1Tasks.length} Task
                </span>
              </div>

              <div className="space-y-2">
                {p1Tasks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-2">Semua tugas P1 selesai.</p>
                ) : (
                  p1Tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDone(t.id)}
                          className="text-on-surface-variant hover:text-emerald-600 transition"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-on-surface">{t.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDailyFocus(t.id)}
                          className={`p-1 rounded-full ${
                            t.is_daily_focus
                              ? 'text-primary-container'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="Tandai Daily Focus"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="text-on-surface-variant hover:text-error p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* P2: Scheduled & Long Progress */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    P2: Terjadwal / Progres Panjang (Schedule)
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  {p2Tasks.length} Task
                </span>
              </div>

              <div className="space-y-2">
                {p2Tasks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-2">Tidak ada tugas P2 aktif.</p>
                ) : (
                  p2Tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDone(t.id)}
                          className="text-on-surface-variant hover:text-emerald-600 transition"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-on-surface">{t.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDailyFocus(t.id)}
                          className={`p-1 rounded-full ${
                            t.is_daily_focus
                              ? 'text-primary-container'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="text-on-surface-variant hover:text-error p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* P3: Quick Wins */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a387f6]" />
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    P3: Quick Wins &lt;15 Menit
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  {p3Tasks.length} Task
                </span>
              </div>

              <div className="space-y-2">
                {p3Tasks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-2">Tidak ada tugas P3 aktif.</p>
                ) : (
                  p3Tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDone(t.id)}
                          className="text-on-surface-variant hover:text-emerald-600 transition"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-on-surface">{t.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="text-on-surface-variant hover:text-error p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selesai / Completed */}
            {doneTasks.length > 0 && (
              <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-3 opacity-75">
                <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Tugas Selesai ({doneTasks.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {doneTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low text-xs line-through text-on-surface-variant"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDone(t.id)}
                          className="text-emerald-600 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span>{t.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTask(t.id)}
                        className="text-on-surface-variant hover:text-error p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
