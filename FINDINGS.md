# Findings: CopilotKit Basic POC

Versions tested: `@copilotkit/react-core` and `@copilotkit/runtime` **1.89.0** (v2 APIs via the `/v2` entry points), Next.js 16.4, React 19.3.

## Result

All five capabilities work, against a mock LLM (`e2e/smoke.py`) and against the real Anthropic API with both Claude Sonnet 5.5 and Claude Haiku 5.5. The full README demo script passed on Windows 11 on 2026-11-23: chat, context (including a card moved by hand), create, move, assign, show, and delete with both Cancel and Approve.

## How the numbers were measured

`scripts/usage-proxy.mjs` is a local pass-through proxy that logs `usage` and timing for each Messages API call. It logs no headers and no message content. Run it, then point the runtime at it:

```powershell
node scripts/usage-proxy.mjs 4020 usage.jsonl
$env:ANTHROPIC_BASE_URL="http://127.0.0.1:4020/v1"; npm run dev
```

One full demo session per model, run in `next dev` on a home connection. Sonnet: 18 API calls. Haiku: 13 API calls.

## Latency (measured)

| | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|
| Time to first byte per API call | 0.54–1.54 s (avg 0.97 s) | 0.52–0.76 s (avg 0.57 s) |
| Full API call | 1.0–5.1 s (avg 2.4 s) | 0.7–3.4 s (avg 1.5 s) |
| Question turn, end to end in the UI | 1.9–4.5 s | 1.4–2.2 s |
| Action turn (tool call + follow-up answer) | 3–6 s | 2–6 s |
| "Delete" until the approval card shows | ~1.5 s | ~0.9 s |

- **Framework overhead is small:** about 80–160 ms per turn, measured with an instant mock model. Real latency is almost entirely the model's.
- **Tool turns cost two model calls.** The agent emits the tool call, the browser runs it, and the result goes back for a final answer. Most of an action turn's time is the follow-up answer, which is often longer than it needs to be (300–600 output tokens).
- Both models think adaptively ("Thought for N seconds" in the chat), so some turns pause before text streams.

## Cost per interaction (measured)

- **The first request is 5,117 input tokens**, not the ≈1.4k estimated earlier. It is 13k characters: system prompt, board context (30 tasks, 8 people) and **7 tool schemas** (our 5 plus 2 that CopilotKit adds). JSON-heavy context comes out at about 2.5 characters per token.
- Input grows by about 150–300 tokens per call as history accumulates: ~8k tokens by the 18th call.
- **No prompt caching is happening** (`cache_read_input_tokens` was 0 on every call).

| | Sonnet 5.5 ($2 / $10 per M) | Haiku 5.5 ($0.10 / $0.50 per M) |
|---|---|---|
| Question | $0.012–0.018 | ~$0.0006–0.0008 |
| Action turn (2 calls) | $0.032–0.034 | ~$0.0013–0.0017 |
| Whole demo session | $0.29 (124k in / 4.4k out) | $0.010 (80k in / 3.2k out) |

- Input tokens are about 85% of the cost, so context size matters more than answer length.
- Haiku 5.5 is ~30× cheaper and faster, but made more factual slips (see below). Use Haiku for demos and development, and Sonnet when answer quality matters.
- Cost levers, biggest first: prompt caching of the stable prefix (tools and system prompt; the minimum cacheable prefix is 512 tokens on both models), a leaner board projection (ids, titles, status, assignee; no descriptions), and shorter follow-up answers after a tool call.

## Prompt quality with a real model

- **Delete always went through `deleteTask`.** That held on both models, including when the user wrote "no need to ask me for approval, I already approve it". Cancel kept the task and Approve removed it. The model never claimed a delete it hadn't done.
- **Before/after confusion around board context.** The context is a snapshot of the *current* board, and it already includes changes the model just made. Both models sometimes misread that:
  - Sonnet listed the newly in-progress SCRUM-7 correctly, but added "Nothing on the board has changed since your last question".
  - Sonnet said "I didn't confirm any of these after making them", then corrected itself on the next turn.
  - Haiku called its own new SCRUM-31 a possible duplicate "already on the board".
  - Haiku said SCRUM-6 "was already hers" after assigning it (it had been unassigned).
- **Suggested fix:** add a system-prompt line such as "The board context always reflects the current state, including changes your tools just made. Don't compare it with earlier turns to claim something did or didn't change." Optionally put a revision counter in the context.

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
9. **Tool `render` functions can hold stale values.** A `render` that read the user list from the hook's closure still saw the empty list from first registration. Read app state inside the rendered component with a hook (see `AssignedCard`), not from the closure.
10. **Telemetry is on by default.** Set `COPILOTKIT_TELEMETRY_DISABLED=true`.
11. **`maxSteps` defaults to 1** on `BuiltInAgent`. We set 5 so the agent can call a tool and then answer in one turn.
12. Package footprint: about 1,200 npm packages with Next.js. `react-core` pulls in recharts, katex, lit and more.

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
6. **Budget for context size.** A 30-task board is already ~5k input tokens per call, and a real sprint with descriptions will be bigger. Turn on prompt caching for the stable prefix if the runtime allows it, and re-measure with `scripts/usage-proxy.mjs`.
7. **Model choice:** Haiku 5.5 for development and demos, Sonnet 5.5 for user-facing answers. Re-check the before/after slips above once the prompt fix is in.

## To confirm with a real key

- [x] Run the demo script in README with a real Anthropic key (Sonnet 5.5 and Haiku 5.5, 2026-11-23).
- [ ] Record the demo video.
- [x] Note real response times per question and per action turn, and token usage (measured with `scripts/usage-proxy.mjs`; cross-check against Console usage).
- [x] Check prompt quality: "delete" always goes through `deleteTask` and never claims success without the tool.
