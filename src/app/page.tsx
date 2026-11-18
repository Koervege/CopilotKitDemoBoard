import { Board } from "@/components/Board";
import { BoardCopilot } from "@/components/copilot/BoardCopilot";

export default function Page() {
  return (
    <main className="page">
      <header className="page__header">
        <h1>Sprint 14 · Scrum Board</h1>
        <p>Mock data only. Ask the copilot about the board, or have it create, move or delete tasks.</p>
      </header>
      <Board />
      <BoardCopilot />
    </main>
  );
}
