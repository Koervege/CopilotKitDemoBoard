"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { TaskCard } from "@/components/TaskCard";
import { useBoard } from "@/lib/board-store";
import { PRIORITIES, STATUSES, STATUS_LABELS, type Task } from "@/lib/types";

const statusSchema = z
  .enum(STATUSES)
  .describe('Column: "todo" (To Do), "in_progress" (In Progress) or "done" (Done)');

/** Tool results arrive in render() as a JSON string. */
function parseResult(result: string | undefined): { ok?: boolean; task?: Task; error?: string } {
  if (!result) return {};
  try {
    return JSON.parse(result);
  } catch {
    return {};
  }
}

function ChatTaskCard({ label, task }: { label: string; task: Task }) {
  return (
    <div className="chat-card">
      <div className="chat-card__label">{label}</div>
      <TaskCard task={task} compact />
    </div>
  );
}

function Pending({ text }: { text: string }) {
  return <div className="chat-card__label">{text}</div>;
}

/**
 * 3. Actions: frontend tools the agent can call. They run in the browser and
 *    go through the same board store as the manual UI, so the board updates
 *    immediately.
 * 4. Generative UI: each tool's `render` draws a real React TaskCard in the chat.
 */
export function useBoardTools() {
  const { createTask, moveTask, getTask } = useBoard();

  useFrontendTool(
    {
      name: "createTask",
      description: "Create a new task on the Scrum board.",
      parameters: z.object({
        title: z.string().describe("Short task title"),
        description: z.string().optional(),
        status: statusSchema.optional().describe("Defaults to todo"),
        priority: z.enum(PRIORITIES).default("medium"),
        assignee: z.string().optional(),
        storyPoints: z.number().int().min(0).max(21).optional(),
      }),
      handler: async (args) => {
        const task = await createTask(args);
        return { ok: true, task };
      },
      render: ({ status, args, result }) => {
        if (status !== "complete") return <Pending text={`Creating "${args.title ?? "task"}"…`} />;
        const { task, error } = parseResult(result);
        return task ? <ChatTaskCard label="Created" task={task} /> : <Pending text={error ?? "Could not create task"} />;
      },
    },
    [createTask],
  );

  useFrontendTool(
    {
      name: "moveTask",
      description: "Move an existing task to another column.",
      parameters: z.object({
        taskId: z.string().describe("Task id, e.g. SCRUM-3"),
        status: statusSchema,
      }),
      handler: async ({ taskId, status }) => {
        const before = getTask(taskId);
        if (!before) return { ok: false, error: `Task ${taskId} not found` };
        const task = await moveTask(taskId, status);
        return { ok: true, from: before.status, task };
      },
      render: ({ status, args, result }) => {
        if (status !== "complete") return <Pending text={`Moving ${args.taskId ?? "task"}…`} />;
        const { task, error } = parseResult(result);
        return task ? (
          <ChatTaskCard label={`Moved to ${STATUS_LABELS[task.status]}`} task={task} />
        ) : (
          <Pending text={error ?? "Could not move task"} />
        );
      },
    },
    [moveTask, getTask],
  );

  useFrontendTool(
    {
      name: "showTask",
      description: "Show a task as a card in the chat. Use whenever the user asks to see or inspect a task.",
      parameters: z.object({ taskId: z.string().describe("Task id, e.g. SCRUM-3") }),
      handler: async ({ taskId }) => {
        const task = getTask(taskId);
        return task ? { ok: true, task } : { ok: false, error: `Task ${taskId} not found` };
      },
      render: ({ status, args, result }) => {
        if (status !== "complete") return <Pending text={`Looking up ${args.taskId ?? "task"}…`} />;
        const { task, error } = parseResult(result);
        return task ? <ChatTaskCard label={task.id} task={task} /> : <Pending text={error ?? "Not found"} />;
      },
    },
    [getTask],
  );
}
