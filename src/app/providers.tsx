"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { BoardProvider } from "@/lib/board-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // BoardProvider sits outside CopilotKit so tool renderers inside the chat
    // can read and change board state.
    <BoardProvider>
      <CopilotKitProvider runtimeUrl="/api/copilotkit">{children}</CopilotKitProvider>
    </BoardProvider>
  );
}
