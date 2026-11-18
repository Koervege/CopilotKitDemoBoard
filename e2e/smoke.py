"""Browser smoke test for all five copilot capabilities, against the mock LLM.

Usage (see README "Testing without an API key"):
  python3 e2e/mock_anthropic.py 4010 &
  ANTHROPIC_API_KEY=test ANTHROPIC_BASE_URL=http://127.0.0.1:4010/v1 npm run build && npm start
  python3 e2e/smoke.py            # needs: pip install playwright (uses CHROME_PATH or bundled chromium)
"""
import os, sys, time
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:3000/")
CHROME = os.environ.get("CHROME_PATH")
failures = []

def check(name, ok):
    print(("PASS " if ok else "FAIL ") + name)
    if not ok: failures.append(name)

def col(pg, status):
    return pg.eval_on_selector_all(f'section[data-status="{status}"] .task-card__id', "els=>els.map(e=>e.textContent)")

def send(pg, text, settle_ms=3500):
    pg.fill('[data-testid="copilot-chat-textarea"]', text)
    t0 = time.time()
    pg.click('[data-testid="copilot-send-button"]')
    pg.wait_for_timeout(settle_ms)
    return t0

with sync_playwright() as p:
    kw = {"executable_path": CHROME} if CHROME else {}
    b = p.chromium.launch(args=["--no-proxy-server"], **kw)
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    pg.goto(URL); pg.wait_for_selector(".task-card")

    check("AC1 board loads mock tasks in 4 columns",
          {"SCRUM-3", "SCRUM-4"} <= set(col(pg, "in_progress")) and len(col(pg, "in_review")) == 5
          and sum(len(col(pg, s)) for s in ["todo", "in_progress", "in_review", "done"]) == 30)
    check("Mock users shown", pg.locator(".team .avatar").count() == 8)
    check("AC2 sidebar available", pg.is_visible('[data-testid="copilot-chat-textarea"]'))

    send(pg, "What's in progress?")
    check("AC3 answers from board context", "SCRUM-3, SCRUM-4" in pg.inner_text("body"))

    send(pg, "Create a task for release notes")
    check("AC4 create updates board", pg.locator('section[data-status="todo"] .task-card', has_text="Write release notes").count() == 1)
    send(pg, "Move SCRUM-5 to in progress")
    check("AC4 move updates board", "SCRUM-5" in col(pg, "in_progress"))

    send(pg, "Assign SCRUM-6 to Camila")
    card6 = pg.locator('section[data-status="todo"] .task-card', has_text="SCRUM-6")
    check("Assign updates board", "Camila Torres" in card6.inner_text())
    check("Assign renders card in chat", pg.locator(".chat-card", has_text="Assigned to Camila Torres").count() >= 1)

    send(pg, "Show me SCRUM-3")
    check("AC5 task card rendered in chat", pg.locator(".chat-card .task-card", has_text="Implement login API").count() >= 1)

    send(pg, "Delete SCRUM-6")
    check("AC6 approval requested before delete", pg.locator(".chat-card", has_text="Delete this task?").count() >= 1 and "SCRUM-6" in col(pg, "todo"))
    pg.locator(".chat-card", has_text="Delete this task?").last.get_by_role("button", name="Cancel").click()
    pg.wait_for_timeout(2500)
    check("AC6 decline keeps task", "SCRUM-6" in col(pg, "todo"))
    send(pg, "Delete SCRUM-6 please")
    pg.locator(".chat-card", has_text="Delete this task?").last.get_by_role("button", name="Delete").click()
    pg.wait_for_timeout(2500)
    check("AC6 approve deletes task", "SCRUM-6" not in col(pg, "todo"))

    html = pg.content()
    check("AC7 no API key in page", "sk-ant" not in html and "ANTHROPIC_API_KEY" not in html)
    b.close()

sys.exit(1 if failures else 0)
