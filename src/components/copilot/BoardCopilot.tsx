"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";

/**
 * Everything the copilot can see and do lives here, added one capability at a time:
 *  1. Chat sidebar
 */
export function BoardCopilot() {
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
