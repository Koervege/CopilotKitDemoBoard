"use client";

import { BoardProvider } from "@/lib/board-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BoardProvider>{children}</BoardProvider>;
}
