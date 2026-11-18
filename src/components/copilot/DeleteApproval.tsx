"use client";

import { useHumanInTheLoop, type ReactHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useState, type ComponentProps } from "react";
import { z } from "zod";
import { TaskCard } from "@/components/TaskCard";
import { useBoard } from "@/lib/board-store";

const deleteParams = z.object({
  taskId: z.string().describe("Id of the task to delete, e.g. SCRUM-6"),
  reason: z.string().optional().describe("Why the task is being deleted"),
});
type DeleteArgs = z.infer<typeof deleteParams>;

type RenderProps = ComponentProps<ReactHumanInTheLoop<DeleteArgs>["render"]>;

/**
 * 5. Human-in-the-loop. A HITL tool has NO handler: the agent's call pauses
 *    until this component calls `respond`. The delete itself only happens in
 *    the Approve click, so declining (or ignoring) the prompt can never delete.
 */
function DeleteApprovalCard({ status, args, respond, result }: RenderProps) {
  const { getTask, deleteTask } = useBoard();
  const [busy, setBusy] = useState(false);
  const task = args.taskId ? getTask(args.taskId) : undefined;

  if (status === "inProgress") {
    return <div className="chat-card__label">Preparing delete request…</div>;
  }

  if (status === "complete") {
    let approved = false;
    try {
      approved = JSON.parse(result)?.approved === true;
    } catch {}
    return (
      <div className="chat-card">
        <span className={`status-note ${approved ? "ok" : "no"}`}>
          {approved ? `✓ ${args.taskId} deleted` : `✗ Delete of ${args.taskId} cancelled — nothing was deleted`}
        </span>
      </div>
    );
  }

  // status === "executing": waiting for the user.
  if (!task) {
    return (
      <div className="chat-card">
        <div className="chat-card__label">Task {args.taskId} not found.</div>
        <button className="btn" onClick={() => respond({ approved: false, error: "not_found" })}>
          OK
        </button>
      </div>
    );
  }

  const approve = async () => {
    setBusy(true);
    try {
      await deleteTask(task.id);
      await respond({ approved: true, deletedTaskId: task.id });
    } catch (err) {
      await respond({ approved: false, error: String(err) });
    }
  };

  const decline = async () => {
    setBusy(true);
    await respond({ approved: false, message: "User declined. Nothing was deleted." });
  };

  return (
    <div className="chat-card">
      <div className="chat-card__label">
        Delete this task?{args.reason ? ` Reason: ${args.reason}` : ""}
      </div>
      <TaskCard
        task={task}
        compact
        footer={
          <>
            <button className="btn btn-danger" disabled={busy} onClick={approve}>
              Delete
            </button>
            <button className="btn" disabled={busy} onClick={decline}>
              Cancel
            </button>
          </>
        }
      />
    </div>
  );
}

export function useDeleteApproval() {
  useHumanInTheLoop<DeleteArgs>({
    name: "deleteTask",
    description:
      "Delete a task from the board. Always asks the user for explicit approval first; the result says whether it was approved.",
    parameters: deleteParams,
    render: DeleteApprovalCard,
  });
}
