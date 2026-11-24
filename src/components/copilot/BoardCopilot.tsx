"use client";

import { CopilotSidebar, useAgentContext } from "@copilotkit/react-core/v2";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { useBoard } from "@/lib/board-store";
import { CURRENT_SPRINT, STATUS_LABELS } from "@/lib/types";
import { ChatHandle } from "./ChatHandle";
import { useDeleteApproval } from "./DeleteApproval";
import { useBoardTools } from "./useBoardTools";

/** Keep in sync with --sb-chat-width in globals.css. */
const CHAT_WIDTH = 420;
const OPEN_KEY = "copilot-open";

/** Replaces CopilotKit's floating round toggle; ChatHandle does that job. */
const NoToggleButton = forwardRef<HTMLButtonElement>(function NoToggleButton() {
  return null;
});

/**
 * Open/collapsed state, remembered per browser. Defaults to open. It is null
 * until the saved value is read after mount, so the panel never flashes open
 * and then slides shut on load.
 */
function useChatOpen() {
  const [open, setOpenState] = useState<boolean | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(OPEN_KEY);
    } catch {}
    setOpenState(saved !== "false");
  }, []);
  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(OPEN_KEY, String(next));
    } catch {}
  }, []);
  return [open, setOpen] as const;
}

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
  const [open, setOpen] = useChatOpen();
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

  if (open === null) return null;

  return (
    <>
      <ChatHandle open={open} onToggle={() => setOpen(!open)} />
      <CopilotSidebar
        open={open}
        onOpenChange={setOpen}
        // A fixed width also avoids the sidebar re-measuring itself in scaled viewports.
        width={CHAT_WIDTH}
        toggleButton={NoToggleButton}
        labels={{
          modalHeaderTitle: "AI Helper",
          welcomeMessageText:
            "Hi! Ask me about the sprint, the backlog or the team, or tell me to create, move, plan, assign or delete tasks.",
          chatInputPlaceholder: "e.g. What's in progress?",
        }}
      />
    </>
  );
}
