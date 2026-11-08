# huntautogroup-texas-mcp

MCP server for **[Hunt Auto Group Texas](https://texas.huntautogroup.com/)**, an educational used-car blog for Central Texas (Austin to San Antonio) by Anthony Hunt.

It gives AI agents read-only access to public data the site already shows:

- NHTSA recall campaigns, owner complaints and crash ratings by model year
- EPA engines, transmissions and fuel economy
- Transport Canada length, width, height, wheelbase and curb weight
- Every published guide (Texas title, sales tax, inspection, auctions, model reviews and comparisons), in English and Spanish

No API key, no account, nothing stored. Prices are never published.

## Use it

Remote (recommended): add a Streamable HTTP server pointing to

```
https://texas.huntautogroup.com/api/mcp/        # car data
https://texas.huntautogroup.com/api/mcp/docs/   # search and read guides
```

Local stdio (Node 18+):

```bash
npx -y huntautogroup-texas-mcp          # car data
npx -y huntautogroup-texas-mcp --docs   # guides
```

Claude Desktop / Cursor config:

```json
{ "mcpServers": { "huntautogroup-texas": { "command": "npx", "args": ["-y", "huntautogroup-texas-mcp"] } } }
```

Claude Code plugin: this repo is a plugin (`.claude-plugin/plugin.json`) that registers both remote servers.

## Command-line tool

The same package ships a CLI, `huntautogroup-texas`, for scripts and terminals:

```bash
npx -p huntautogroup-texas-mcp huntautogroup-texas models --category truck
npx -p huntautogroup-texas-mcp huntautogroup-texas model toyota-tacoma
npx -p huntautogroup-texas-mcp huntautogroup-texas year toyota-tacoma 2018
npx -p huntautogroup-texas-mcp huntautogroup-texas guides --q uber --lang en
```

Add `--json` for the raw API response. Exit code 1 means an API error (its stable `code` is printed), 2 means a usage error.

Python: `pip install huntautogroup-texas` gives the same CLI plus a small SDK (`from huntautogroup_texas import Client`) and the stdio MCP server (`huntautogroup-texas-mcp`).

## Tools

| Server | Tool | What it returns |
|---|---|---|
| data | `list_models` | Models with data, by category, paginated |
| data | `get_model` | All years of one model: recalls, complaints, stars, EPA combined MPG |
| data | `get_model_year` | One model year in detail (NHTSA, EPA, size) |
| data | `list_guides` | Guides by language, category or keywords |
| data | `get_contact_options` | How a person reaches Anthony (free advice) |
| docs | `search_docs` | Search guides and tool pages |
| docs | `get_page` | Any page as Markdown |

Rules for agents: [AGENTS.md](AGENTS.md). Developer docs, REST API and OpenAPI: <https://texas.huntautogroup.com/developers/>. Listed in the official MCP Registry as `com.huntautogroup.texas/data` and `com.huntautogroup.texas/docs`.

Owner complaints are unverified NHTSA reports. Anthony Hunt does not sell, broker or arrange vehicle sales.

## License

MIT for this code. Data comes from NHTSA, the EPA (fueleconomy.gov) and Transport Canada.
