// Local pass-through proxy to api.anthropic.com that logs token usage and timing per call.
// Never logs headers (the API key travels in x-api-key) or message content.
import http from "node:http";
import https from "node:https";
import fs from "node:fs";

const PORT = Number(process.argv[2] ?? 4020);
const LOG = process.argv[3] ?? "usage.jsonl";

http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    let model = null, nTools = 0, nMsgs = 0, reqChars = body.length;
    try { const j = JSON.parse(body); model = j.model; nTools = (j.tools || []).length; nMsgs = (j.messages || []).length; } catch {}
    const t0 = Date.now();
    let tFirst = null;
    const headers = { ...req.headers, host: "api.anthropic.com" };
    delete headers["accept-encoding"]; // keep the SSE stream plain so usage can be read
    const up = https.request({ host: "api.anthropic.com", path: req.url, method: req.method, headers }, (ur) => {
      res.writeHead(ur.statusCode, ur.headers);
      let buf = "";
      const usage = {};
      let stop = null, toolName = null;
      ur.on("data", (c) => {
        if (tFirst === null) tFirst = Date.now();
        res.write(c);
        buf += c.toString("utf8");
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          try {
            const d = JSON.parse(line.slice(5));
            if (d.type === "message_start") Object.assign(usage, d.message.usage);
            if (d.type === "message_delta") { Object.assign(usage, d.usage); stop = d.delta?.stop_reason ?? stop; }
            if (d.type === "content_block_start" && d.content_block?.type === "tool_use") toolName = d.content_block.name;
          } catch {}
        }
      });
      ur.on("end", () => {
        res.end();
        const rec = { at: new Date().toISOString(), path: req.url, status: ur.statusCode, model, nMsgs, nTools, reqChars,
          ttfbMs: tFirst - t0, totalMs: Date.now() - t0, stop, toolName,
          input: usage.input_tokens, output: usage.output_tokens,
          cacheRead: usage.cache_read_input_tokens, cacheWrite: usage.cache_creation_input_tokens };
        fs.appendFileSync(LOG, JSON.stringify(rec) + "\n");
        console.log(JSON.stringify(rec));
      });
    });
    up.on("error", (e) => { console.error("upstream error", e.message); if (!res.headersSent) res.writeHead(502); res.end(); });
    up.end(body);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`usage proxy on http://127.0.0.1:${PORT}`));
