import { STATUS_LABELS, type Task } from "@/lib/types";

/**
 * Shared presentational card. Rendered on the board AND inside the copilot
 * chat (generative UI), so the two always look the same.
 */
export function TaskCard({
  task,
  footer,
  compact = false,
}: {
  task: Task;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <article className={`task-card priority-${task.priority}${compact ? " compact" : ""}`}>
      <header className="task-card__header">
        <span className="task-card__id">{task.id}</span>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </header>
      <h3 className="task-card__title">{task.title}</h3>
      {task.description && !compact && <p className="task-card__desc">{task.description}</p>}
      <dl className="task-card__meta">
        <div>
          <dt>Status</dt>
          <dd>{STATUS_LABELS[task.status]}</dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{task.assignee ?? "Unassigned"}</dd>
        </div>
        {task.storyPoints != null && (
          <div>
            <dt>Points</dt>
            <dd>{task.storyPoints}</dd>
          </div>
        )}
      </dl>
      {footer && <footer className="task-card__footer">{footer}</footer>}
    </article>
  );
}
