import type { Task, User } from "./types";

type SeedTask = Omit<Task, "location">;

// Mock data only: everything on the board is sent to the LLM provider as context.

export const MOCK_USERS: User[] = [
  { id: "u-ana", name: "Ana Gómez", role: "Backend developer", color: "#4f46e5" },
  { id: "u-luis", name: "Luis Martínez", role: "Product designer", color: "#0891b2" },
  { id: "u-sofia", name: "Sofía Ramírez", role: "Content & UX writer", color: "#db2777" },
  { id: "u-diego", name: "Diego Herrera", role: "Frontend developer", color: "#ea580c" },
  { id: "u-camila", name: "Camila Torres", role: "QA engineer", color: "#16a34a" },
  { id: "u-mateo", name: "Mateo Vargas", role: "DevOps engineer", color: "#7c3aed" },
  { id: "u-valentina", name: "Valentina Ríos", role: "Product owner", color: "#ca8a04" },
  { id: "u-andres", name: "Andrés Castro", role: "Scrum master", color: "#475569" },
];

// Current sprint.
const SPRINT_TASKS: SeedTask[] = [
  // --- Done
  { id: "SCRUM-1", type: "task", title: "Set up CI pipeline", description: "GitHub Actions for lint, typecheck and build.", status: "done", priority: "high", assigneeId: "u-mateo", storyPoints: 3 },
  { id: "SCRUM-2", type: "story", title: "Design login screen", description: "Wireframes and visual design for email + SSO login.", status: "done", priority: "medium", assigneeId: "u-luis", storyPoints: 2 },
  { id: "SCRUM-8", type: "task", title: "Sprint 14 planning session", description: "Estimate and commit backlog items for the sprint.", status: "done", priority: "medium", assigneeId: "u-andres", storyPoints: 1 },
  { id: "SCRUM-9", type: "task", title: "Provision staging environment", description: "Staging cluster with seeded test data.", status: "done", priority: "high", assigneeId: "u-mateo", storyPoints: 5 },
  { id: "SCRUM-10", type: "story", title: "Define sprint goal and acceptance criteria", description: "Agree sprint 14 goal with stakeholders.", status: "done", priority: "medium", assigneeId: "u-valentina", storyPoints: 1 },
  { id: "SCRUM-11", type: "bug", title: "Logo blurry on retina screens", description: "Replace PNG logo with SVG.", status: "done", priority: "low", assigneeId: "u-diego", storyPoints: 1 },
  { id: "SCRUM-12", type: "task", title: "Set up error monitoring", description: "Wire Sentry into frontend and API.", status: "done", priority: "medium", assigneeId: "u-mateo", storyPoints: 2 },

  // --- In review
  { id: "SCRUM-13", type: "story", title: "User profile page", description: "View and edit name, photo and notification settings.", status: "in_review", priority: "medium", assigneeId: "u-diego", storyPoints: 5 },
  { id: "SCRUM-14", type: "task", title: "Database migration for user roles", description: "Add roles table and backfill existing users.", status: "in_review", priority: "high", assigneeId: "u-ana", storyPoints: 3 },
  { id: "SCRUM-15", type: "bug", title: "Session expires too early on mobile", description: "Refresh token not persisted in the mobile web view.", status: "in_review", priority: "high", assigneeId: "u-ana", storyPoints: 2 },
  { id: "SCRUM-16", type: "story", title: "Empty-state illustrations", description: "Final illustrations for dashboard, inbox and reports.", status: "in_review", priority: "low", assigneeId: "u-luis", storyPoints: 2 },
  { id: "SCRUM-17", type: "task", title: "Regression test plan for login", description: "Manual and automated cases for email + SSO login.", status: "in_review", priority: "medium", assigneeId: "u-camila", storyPoints: 2 },

  // --- In progress
  { id: "SCRUM-3", type: "story", title: "Implement login API", description: "POST /auth/login with rate limiting.", status: "in_progress", priority: "high", assigneeId: "u-ana", storyPoints: 5 },
  { id: "SCRUM-4", type: "task", title: "Write onboarding copy", description: "Three onboarding steps for first-time users.", status: "in_progress", priority: "low", assigneeId: "u-sofia", storyPoints: 1 },
  { id: "SCRUM-18", type: "story", title: "Notifications settings UI", description: "Toggles for email, push and in-app notifications.", status: "in_progress", priority: "medium", assigneeId: "u-diego", storyPoints: 3 },
  { id: "SCRUM-19", type: "bug", title: "Search returns duplicate results", description: "Same project appears twice when filtering by tag.", status: "in_progress", priority: "high", assigneeId: "u-camila", storyPoints: 2 },
  { id: "SCRUM-20", type: "task", title: "Automate database backups", description: "Nightly snapshots with 14-day retention.", status: "in_progress", priority: "medium", assigneeId: "u-mateo", storyPoints: 3 },
  { id: "SCRUM-21", type: "story", title: "Design system: button and input tokens", description: "Colour, spacing and state tokens in Figma and code.", status: "in_progress", priority: "medium", assigneeId: "u-luis", storyPoints: 3 },

  // --- To do
  { id: "SCRUM-5", type: "story", title: "Add password reset flow", description: "Email link with 30-minute expiry.", status: "todo", priority: "medium", assigneeId: "u-ana", storyPoints: 3 },
  { id: "SCRUM-6", type: "task", title: "Dashboard empty states", description: "Helper text and links when there is no data.", status: "todo", priority: "low", storyPoints: 2 },
  { id: "SCRUM-7", type: "bug", title: "Fix flaky checkout test", description: "Intermittent timeout in checkout e2e spec.", status: "todo", priority: "high", assigneeId: "u-camila", storyPoints: 2 },
  { id: "SCRUM-22", type: "story", title: "Export reports to CSV", description: "Download any report table as CSV.", status: "todo", priority: "medium", storyPoints: 3 },
  { id: "SCRUM-23", type: "story", title: "Two-factor authentication", description: "TOTP app support with recovery codes.", status: "todo", priority: "high", assigneeId: "u-ana", storyPoints: 8 },
  { id: "SCRUM-24", type: "task", title: "Accessibility audit of main flows", description: "WCAG 2.2 AA check on login, dashboard and settings.", status: "todo", priority: "medium", assigneeId: "u-luis", storyPoints: 3 },
  { id: "SCRUM-25", type: "bug", title: "Dates show in UTC instead of local time", description: "Activity feed ignores the user's time zone.", status: "todo", priority: "medium", assigneeId: "u-diego", storyPoints: 1 },
  { id: "SCRUM-26", type: "task", title: "Write help-center articles for login", description: "Login, SSO and password reset articles.", status: "todo", priority: "low", assigneeId: "u-sofia", storyPoints: 2 },
  { id: "SCRUM-27", type: "story", title: "Team invitations", description: "Invite teammates by email with a role.", status: "todo", priority: "high", storyPoints: 5 },
  { id: "SCRUM-28", type: "task", title: "Load test the login API", description: "Target 500 requests/s with p95 < 300 ms.", status: "todo", priority: "medium", assigneeId: "u-mateo", storyPoints: 3 },
  { id: "SCRUM-29", type: "task", title: "Prepare sprint review demo", description: "Demo script and test accounts for Friday.", status: "todo", priority: "low", assigneeId: "u-andres", storyPoints: 1 },
  { id: "SCRUM-30", type: "bug", title: "Avatar upload fails for HEIC images", description: "Convert HEIC to JPEG on upload.", status: "todo", priority: "low", storyPoints: 2 },
];

// Product backlog: not planned into the current sprint yet. Always "todo".
const BACKLOG_TASKS: SeedTask[] = [
  { id: "SCRUM-31", type: "story", title: "Dark mode", description: "Theme toggle that follows the OS setting.", status: "todo", priority: "medium", storyPoints: 5 },
  { id: "SCRUM-32", type: "story", title: "Single sign-on with Microsoft", description: "Azure AD / Entra ID as a second SSO provider.", status: "todo", priority: "high", storyPoints: 8 },
  { id: "SCRUM-33", type: "task", title: "Upgrade to the latest Node LTS", description: "Bump runtime and CI images.", status: "todo", priority: "medium", assigneeId: "u-mateo", storyPoints: 2 },
  { id: "SCRUM-34", type: "bug", title: "Tooltip clipped at the right screen edge", description: "Reposition tooltips near the viewport edge.", status: "todo", priority: "low", storyPoints: 1 },
  { id: "SCRUM-35", type: "story", title: "Audit log for admin actions", description: "Record who changed roles and settings, and when.", status: "todo", priority: "medium", storyPoints: 5 },
  { id: "SCRUM-36", type: "story", title: "Mobile push notifications", description: "Push for mentions and assignments.", status: "todo", priority: "low", storyPoints: 8 },
  { id: "SCRUM-37", type: "task", title: "Remove legacy v1 API endpoints", description: "Delete endpoints unused for 90 days.", status: "todo", priority: "low", assigneeId: "u-ana", storyPoints: 3 },
  { id: "SCRUM-38", type: "bug", title: "CSV export breaks on commas in names", description: "Quote fields that contain commas.", status: "todo", priority: "medium", storyPoints: 1 },
];

// IDs SCRUM-3/4 (in progress), SCRUM-5/6/7 (to do) and SCRUM-31 (backlog) are used by the e2e smoke test.
export const MOCK_TASKS: Task[] = [
  ...SPRINT_TASKS.map((t): Task => ({ ...t, location: "sprint" })),
  ...BACKLOG_TASKS.map((t): Task => ({ ...t, location: "backlog" })),
];
