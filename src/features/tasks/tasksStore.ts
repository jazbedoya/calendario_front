import { create } from "zustand";
import type { DailyTask } from "./api";

interface TasksState {
  tasks: DailyTask[];
  setTasks: (tasks: DailyTask[]) => void;
  addTask:    (task: DailyTask) => void;
  updateTask: (id: string, patch: Partial<DailyTask>) => void;
  removeTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((s) => ({ tasks: [...s.tasks, task] })),

  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));
