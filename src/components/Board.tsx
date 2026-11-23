"use client";

import { useBoard } from "@/lib/board-store";
import { STATUSES, STATUS_LABELS, type TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

const TO_BACKLOG = "__backlog";

/** The current sprint, as four status columns. Backlog tasks are not shown here. */
export function Board() {
  const { tasks, moveTask, setTaskLocation } = useBoard();
  const sprintTasks = tasks.filter((t) => t.location === "sprint");

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const columnTasks = sprintTasks.filter((t) => t.status === status);
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
                        onChange={(e) =>
                          e.target.value === TO_BACKLOG
                            ? setTaskLocation(task.id, "backlog")
                            : moveTask(task.id, e.target.value as TaskStatus)
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                        <option disabled>──────────</option>
                        <option value={TO_BACKLOG}>Move to backlog</option>
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
