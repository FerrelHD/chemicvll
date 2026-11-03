import { Task } from '@/types/database';

export interface RolloverResult {
  shouldBrief: boolean;
  rolledOverCount: number;
  updatedTasks: Task[];
}

export function checkAndExecuteRollover(
  tasks: Task[],
  todayStr: string,
  lastRolloverDate: string | null
): RolloverResult {
  // If already briefed today, skip
  if (lastRolloverDate === todayStr) {
    return {
      shouldBrief: false,
      rolledOverCount: 0,
      updatedTasks: tasks,
    };
  }

  let count = 0;
  const updatedTasks = tasks.map((task) => {
    // Unfinished P1 tasks automatically get pushed to daily focus
    if (task.priority === 1 && task.status !== 'done' && !task.is_daily_focus) {
      count++;
      return { ...task, is_daily_focus: true };
    }
    return task;
  });

  return {
    shouldBrief: true,
    rolledOverCount: count,
    updatedTasks,
  };
}
