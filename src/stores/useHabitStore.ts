import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit } from '@/types/database';
import { toLocalDateKey } from '@/lib/budget-utils';
import { recordPendingDeletion } from '@/lib/supabase-delete';

interface HabitState {
  habits: Habit[];
  addHabit: (title: string, category?: string) => void;
  toggleHabitToday: (id: string, dateInput?: string | Date) => void;
  deleteHabit: (id: string) => void;
  setHabitsFromCloud: (habits: Habit[]) => void;
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-leetcode',
    user_id: 'ferrel',
    title: 'LeetCode / Problem Solving 1 Soal',
    category: 'coding',
    streak: 3,
    best_streak: 7,
    last_completed_date: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'habit-git',
    user_id: 'ferrel',
    title: 'Push Code / Git Commit Harian',
    category: 'coding',
    streak: 5,
    best_streak: 12,
    last_completed_date: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'habit-reading',
    user_id: 'ferrel',
    title: 'Baca Tech Docs / Buku 15 Menit',
    category: 'learning',
    streak: 2,
    best_streak: 5,
    last_completed_date: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'habit-water',
    user_id: 'ferrel',
    title: 'Minum Air 2L & Olahraga Ringan',
    category: 'health',
    streak: 4,
    best_streak: 10,
    last_completed_date: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getYesterdayKey(todayKey: string): string {
  const [y, m, d] = todayKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return date.toISOString().split('T')[0];
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: DEFAULT_HABITS,

      addHabit: (title: string, category = 'general') => {
        const newHabit: Habit = {
          id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          user_id: 'ferrel',
          title: title.trim(),
          category,
          streak: 0,
          best_streak: 0,
          last_completed_date: null,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      toggleHabitToday: (id: string, dateInput?: string | Date) => {
        const todayKey = toLocalDateKey(dateInput);
        const yesterdayKey = getYesterdayKey(todayKey);

        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;

            const isDoneToday = h.last_completed_date === todayKey;
            if (isDoneToday) {
              // Untoggle
              const newStreak = Math.max(0, h.streak - 1);
              return {
                ...h,
                last_completed_date: null,
                streak: newStreak,
                updated_at: new Date().toISOString(),
              };
            } else {
              // Toggle complete
              const isConsecutive = h.last_completed_date === yesterdayKey;
              const newStreak = isConsecutive ? h.streak + 1 : 1;
              const newBest = Math.max(h.best_streak, newStreak);
              return {
                ...h,
                last_completed_date: todayKey,
                streak: newStreak,
                best_streak: newBest,
                updated_at: new Date().toISOString(),
              };
            }
          }),
        }));
      },

      deleteHabit: (id: string) => {
        recordPendingDeletion('habits', id);
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      setHabitsFromCloud: (cloudHabits: Habit[]) => {
        set({ habits: cloudHabits });
      },
    }),
    {
      name: 'chemicvll-habit-storage',
    }
  )
);
