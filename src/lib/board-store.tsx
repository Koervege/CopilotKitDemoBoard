"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { InMemoryTaskRepository, type TaskRepository } from "./task-repository";
import type { NewTask, Task, TaskStatus } from "./types";

interface BoardContextValue {
  tasks: Task[];
  loading: boolean;
  createTask(input: NewTask): Promise<Task>;
  moveTask(id: string, status: TaskStatus): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTask(id: string): Task | undefined;
}

const BoardContext = createContext<BoardContextValue | null>(null);

/**
 * Holds board state for the UI and exposes mutations that both the manual UI
 * and the copilot tools use. Swap the repository to change the data source.
 */
export function BoardProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: TaskRepository;
}) {
  const repoRef = useRef<TaskRepository>(repository ?? new InMemoryTaskRepository());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  // Keep a ref in sync so async tool handlers always see the latest tasks.
  const tasksRef = useRef<Task[]>([]);

  const refresh = useCallback(async () => {
    const next = await repoRef.current.list();
    tasksRef.current = next;
    setTasks(next);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<BoardContextValue>(
    () => ({
      tasks,
      loading,
      async createTask(input) {
        const task = await repoRef.current.create(input);
        await refresh();
        return task;
      },
      async moveTask(id, status) {
        const task = await repoRef.current.move(id, status);
        await refresh();
        return task;
      },
      async deleteTask(id) {
        await repoRef.current.remove(id);
        await refresh();
      },
      getTask(id) {
        return tasksRef.current.find((t) => t.id.toLowerCase() === id.toLowerCase());
      },
    }),
    [tasks, loading, refresh],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used inside <BoardProvider>");
  return ctx;
}
