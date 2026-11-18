// Copilot Runtime (server-only). This is the ONLY place the LLM API key is read.
// The browser talks to /api/copilotkit; it never sees the key or the provider.
import "server-only";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the Scrum copilot for a small team's sprint board.
- The current board (tasks with id, title, status, priority, assignee, story points) is provided as context. Treat it as the source of truth and refer to tasks by id (e.g. SCRUM-3).
- Statuses are: todo ("To Do"), in_progress ("In Progress"), done ("Done").
- Use the tools to change the board. Never claim a change happened unless the tool succeeded.
- When the user asks to see, inspect or show a specific task, call showTask so it renders as a card.
- Deleting is destructive: always use deleteTask, which asks the user for approval. If the user declines, confirm nothing was deleted.
- Keep answers short and scannable.`;

let handler: ReturnType<typeof createCopilotRuntimeHandler> | undefined;

function getHandler() {
  if (handler) return handler;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local.");
  }

  const agent = new BuiltInAgent({
    model: process.env.COPILOT_MODEL ?? "anthropic/claude-sonnet-5-5",
    apiKey,
    prompt: SYSTEM_PROMPT,
    // Allow a tool call plus a follow-up answer in one turn.
    maxSteps: 5,
  });

  const runtime = new CopilotRuntime({ agents: { default: agent } });
  handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });
  return handler;
}

async function handle(req: Request) {
  try {
    return await getHandler()(req);
  } catch (err) {
    console.error("[copilotkit] runtime error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Copilot runtime error" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
