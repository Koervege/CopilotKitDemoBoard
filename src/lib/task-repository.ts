import { MOCK_TASKS, MOCK_USERS } from "./mock-data";
import type { NewTask, Task, TaskStatus, User } from "./types";

/**
 * Data-source seam. The board and every copilot action go through this
 * interface, never through a concrete store. The POC ships an in-memory
 * implementation; the Advanced POC can add a `JiraTaskRepository` that calls a
 * server route (which holds the Jira token) without touching the UI or the
 * copilot tools.
 */
export interface TaskRepository {
  list(): Promise<Task[]>;
  listUsers(): Promise<User[]>;
  create(input: NewTask): Promise<Task>;
  move(id: string, status: TaskStatus): Promise<Task>;
  /** Pass null to unassign. */
  assign(id: string, assigneeId: string | null): Promise<Task>;
  remove(id: string): Promise<void>;
}

/** In-memory mock. State resets on page reload, which is fine for a demo. */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[];
  private users: User[];
  private nextNumber: number;

  constructor(seed: Task[] = MOCK_TASKS, users: User[] = MOCK_USERS) {
    this.tasks = seed.map((t) => ({ ...t }));
    this.users = users.map((u) => ({ ...u }));
    this.nextNumber =
      Math.max(0, ...this.tasks.map((t) => Number(t.id.split("-")[1]) || 0)) + 1;
  }

  async list() {
    return this.tasks.map((t) => ({ ...t }));
  }

  async listUsers() {
    return this.users.map((u) => ({ ...u }));
  }

  async create(input: NewTask) {
    if (input.assigneeId) this.findUser(input.assigneeId);
    const task: Task = {
      ...input,
      id: `SCRUM-${this.nextNumber++}`,
      type: input.type ?? "task",
      status: input.status ?? "todo",
    };
    this.tasks.push(task);
    return { ...task };
  }

  async move(id: string, status: TaskStatus) {
    const task = this.find(id);
    task.status = status;
    return { ...task };
  }

  async assign(id: string, assigneeId: string | null) {
    const task = this.find(id);
    if (assigneeId) this.findUser(assigneeId);
    task.assigneeId = assigneeId ?? undefined;
    return { ...task };
  }

  async remove(id: string) {
    this.find(id);
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  private find(id: string) {
    const task = this.tasks.find((t) => t.id.toLowerCase() === id.toLowerCase());
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }

  private findUser(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }
}
