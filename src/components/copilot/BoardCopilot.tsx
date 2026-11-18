"use client";

import { CopilotSidebar, useAgentContext } from "@copilotkit/react-core/v2";
import { useBoard } from "@/lib/board-store";
import { STATUS_LABELS } from "@/lib/types";
import { useBoardTools } from "./useBoardTools";

/**
 * Everything the copilot can see and do lives here, added one capability at a time:
 *  1. Chat sidebar
 *  2. Context sharing (useAgentContext)
 *  3. Actions: create / move tasks (useFrontendTool)
 *  4. Generative UI: TaskCard rendered in chat (useFrontendTool `render`)
 */
export function BoardCopilot() {
  const { tasks } = useBoard();
  useBoardTools();

  // 2. Context: the live board is sent with every agent run, so answers reflect
  //    the current state (including changes made by hand in the UI).
  useAgentContext({
    description:
      "Current Scrum board. Each task has id, title, description, status (todo | in_progress | done), priority, assignee and storyPoints.",
    value: {
      columns: STATUS_LABELS,
      taskCount: tasks.length,
      tasks,
    },
  });

  return (
    <CopilotSidebar
      defaultOpen
      labels={{
        modalHeaderTitle: "Scrum Copilot",
        welcomeMessageText: "Hi! Ask me about the sprint, or tell me to create, move or delete tasks.",
        chatInputPlaceholder: "e.g. What's in progress?",
      }}
    />
  );
}
