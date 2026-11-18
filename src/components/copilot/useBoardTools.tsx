"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useBoard } from "@/lib/board-store";
import { PRIORITIES, STATUSES } from "@/lib/types";

const statusSchema = z
  .enum(STATUSES)
  .describe('Column: "todo" (To Do), "in_progress" (In Progress) or "done" (Done)');

/**
 * 3. Actions: frontend tools the agent can call. They run in the browser and
 *    go through the same board store as the manual UI, so the board updates
 *    immediately.
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
    },
    [moveTask, getTask],
  );
}
