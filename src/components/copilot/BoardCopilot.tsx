"use client";

import { CopilotSidebar, useAgentContext } from "@copilotkit/react-core/v2";
import { useBoard } from "@/lib/board-store";
import { CURRENT_SPRINT, STATUS_LABELS } from "@/lib/types";
import { useDeleteApproval } from "./DeleteApproval";
import { useBoardTools } from "./useBoardTools";

/**
 * Everything the copilot can see and do lives here, added one capability at a time:
 *  1. Chat sidebar
 *  2. Context sharing (useAgentContext)
 *  3. Actions: create / move tasks (useFrontendTool)
 *  4. Generative UI: TaskCard rendered in chat (useFrontendTool `render`)
 *  5. Human-in-the-loop: approval before delete (useHumanInTheLoop)
 */
export function BoardCopilot() {
  const { tasks, users } = useBoard();
  useBoardTools();
  useDeleteApproval();

  // 2. Context: the live board is sent with every agent run, so answers reflect
  //    the current state (including changes made by hand in the UI).
  useAgentContext({
    description:
      'Current sprint, product backlog and team. Each task has id, title, description, type (story | task | bug), location ("sprint" = in the current sprint, on the board; "backlog" = not planned yet), status (todo | in_progress | in_review | done; backlog tasks are always todo), priority, assigneeId (a team member id, absent = unassigned) and storyPoints. Resolve assigneeId to a name using `team`.',
    value: {
      currentSprint: CURRENT_SPRINT,
      columns: STATUS_LABELS,
      team: users.map(({ id, name, role }) => ({ id, name, role })),
      sprintTaskCount: tasks.filter((t) => t.location === "sprint").length,
      backlogTaskCount: tasks.filter((t) => t.location === "backlog").length,
      tasks,
    },
  });

  return (
    <CopilotSidebar
      defaultOpen
      labels={{
        modalHeaderTitle: "Scrum Copilot",
        welcomeMessageText:
          "Hi! Ask me about the sprint, the backlog or the team, or tell me to create, move, plan, assign or delete tasks.",
        chatInputPlaceholder: "e.g. What's in progress?",
      }}
    />
  );
}
