// Domain model for the board. Kept deliberately close to a Jira issue so a
// Jira-backed repository can map onto it later (key, summary, type, status, assignee…).

export const STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

/**
 * Where a task lives: in the current sprint (shown on the board) or in the
 * product backlog. For Jira: an issue with a sprint set is "sprint"; an issue
 * with no sprint is "backlog".
 */
export const LOCATIONS = ["sprint", "backlog"] as const;
export type TaskLocation = (typeof LOCATIONS)[number];

export const CURRENT_SPRINT = "Sprint 14";

export const LOCATION_LABELS: Record<TaskLocation, string> = {
  sprint: CURRENT_SPRINT,
  backlog: "Backlog",
};

export const PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof PRIORITIES)[number];

export const TASK_TYPES = ["story", "task", "bug"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

// `type` aliases (not `interface`) on purpose: useAgentContext requires a
// JsonSerializable value, and TS interfaces don't satisfy index signatures.

/** A team member. For Jira, `id` would be the user's accountId. */
export type User = {
  id: string;
  name: string;
  role: string;
  /** Avatar background colour. */
  color: string;
};

export type Task = {
  /** Stable id, e.g. "SCRUM-12". For Jira this would be the issue key. */
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  /** Current sprint or backlog. Backlog tasks are always "todo". */
  location: TaskLocation;
  status: TaskStatus;
  priority: TaskPriority;
  /** References User.id. Undefined = unassigned. */
  assigneeId?: string;
  storyPoints?: number;
};

export type NewTask = Omit<Task, "id" | "status" | "type" | "location"> & {
  status?: TaskStatus;
  type?: TaskType;
  /** Defaults to "sprint". */
  location?: TaskLocation;
};
