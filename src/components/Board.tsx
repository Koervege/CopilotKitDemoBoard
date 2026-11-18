"use client";

import { useBoard } from "@/lib/board-store";
import { STATUSES, STATUS_LABELS, type TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

export function Board() {
  const { tasks, loading, moveTask } = useBoard();

  if (loading) return <p className="muted">Loading board…</p>;

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className="column" data-status={status}>
            <h2 className="column__title">
              {STATUS_LABELS[status]} <span className="column__count">{columnTasks.length}</span>
              <span className="column__points">
                {columnTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)} pts
              </span>
            </h2>
            <div className="column__list">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  footer={
                    <label className="move">
                      <span className="sr-only">Move {task.id}</span>
                      <select
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  }
                />
              ))}
              {columnTasks.length === 0 && <p className="muted empty">No tasks</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
