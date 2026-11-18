// Fails if an API key looks committed or if it leaks into the client bundle.
// Run after `npm run build`:  npm run check:secrets
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const KEY_PATTERNS = [/sk-ant-[A-Za-z0-9_-]{20,}/, /sk-(proj-)?[A-Za-z0-9]{32,}/, /AIza[0-9A-Za-z_-]{35}/];
const ENV_NAMES = /ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_API_KEY/;
let problems = 0;

// 1. Tracked files must not contain real keys.
const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
for (const f of tracked) {
  if (!existsSync(f) || statSync(f).size > 1_000_000) continue;
  const text = readFileSync(f, "utf8");
  if (KEY_PATTERNS.some((re) => re.test(text))) { console.error(`✗ possible key in tracked file: ${f}`); problems++; }
}
if (tracked.some((f) => /^\.env(\.|$)/.test(f) && f !== ".env.example")) { console.error("✗ an .env file is tracked"); problems++; }

// 2. Client bundle must not contain keys or key env-var names.
const dir = ".next/static";
if (!existsSync(dir)) { console.error("Run `npm run build` first."); process.exit(1); }
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const f of walk(dir).filter((f) => f.endsWith(".js"))) {
  const text = readFileSync(f, "utf8");
  if (KEY_PATTERNS.some((re) => re.test(text)) || ENV_NAMES.test(text)) { console.error(`✗ secret reference in client bundle: ${f}`); problems++; }
}

if (problems) process.exit(1);
console.log("✓ no secrets in tracked files or client bundle");
