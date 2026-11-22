'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/stores/useHabitStore';
import { toLocalDateKey } from '@/lib/budget-utils';
import { Flame, Check, Plus, Trash2, X } from 'lucide-react';

export function HabitTrackerCard() {
  const { habits, addHabit, toggleHabitToday, deleteHabit } = useHabitStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('coding');

  const todayKey = toLocalDateKey();
  const completedTodayCount = habits.filter((h) => h.last_completed_date === todayKey).length;
  const totalHabits = habits.length;
  const completionRatio = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit(newTitle.trim(), newCategory);
    setNewTitle('');
    setIsAddOpen(false);
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
            <Flame className="w-4 h-4 text-primary-container stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Daily Habits &amp; Streaks</h3>
            <p className="text-xs text-on-surface-variant">Rutinitas harian &amp; streak tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums text-on-surface-variant">
            {completedTodayCount}/{totalHabits} selesai
          </span>
          <button
            type="button"
            onClick={() => setIsAddOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-dim flex items-center justify-center text-on-surface transition active:scale-95"
            title="Tambah Habit Baru"
          >
            {isAddOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary-container h-full rounded-full transition-all duration-500"
          style={{ width: `${completionRatio}%` }}
        />
      </div>

      {/* Inline Add Form */}
      {isAddOpen && (
        <form onSubmit={handleCreate} className="p-3 rounded-2xl bg-surface-container-low border border-outline/40 space-y-2.5 animate-in fade-in">
          <input
            type="text"
            required
            placeholder="Nama habit harian (cth. LeetCode 1 Soal, Olahraga 15 Menit)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline/40 rounded-xl px-3 py-2 text-base sm:text-xs text-on-surface focus:outline-none focus:border-primary-container"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {['coding', 'health', 'learning'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize transition ${
                    newCategory === cat
                      ? 'bg-inverse-surface dark:bg-primary-container text-white'
                      : 'bg-surface-container-lowest text-on-surface-variant border border-outline/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-full bg-primary-container text-white text-xs font-semibold shadow-xs"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="divide-y divide-outline/20">
        {habits.map((habit) => {
          const isDone = habit.last_completed_date === todayKey;
          return (
            <div
              key={habit.id}
              className="py-2.5 flex items-center justify-between gap-3 group"
            >
              <div
                onClick={() => toggleHabitToday(habit.id)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHabitToday(habit.id);
                  }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                    isDone
                      ? 'bg-primary-container text-white shadow-xs'
                      : 'border-2 border-outline hover:border-primary-container'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <div className="min-w-0">
                  <span
                    className={`text-xs font-semibold block truncate transition-colors ${
                      isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                    }`}
                  >
                    {habit.title}
                  </span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">
                    {habit.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed/40 dark:bg-primary-fixed/20 border border-primary-container/20 text-primary-container text-[11px] font-bold tabular-nums">
                  <Flame className="w-3.5 h-3.5 stroke-[2.2] text-primary-container" />
                  <span>{habit.streak} Hari Streak</span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-rose-50 transition"
                  title="Hapus habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
