#!/usr/bin/env node
// huntautogroup-texas-mcp: stdio MCP server for Hunt Auto Group Texas (texas.huntautogroup.com).
//
// It forwards each JSON-RPC message from stdin to the public, read-only remote MCP server
// (Streamable HTTP, stateless) and writes the answer to stdout, one JSON message per line.
// No dependencies, no API key, nothing stored. Node 18+ (uses the built-in fetch).
//
//   npx huntautogroup-texas-mcp            -> car data server  (https://texas.huntautogroup.com/api/mcp/)
//   npx huntautogroup-texas-mcp --docs     -> docs server      (https://texas.huntautogroup.com/api/mcp/docs/)
//   HUNTAUTO_MCP_URL=<url> overrides the endpoint.
"use strict";

const readline = require("node:readline");

const BASE = "https://texas.huntautogroup.com/api/mcp/";
const URL_ = process.env.HUNTAUTO_MCP_URL || (process.argv.includes("--docs") ? BASE + "docs/" : BASE);

function write(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function forward(msg) {
  const isNotification = msg && msg.id === undefined;
  try {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify(msg),
    });
    if (res.status === 202 || isNotification) return;
    const text = await res.text();
    if (!text) return;
    const data = JSON.parse(text);
    (Array.isArray(data) ? data : [data]).forEach(write);
  } catch (err) {
    if (!isNotification) {
      write({ jsonrpc: "2.0", id: msg && msg.id !== undefined ? msg.id : null,
              error: { code: -32603, message: "Could not reach " + URL_ + ": " + (err && err.message ? err.message : String(err)) } });
    }
  }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const pending = new Set();
rl.on("line", (line) => {
  const s = line.trim();
  if (!s) return;
  let msg;
  try {
    msg = JSON.parse(s);
  } catch (_) {
    write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  const msgs = Array.isArray(msg) ? msg : [msg];
  for (const m of msgs) {
    const p = forward(m).finally(() => pending.delete(p));
    pending.add(p);
  }
});
rl.on("close", async () => {
  await Promise.all([...pending]);
  process.exit(0);
});
