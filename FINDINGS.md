# Findings: CopilotKit Basic POC

Versions tested: `@copilotkit/react-core` and `@copilotkit/runtime` **1.89.0** (v2 APIs via the `/v2` entry points), Next.js 16.4, React 19.3.

## Result

All five capabilities work. Every acceptance criterion passes in an automated browser run against a mock LLM (`e2e/smoke.py`). A live run with a real Anthropic key is still needed for the demo recording and for real latency and cost numbers (see "To confirm with a real key").

## Latency

- **Framework overhead is small:** about 80–160 ms per turn with an instant mock model, end to end (browser → runtime route → model → streamed back → UI updated). Real latency is almost entirely the model's.
- **Tool turns cost two model calls.** The agent emits the tool call, the browser runs it, and the result goes back for a final answer. Create, move, show and delete therefore take roughly twice as long as a plain question.
- Responses stream, so text appears before the turn finishes.

## Cost per interaction (estimate)

- The first request is about 5.5k characters (≈1.4k input tokens): system prompt and board context ≈2.4k chars, plus the 4 tool schemas ≈2.9k chars. Every call resends the full chat history, so input grows as the conversation goes on.
- At Sonnet 5.5 list prices ($2 per million input tokens, $10 per million output):
  - **Question:** about $0.003–0.005
  - **Action turn (2 calls):** about $0.008–0.01 early in a chat, rising with history
- Cheaper options: set `COPILOT_MODEL=anthropic/claude-haiku-5-5` for demos, keep the shared context lean (send ids, titles and statuses, not long descriptions), and start new threads.
- Tokens were estimated from characters. Read actual usage in the Claude Console after the demo.

## API gotchas

1. **v2 lives behind `/v2` subpaths.** Import from `@copilotkit/react-core/v2` and `@copilotkit/runtime/v2`. The root entry points are the v1 API, and most tutorials (`useCopilotAction`, `useCopilotReadable`, `<CopilotKit>`, `@copilotkit/react-ui`) target v1.
   | v1 (avoid) | v2 (used here) |
   |---|---|
   | `<CopilotKit runtimeUrl>` | `<CopilotKitProvider runtimeUrl>` |
   | `useCopilotReadable` | `useAgentContext` |
   | `useCopilotAction` | `useFrontendTool` / `useRenderTool` / `useHumanInTheLoop` |
   | `renderAndWaitForResponse` | `useHumanInTheLoop` + `respond()` |
   | `@copilotkit/react-ui` + its CSS | `CopilotSidebar` and `@copilotkit/react-core/v2/styles.css` |
   | `copilotRuntimeNextJSAppRouterEndpoint` + service adapters | `createCopilotRuntimeHandler` + `BuiltInAgent` |
2. **`tsconfig` needs `"moduleResolution": "bundler"`**, or the `/v2` imports don't resolve.
3. **Model strings are `provider/model` or `provider:model`**, e.g. `anthropic/claude-sonnet-5-5`. The runtime accepts either separator. The docs mix both, and the built-in type hints list older model ids, but any string works.
4. **Route path is a catch-all:** `app/api/copilotkit/[[...slug]]/route.ts`, exporting GET, POST, PATCH and DELETE. The client calls sub-paths such as `/info`.
5. **`useAgentContext` values must be `JsonSerializable`.** TypeScript `interface`s fail that check because they lack an index signature, so `Task` is a `type` alias.
6. **CSS variable collisions.** CopilotKit's theme defines `--muted`, `--accent` and similar variables inside the chat. App CSS using the same names renders wrongly in generative-UI cards. Prefix your own (`--sb-*`).
7. **Tool results reach `render()` as a JSON string.** Parse them before use.
8. **HITL tools have no `handler`.** The agent pauses until `respond()` is called from the render component. That makes approval safe by design: the destructive call only runs in the Approve click.
9. **Telemetry is on by default.** Set `COPILOTKIT_TELEMETRY_DISABLED=true`.
10. **`maxSteps` defaults to 1** on `BuiltInAgent`. We set 5 so the agent can call a tool and then answer in one turn.
11. Package footprint: about 1,200 npm packages with Next.js. `react-core` pulls in recharts, katex, lit and more.

## Security notes

- The key is read only in the runtime route, with `import "server-only"`. A build with a canary key confirmed it appears nowhere in `.next/static`, and `npm run check:secrets` enforces this.
- All board data goes to the LLM provider as context. That's fine for mock data, but it's a data-governance question for real Jira content.
- Tool handlers run in the browser with the user's permissions. For Jira, keep writes behind server routes that check auth. Don't trust tool arguments.

## Recommendations for the Advanced POC (Jira)

1. **Implement `JiraTaskRepository`** against Next.js server routes (`/api/jira/*`) that call Jira REST with a server-held token: OAuth 3LO for per-user permissions, or an API token for a demo board. The UI and copilot tools don't need to change.
2. **Map Jira workflow statuses to columns** through config. Use Jira transitions for "move", not a direct status write.
3. **Keep human-in-the-loop for every write to real data** (create, transition, delete), at least at first. Consider a confirm step for bulk changes.
4. **Limit context:** send only the active sprint and a compact projection, and fetch details with a `getIssue` tool on demand.
5. **Consider server-side tools** (`defineTool` in the runtime) for reads such as JQL search, so large result sets don't go through the browser.
6. Measure real latency and cost with the key before choosing Sonnet or Haiku.

## To confirm with a real key

- [ ] Run the demo script in README with a real Anthropic key, and record it.
- [ ] Note real response times per question and per action turn, and token usage from the Console.
- [ ] Check prompt quality, e.g. that "delete" always goes through `deleteTask` and never claims success without the tool.
