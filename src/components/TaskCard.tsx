"use client";

import { useBoard } from "@/lib/board-store";
import { STATUS_LABELS, type Task, type TaskType, type User } from "@/lib/types";

const TYPE_ICONS: Record<TaskType, string> = { story: "◆", task: "✓", bug: "●" };

export function Avatar({ user, size = 22 }: { user?: User; size?: number }) {
  const initials = user ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : "?";
  return (
    <span
      className={`avatar${user ? "" : " avatar--empty"}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: user?.color }}
      title={user ? `${user.name} · ${user.role}` : "Unassigned"}
    >
      {initials}
    </span>
  );
}

/**
 * Shared presentational card. Rendered on the board AND inside the copilot
 * chat (generative UI), so the two always look the same.
 */
export function TaskCard({
  task,
  footer,
  compact = false,
  onAssign,
}: {
  task: Task;
  footer?: React.ReactNode;
  compact?: boolean;
  /** When set, the assignee becomes a dropdown. Pass null to unassign. */
  onAssign?: (assigneeId: string | null) => void;
}) {
  const { getUser, users } = useBoard();
  const assignee = getUser(task.assigneeId);

  return (
    <article className={`task-card priority-${task.priority}${compact ? " compact" : ""}`}>
      <header className="task-card__header">
        <span className="task-card__key">
          <span className={`type-icon type-${task.type}`} title={task.type}>
            {TYPE_ICONS[task.type]}
          </span>
          <span className="task-card__id">{task.id}</span>
        </span>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </header>
      <h3 className="task-card__title">{task.title}</h3>
      {task.description && !compact && <p className="task-card__desc">{task.description}</p>}
      <div className="task-card__meta">
        <span className="assignee">
          <Avatar user={assignee} />
          {onAssign ? (
            <select
              className="assignee-select"
              aria-label={`Assignee for ${task.id}`}
              value={task.assigneeId ?? ""}
              onChange={(e) => onAssign(e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <span>{assignee?.name ?? "Unassigned"}</span>
          )}
        </span>
        <span className="meta-right">
          {compact && (
            <span className="status-pill">
              {task.location === "backlog" ? "Backlog" : STATUS_LABELS[task.status]}
            </span>
          )}
          {task.storyPoints != null && <span className="points" title="Story points">{task.storyPoints}</span>}
        </span>
      </div>
      {footer && <footer className="task-card__footer">{footer}</footer>}
    </article>
  );
}
