import type { Task } from "./types";

// Mock data only: everything on the board is sent to the LLM provider as context.
export const MOCK_TASKS: Task[] = [
  { id: "SCRUM-1", title: "Set up CI pipeline", description: "GitHub Actions for lint, typecheck and build.", status: "done", priority: "high", assignee: "Ana", storyPoints: 3 },
  { id: "SCRUM-2", title: "Design login screen", description: "Wireframes and visual design for email + SSO login.", status: "done", priority: "medium", assignee: "Luis", storyPoints: 2 },
  { id: "SCRUM-3", title: "Implement login API", description: "POST /auth/login with rate limiting.", status: "in_progress", priority: "high", assignee: "Ana", storyPoints: 5 },
  { id: "SCRUM-4", title: "Write onboarding copy", description: "Three onboarding steps for first-time users.", status: "in_progress", priority: "low", assignee: "Sofía", storyPoints: 1 },
  { id: "SCRUM-5", title: "Add password reset flow", description: "Email link with 30-minute expiry.", status: "todo", priority: "medium", assignee: "Luis", storyPoints: 3 },
  { id: "SCRUM-6", title: "Dashboard empty states", description: "Illustrations and helper text when there is no data.", status: "todo", priority: "low", storyPoints: 2 },
  { id: "SCRUM-7", title: "Fix flaky checkout test", description: "Intermittent timeout in checkout e2e spec.", status: "todo", priority: "high", assignee: "Ana", storyPoints: 2 },
];
