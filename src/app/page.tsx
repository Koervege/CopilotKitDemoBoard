import { TeamStrip } from "@/components/TeamStrip";
import { Workspace } from "@/components/Workspace";
import { BoardCopilot } from "@/components/copilot/BoardCopilot";
import { CURRENT_SPRINT } from "@/lib/types";

export default function Page() {
  return (
    <main className="page">
      <header className="page__header">
        <h1>{CURRENT_SPRINT} · Scrum Board</h1>
        <p>Mock data only. Ask the copilot about the sprint or the backlog, or have it create, move, plan, assign or delete tasks.</p>
      </header>
      <TeamStrip />
      <Workspace />
      <BoardCopilot />
    </main>
  );
}
