"use client";

import { useState } from "react";
import { useBoard } from "@/lib/board-store";
import { Backlog } from "./Backlog";
import { Board } from "./Board";

type View = "board" | "backlog";

/** Tabs to switch between the sprint board and the backlog. */
export function Workspace() {
  const { tasks, loading } = useBoard();
  const [view, setView] = useState<View>("board");

  if (loading) return <p className="muted">Loading board…</p>;

  const counts = {
    board: tasks.filter((t) => t.location === "sprint").length,
    backlog: tasks.filter((t) => t.location === "backlog").length,
  };
  const tabs: { id: View; label: string }[] = [
    { id: "board", label: "Sprint board" },
    { id: "backlog", label: "Backlog" },
  ];

  return (
    <>
      <div className="tabs" role="tablist" aria-label="View">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={view === tab.id}
            aria-controls={`panel-${tab.id}`}
            className="tab"
            onClick={() => setView(tab.id)}
          >
            {tab.label} <span className="tab__count">{counts[tab.id]}</span>
          </button>
        ))}
      </div>
      <div id={`panel-${view}`} role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view === "board" ? <Board /> : <Backlog />}
      </div>
    </>
  );
}
