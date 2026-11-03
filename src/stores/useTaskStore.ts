import { create } from 'zustand';
import { Task } from '@/types/database';

interface TaskState {
  tasks: Task[];
  addTask: (title: string, priority?: 1 | 2 | 3, isDailyFocus?: boolean) => void;
  toggleDone: (id: string) => void;
  toggleDailyFocus: (id: string) => void;
  deleteTask: (id: string) => void;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Pelajari System Design interview untuk Software Engineer',
    priority: 1,
    is_daily_focus: true,
    status: 'todo',
    project_id: null,
    due_date: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Kirim email follow-up ke recruiter Tokopedia',
    priority: 1,
    is_daily_focus: true,
    status: 'todo',
    project_id: null,
    due_date: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Rapikan repository GitHub dan README Personal OS',
    priority: 2,
    is_daily_focus: false,
    status: 'inbox',
    project_id: null,
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
  },
];

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

