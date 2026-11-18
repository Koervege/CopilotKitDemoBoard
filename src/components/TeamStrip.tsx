"use client";

import { useBoard } from "@/lib/board-store";
import { Avatar } from "./TaskCard";

export function TeamStrip() {
  const { users } = useBoard();
  if (users.length === 0) return null;
  return (
    <div className="team" aria-label="Team">
      {users.map((u) => (
        <Avatar key={u.id} user={u} size={28} />
      ))}
      <span className="team__label">{users.length} team members</span>
    </div>
  );
}
