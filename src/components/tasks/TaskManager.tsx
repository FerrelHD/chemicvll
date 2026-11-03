'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { Play, Pause, RotateCcw, Check, Star, Trash2, Plus, Clock } from 'lucide-react';

export function TaskManager() {
  const { tasks, addTask, toggleDone, toggleDailyFocus, deleteTask } = useTaskStore();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(2);

  // Focus Timer state (25 minutes default)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
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

  const dailyFocusTasks = tasks.filter((t) => t.is_daily_focus);
  const inboxTasks = tasks.filter((t) => !t.is_daily_focus);

  return (
    <section className="space-y-6">
      
      {/* Header & Focus Timer Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
            Mesin Eksekusi & Fokus Harian
          </h2>
          <p className="text-xs text-appleText-secondary mt-0.5">
            Dua tingkatan: Daily Focus (3-5 prioritas utama) & Inbox tangkapan cepat.
          </p>
        </div>

        {/* Focus Timer Strip (Minimalist Apple Style) */}
        <div className="flex items-center gap-3 p-2 px-3 rounded-lg bg-white border border-appleBorder shadow-apple">
          <Clock className="w-4 h-4 text-appleText-muted" />
          <span className="font-mono text-sm font-bold text-appleText-primary">
            {formatTimer(timeLeft)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-1 rounded hover:bg-zinc-100 text-appleText-primary transition"
              title={timerRunning ? 'Jeda' : 'Mulai Fokus'}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimeLeft(25 * 60);
              }}
              className="p-1 rounded hover:bg-zinc-100 text-appleText-muted hover:text-appleText-primary transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tambah tugas baru... (Enter)"
          className="flex-1 px-3.5 py-2 rounded-lg border border-appleBorder bg-white text-xs text-appleText-primary focus:outline-none focus:ring-1 focus:ring-zinc-800 shadow-apple"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(Number(e.target.value) as 1 | 2 | 3)}
          className="px-2.5 py-2 rounded-lg border border-appleBorder bg-white text-xs text-appleText-secondary focus:outline-none"
        >
          <option value={1}>Tinggi (!high)</option>
          <option value={2}>Sedang (!med)</option>
          <option value={3}>Rendah (!low)</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black transition shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </form>

      {/* Two-Tier Task Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Tier 1: Daily Focus */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-appleBorder">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-appleText-primary font-mono">
                Daily Focus ({dailyFocusTasks.length}/5)
              </h3>
            </div>
            <span className="text-[11px] text-appleText-muted">Maks. 3-5 item</span>
          </div>

          <div className="space-y-2">
            {dailyFocusTasks.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-appleBorder text-center text-xs text-appleText-muted">
                Belum ada fokus harian. Klik ikon bintang pada tugas di Inbox untuk memindahkannya ke sini.
              </div>
            ) : (
              dailyFocusTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onToggleDailyFocus={toggleDailyFocus}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Tier 2: Inbox */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-appleBorder">
            <h3 className="text-xs font-bold uppercase tracking-wider text-appleText-primary font-mono">
              Inbox Tangkapan ({inboxTasks.length})
            </h3>
            <span className="text-[11px] text-appleText-muted">Semua tugas belum selesai</span>
          </div>

          <div className="space-y-2">
            {inboxTasks.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-appleBorder text-center text-xs text-appleText-muted">
                Inbox kosong. Semua tugas selesai atau masuk Daily Focus.
              </div>
            ) : (
              inboxTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onToggleDailyFocus={toggleDailyFocus}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
        </div>

      </div>

    </section>
  );
}

function TaskItem({
  task,
  onToggleDone,
  onToggleDailyFocus,
  onDelete,
}: {
  task: any;
  onToggleDone: (id: string) => void;
  onToggleDailyFocus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === 'done';

  return (
    <div
      className={`p-3 rounded-lg border bg-white shadow-apple flex items-center justify-between gap-3 transition-all ${
        isDone ? 'opacity-50 border-zinc-200' : 'border-appleBorder hover:border-zinc-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => onToggleDone(task.id)}
          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
            isDone
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-zinc-300 hover:border-zinc-500'
          }`}
        >
          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <span
          className={`text-xs text-appleText-primary truncate ${
            isDone ? 'line-through text-appleText-muted' : 'font-medium'
          }`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onToggleDailyFocus(task.id)}
          className={`p-1 rounded hover:bg-zinc-100 transition ${
            task.is_daily_focus
              ? 'text-amber-500 fill-amber-500'
              : 'text-appleText-muted hover:text-amber-500'
          }`}
          title={task.is_daily_focus ? 'Lepas dari Daily Focus' : 'Jadikan Daily Focus'}
        >
          <Star className={`w-3.5 h-3.5 ${task.is_daily_focus ? 'fill-amber-500' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="p-1 rounded text-appleText-muted hover:text-red-600 hover:bg-zinc-100 transition"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

