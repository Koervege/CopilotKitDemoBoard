"use client";

import { useBoard } from "@/lib/board-store";
import { CURRENT_SPRINT } from "@/lib/types";
import { TaskCard } from "./TaskCard";

/** Product backlog: tasks not planned into the current sprint, in rank order. */
export function Backlog() {
  const { tasks, setTaskLocation } = useBoard();
  const backlog = tasks.filter((t) => t.location === "backlog");
  const points = backlog.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  return (
    <section className="backlog" data-location="backlog">
      <h2 className="column__title">
        Backlog <span className="column__count">{backlog.length}</span>
        <span className="column__points">{points} pts</span>
      </h2>
      <div className="backlog__list">
        {backlog.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            footer={
              <button className="btn" onClick={() => setTaskLocation(task.id, "sprint")}>
                Add to {CURRENT_SPRINT}
              </button>
            }
          />
        ))}
        {backlog.length === 0 && <p className="muted empty">The backlog is empty</p>}
      </div>
    </section>
  );
}
