#!/usr/bin/env node
// huntautogroup-texas: command-line client for the Hunt Auto Group Texas public API
// (https://texas.huntautogroup.com/developers/). Read-only, no API key, no dependencies. Node 18+.
//
//   npx -p huntautogroup-texas-mcp huntautogroup-texas models --category truck
//   npx -p huntautogroup-texas-mcp huntautogroup-texas model toyota-tacoma
//   npx -p huntautogroup-texas-mcp huntautogroup-texas year toyota-tacoma 2018
//   npx -p huntautogroup-texas-mcp huntautogroup-texas guides --q title --lang es
//
// Add --json to print the raw API response. HUNTAUTO_API_URL overrides the base URL.
"use strict";

const BASE = (process.env.HUNTAUTO_API_URL || "https://texas.huntautogroup.com/api/v1").replace(/\/+$/, "");
const VERSION = require("../package.json").version;

const HELP = `huntautogroup-texas ${VERSION} - used-car data for Central Texas buyers (NHTSA recalls, complaints
and crash stars, EPA MPG) from https://texas.huntautogroup.com. Read-only, no key.

Usage:
  huntautogroup-texas models [--category truck|suv|car|minivan] [--limit N]
  huntautogroup-texas model <slug>                 all years of one model
  huntautogroup-texas year <slug> <year>           one model year in detail
  huntautogroup-texas guides [--q text] [--lang en|es] [--category c] [--limit N]
  huntautogroup-texas contact                      how to reach Anthony (a person, not a dealer)

Options:
  --json        print the raw JSON response
  --version     print the version
  --help        print this help

Data: NHTSA, EPA fueleconomy.gov, Transport Canada. Owner complaints are unverified reports.
A null value means the source has no record. There are no prices in this data.
Docs: https://texas.huntautogroup.com/developers/`;

function parse(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      if (["json", "help", "version"].includes(k)) opt[k] = true;
      else opt[k] = argv[++i];
    } else pos.push(a);
  }
  return { pos, opt };
}

async function get(path, query) {
  const u = new URL(BASE + path);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== true) u.searchParams.set(k, v);
  const res = await fetch(u, { headers: { accept: "application/json", "user-agent": "huntautogroup-texas-cli/" + VERSION } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body && (body.detail || body.title) ? `${body.title || "Error"}: ${body.detail || ""}` : `HTTP ${res.status}`;
    const err = new Error(msg.trim());
    err.code = (body && body.code) || "http_" + res.status;
    throw err;
  }
  return body;
}

const dash = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));
const table = (rows, cols) => {
  const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => dash(r[c]).length)));
  const line = (vals) => vals.map((v, i) => dash(v).padEnd(w[i])).join("  ").trimEnd();
  return [line(cols), line(w.map((n) => "-".repeat(n))), ...rows.map((r) => line(cols.map((c) => r[c])))].join("\n");
};

async function main() {
  const { pos, opt } = parse(process.argv.slice(2));
  if (opt.version) return console.log(VERSION);
  const cmd = pos[0];
  if (!cmd || opt.help || cmd === "help") return console.log(HELP);
  let data, text;
  switch (cmd) {
    case "models":
      data = await get("/models/", { category: opt.category, limit: opt.limit });
      text = table(data.items.map((m) => ({ slug: m.slug, name: m.name, category: m.category, years: (m.years || []).join(",") })), ["slug", "name", "category", "years"]);
      if (data.next_cursor) text += `\n(more: --limit or the API cursor ${data.next_cursor})`;
      break;
    case "model":
      if (!pos[1]) throw Object.assign(new Error("Missing <slug>. Try: huntautogroup-texas models"), { code: "usage" });
      data = await get(`/models/${encodeURIComponent(pos[1])}/`);
      text = `${data.name}  ${data.page || ""}\n` + table(data.years, ["year", "recall_campaigns", "owner_complaints", "nhtsa_overall_stars", "epa_combined_mpg"]);
      break;
    case "year":
      if (!pos[1] || !pos[2]) throw Object.assign(new Error("Usage: huntautogroup-texas year <slug> <year>"), { code: "usage" });
      data = await get(`/models/${encodeURIComponent(pos[1])}/years/${encodeURIComponent(pos[2])}/`);
      text = JSON.stringify(data, null, 2);
      break;
    case "guides":
      data = await get("/guides/", { q: opt.q, lang: opt.lang, category: opt.category, limit: opt.limit });
      text = data.items.map((g) => `${g.title}\n  https://texas.huntautogroup.com${g.path}`).join("\n");
      break;
    case "contact":
      data = await get("/contact/");
      text = JSON.stringify(data, null, 2);
      break;
    default:
      throw Object.assign(new Error(`Unknown command "${cmd}". Run: huntautogroup-texas --help`), { code: "usage" });
  }
  console.log(opt.json ? JSON.stringify(data, null, 2) : text);
}

main().catch((err) => {
  console.error(`error (${err.code || "unknown"}): ${err.message}`);
  // exitCode, not process.exit(): exiting while fetch sockets close trips a libuv assertion on Windows.
  process.exitCode = err.code === "usage" ? 2 : 1;
});
