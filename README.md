# CopilotKit Scrum Board POC

A small Next.js Scrum board with a **CopilotKit v2** sidebar. It has two tabs: **Sprint board** (To Do / In Progress / In Review / Done, 30 mock tasks) and **Backlog** (8 mock tasks not yet planned), plus 8 mock team members. Each of the five copilot capabilities was added in its own commit:

| # | Capability | How (CopilotKit v2 API) | File |
|---|---|---|---|
| 1 | Chat sidebar | `<CopilotKitProvider>` + `<CopilotSidebar>` | `src/app/providers.tsx`, `src/components/copilot/BoardCopilot.tsx` |
| 2 | Context sharing | `useAgentContext` (live board state) | `BoardCopilot.tsx` |
| 3 | Actions (create / move / plan / assign) | `useFrontendTool` with zod `parameters` + `handler` | `src/components/copilot/useBoardTools.tsx` |
| 4 | Generative UI | `render` on `useFrontendTool` → `<TaskCard>` in chat (`showTask`, create, move) | `useBoardTools.tsx` |
| 5 | Human-in-the-loop delete | `useHumanInTheLoop` (no handler; `respond()` from Approve/Cancel) | `src/components/copilot/DeleteApproval.tsx` |

The backend is one route that hosts the Copilot Runtime: `src/app/api/copilotkit/[[...slug]]/route.ts`. The LLM key is read only there.

## Setup

Requirements: Node 20+ and an Anthropic API key from the [Claude Console](https://console.anthropic.com). A claude.ai subscription does not include API access.

```bash
npm install
cp .env.example .env.local      # then set ANTHROPIC_API_KEY
npm run dev                     # http://localhost:3000
```

### Packages

| Package | Why |
|---|---|
| `@copilotkit/react-core` (`/v2` entry) | Provider, sidebar, hooks, and the stylesheet `@copilotkit/react-core/v2/styles.css`. You don't need `@copilotkit/react-ui` with v2. |
| `@copilotkit/runtime` (`/v2` entry) | `CopilotRuntime`, `BuiltInAgent`, `createCopilotRuntimeHandler` |
| `zod` | Tool parameter schemas. CopilotKit accepts any Standard Schema library. |
| `server-only` | Makes the build fail if the runtime route is ever imported into client code. |

`tsconfig.json` must use `"moduleResolution": "bundler"`, or `@copilotkit/react-core/v2` won't resolve.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Server-only. Never prefix it with `NEXT_PUBLIC_`. |
| `COPILOT_MODEL` | no | A `provider/model` string. Defaults to `anthropic/claude-sonnet-5-5`. To switch providers, use e.g. `openai/...` or `google/...` and set that provider's key (`OPENAI_API_KEY` or `GOOGLE_API_KEY`). |
| `COPILOTKIT_TELEMETRY_DISABLED` | no | Set it to `true` to opt out of CopilotKit's anonymous telemetry, which is on by default. |

### Runtime route

```ts
// src/app/api/copilotkit/[[...slug]]/route.ts  (simplified)
import { BuiltInAgent, CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

const agent = new BuiltInAgent({ model: "anthropic/claude-sonnet-5-5", apiKey: process.env.ANTHROPIC_API_KEY, prompt: SYSTEM_PROMPT, maxSteps: 5 });
const runtime = new CopilotRuntime({ agents: { default: agent } });
const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
```

The frontend only knows `runtimeUrl="/api/copilotkit"`.

## Demo script (the five capabilities)

1. **Chat:** the sidebar opens on load. Say "hi". Collapse it with the tab on its left edge, and expand it again with the **AI Helper** tab on the right edge of the window. The browser remembers your choice.
2. **Context:** ask "What's in progress?" or "What is Ana working on?" It should list SCRUM-3 and SCRUM-4. Move a card by hand, ask again, and the answer changes.
3. **Actions:** "Create a high-priority task 'Write release notes' for Sofía, 2 points", then "Move SCRUM-5 to In Review", then "Assign SCRUM-6 to Camila". Watch the board update.
4. **Generative UI:** "Show me SCRUM-3". A task card renders inside the chat. Create and move also render cards.
5. **Human-in-the-loop:** "Delete SCRUM-6". An approval card appears. Click **Cancel** and the task stays. Ask again and click **Delete**, and it's removed.
6. **Backlog:** "What's in the backlog?", then "Move SCRUM-23 to the backlog" and "Pull SCRUM-32 into the sprint and start it". The tab counts change, and the cards move between the **Sprint board** and **Backlog** tabs. By hand, use **Move to backlog** in a card's status menu, or **Add to Sprint 14** on a backlog card. To assign a card by hand, click the assignee name on it.

Each task has a `location`: `sprint` (on the board) or `backlog`. Backlog tasks are always "To Do". The copilot's `planTask` tool moves a task between the two, and `moveTask` changes columns only for sprint tasks.

## Testing without an API key

`e2e/mock_anthropic.py` imitates Anthropic's streaming Messages API, with scripted tool calls. `e2e/smoke.py` drives a real browser through every acceptance criterion.

```bash
pip install playwright && python3 -m playwright install chromium   # once
python3 e2e/mock_anthropic.py 4010 &
npm run build
ANTHROPIC_API_KEY=test ANTHROPIC_BASE_URL=http://127.0.0.1:4010/v1 npm start &
python3 e2e/smoke.py        # set CHROME_PATH to use a system Chrome instead
npm run check:secrets       # no keys in tracked files or the client bundle
```

## Architecture and the Jira follow-up

```
Board UI ─┐
          ├─> BoardProvider (board-store.tsx) ──> TaskRepository (interface)
Copilot ──┘        state + mutations               └─ InMemoryTaskRepository (mock, today)
tools                                              └─ JiraTaskRepository   (Advanced POC)
```

The UI and all copilot tools go through `TaskRepository` (`src/lib/task-repository.ts`). To connect Jira, add a repository that calls server routes, where the Jira token lives server-side like the LLM key, and map issues onto `Task`. The `id` field is already shaped like a Jira key. See `FINDINGS.md` for recommendations.

## Scripts

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run check:secrets`
