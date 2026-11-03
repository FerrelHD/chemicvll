import { create } from 'zustand';
import { Task } from '@/types/database';

interface TaskState {
  tasks: Task[];
  addTask: (title: string, priority?: 1 | 2 | 3, isDailyFocus?: boolean) => void;
  toggleDone: (id: string) => void;
  toggleDailyFocus: (id: string) => void;
  deleteTask: (id: string) => void;
}

// Clean slate ready for Ferrel's actual tasks
const INITIAL_TASKS: Task[] = [];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: INITIAL_TASKS,
  addTask: (title, priority = 2, isDailyFocus = false) =>
    set((state) => ({
      tasks: [
        {
          id: `task-${Date.now()}`,
          title: title.trim(),
          priority,
          is_daily_focus: isDailyFocus,
          status: 'inbox',
          project_id: null,
          due_date: null,
          completed_at: null,
          created_at: new Date().toISOString(),
        },
        ...state.tasks,
      ],
    })),
  toggleDone: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'done' ? 'todo' : 'done',
              completed_at: t.status === 'done' ? null : new Date().toISOString(),
            }
          : t
      ),
    })),
  toggleDailyFocus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, is_daily_focus: !t.is_daily_focus } : t
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
}));

// Setup listener for Command Bar integration
if (typeof window !== 'undefined') {
  window.addEventListener('quick-add-task', ((e: CustomEvent) => {
    if (e.detail?.title) {
      useTaskStore.getState().addTask(e.detail.title, e.detail.priority || 2);
    }
  }) as EventListener);
}

