# Minimal mock of Anthropic's streaming Messages API for E2E tests (no real LLM).
import json, sys, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import os
LOG = open(os.environ.get("MOCK_LOG", "/tmp/mock_requests.jsonl"), "a")

def sse(ev, data):
    return f"event: {ev}\ndata: {json.dumps(data)}\n\n".encode()

def last_user_text(msgs):
    for m in reversed(msgs):
        if m["role"] != "user": continue
        c = m["content"]
        if isinstance(c, str): return c, False
        texts = [b.get("text","") for b in c if b.get("type")=="text"]
        has_result = any(b.get("type")=="tool_result" for b in c)
        return " ".join(texts), has_result
    return "", False

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["content-length"])))
        LOG.write(json.dumps({"path": self.path, "body": body}) + "\n"); LOG.flush()
        text, has_result = last_user_text(body["messages"])
        t = text.lower()
        tool = None; reply = None
        if has_result:
            # summarise the tool result
            res = [b for b in body["messages"][-1]["content"] if b.get("type")=="tool_result"][0]
            reply = "Tool result: " + json.dumps(res.get("content"))[:200]
        elif "move" in t:
            tool = ("moveTask", {"taskId": "SCRUM-5", "status": "in_progress"})
        elif "in progress" in t:
            ctx = json.dumps(body.get("system","")) + json.dumps(body["messages"])
            ids = sorted(set(i for i in ["SCRUM-3","SCRUM-4"] if i in ctx))
            reply = "In progress (from context): " + ", ".join(ids) if ids else "NO CONTEXT RECEIVED"
        elif "create" in t:
            tool = ("createTask", {"title": "Write release notes", "type": "task", "priority": "high", "assigneeId": "u-sofia", "storyPoints": 2})
        elif "move" in t:
            tool = ("moveTask", {"taskId": "SCRUM-5", "status": "in_progress"})
        elif "assign" in t:
            tool = ("assignTask", {"taskId": "SCRUM-6", "assigneeId": "u-camila"})
        elif "show" in t:
            tool = ("showTask", {"taskId": "SCRUM-3"})
        elif "delete" in t:
            tool = ("deleteTask", {"taskId": "SCRUM-6", "reason": "Out of scope"})
        else:
            reply = "Hello from the mock model."
        self.send_response(200)
        self.send_header("content-type", "text/event-stream")
        self.end_headers()
        w = self.wfile.write
        w(sse("message_start", {"type":"message_start","message":{"id":"msg_"+uuid.uuid4().hex[:8],"type":"message","role":"assistant","model":body.get("model"),"content":[],"stop_reason":None,"usage":{"input_tokens":100,"output_tokens":1}}}))
        if tool:
            w(sse("content_block_start", {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_"+uuid.uuid4().hex[:10],"name":tool[0],"input":{}}}))
            w(sse("content_block_delta", {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":json.dumps(tool[1])}}))
            w(sse("content_block_stop", {"type":"content_block_stop","index":0}))
            stop = "tool_use"
        else:
            w(sse("content_block_start", {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}))
            w(sse("content_block_delta", {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":reply}}))
            w(sse("content_block_stop", {"type":"content_block_stop","index":0}))
            stop = "end_turn"
        w(sse("message_delta", {"type":"message_delta","delta":{"stop_reason":stop,"stop_sequence":None},"usage":{"output_tokens":20}}))
        w(sse("message_stop", {"type":"message_stop"}))

ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
