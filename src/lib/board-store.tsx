"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { InMemoryTaskRepository, type TaskRepository } from "./task-repository";
import type { NewTask, Task, TaskStatus, User } from "./types";

interface BoardContextValue {
  tasks: Task[];
  users: User[];
  loading: boolean;
  createTask(input: NewTask): Promise<Task>;
  moveTask(id: string, status: TaskStatus): Promise<Task>;
  assignTask(id: string, assigneeId: string | null): Promise<Task>;
  getUser(id: string | undefined): User | undefined;
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // Keep a ref in sync so async tool handlers always see the latest tasks.
  const tasksRef = useRef<Task[]>([]);

  const refresh = useCallback(async () => {
    const next = await repoRef.current.list();
    tasksRef.current = next;
    setTasks(next);
  }, []);

  useEffect(() => {
    Promise.all([refresh(), repoRef.current.listUsers().then(setUsers)]).finally(() => setLoading(false));
  }, [refresh]);

  // Mutations are stable (they don't change when tasks change), so copilot
  // tools that close over them don't need to re-register on every update.
  const createTask = useCallback(
    async (input: NewTask) => {
      const task = await repoRef.current.create(input);
      await refresh();
      return task;
    },
    [refresh],
  );
  const moveTask = useCallback(
    async (id: string, status: TaskStatus) => {
      const task = await repoRef.current.move(id, status);
      await refresh();
      return task;
    },
    [refresh],
  );
  const assignTask = useCallback(
    async (id: string, assigneeId: string | null) => {
      const task = await repoRef.current.assign(id, assigneeId);
      await refresh();
      return task;
    },
    [refresh],
  );
  const deleteTask = useCallback(
    async (id: string) => {
      await repoRef.current.remove(id);
      await refresh();
    },
    [refresh],
  );
  const getTask = useCallback(
    (id: string) => tasksRef.current.find((t) => t.id.toLowerCase() === id.toLowerCase()),
    [],
  );

  const value = useMemo<BoardContextValue>(
    () => ({
      tasks,
      users,
      loading,
      createTask,
      moveTask,
      assignTask,
      deleteTask,
      getTask,
      getUser: (id) => (id ? users.find((u) => u.id === id) : undefined),
    }),
    [tasks, users, loading, createTask, moveTask, assignTask, deleteTask, getTask],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used inside <BoardProvider>");
  return ctx;
}
