// Domain model for the board. Kept deliberately close to a Jira issue so a
// Jira-backed repository can map onto it later (key, summary, status, assignee…).

export const STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof PRIORITIES)[number];

// A `type` (not `interface`) on purpose: useAgentContext requires a
// JsonSerializable value, and TS interfaces don't satisfy index signatures.
export type Task = {
  /** Stable id, e.g. "SCRUM-12". For Jira this would be the issue key. */
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  storyPoints?: number;
};

export type NewTask = Omit<Task, "id" | "status"> & { status?: TaskStatus };
