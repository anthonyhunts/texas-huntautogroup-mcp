# huntautogroup-texas

MCP server, CLI and Python SDK for **[Hunt Auto Group Texas](https://texas.huntautogroup.com/)**, an educational used-car blog for Central Texas (Austin to San Antonio) by Anthony Hunt.

Read-only access to the public data the site shows: NHTSA recall campaigns, owner complaints and crash ratings, EPA fuel economy and Transport Canada size by model year, plus every guide in English and Spanish. No API key, no account, no dependencies. There are no prices in this data.

```bash
pip install huntautogroup-texas
```

## SDK

```python
from huntautogroup_texas import Client, ApiError

c = Client()
c.models(category="truck", limit=5)
c.model("toyota-tacoma")
c.model_year("toyota-tacoma", 2018)
c.guides(lang="es", q="titulo")
```

Errors raise `ApiError` with the API's stable `code` (for example `model_not_found`).

## CLI

```bash
huntautogroup-texas models --category truck
huntautogroup-texas model toyota-tacoma
huntautogroup-texas year toyota-tacoma 2018 --json
```

## MCP server (stdio)

```bash
huntautogroup-texas-mcp          # car data
huntautogroup-texas-mcp --docs   # search and read guides
```

It forwards to the remote servers `https://texas.huntautogroup.com/api/mcp/` and `/api/mcp/docs/`, which you can also add directly as Streamable HTTP servers.

Docs and OpenAPI: <https://texas.huntautogroup.com/developers/>. Source: <https://github.com/anthonyhunts/texas-huntautogroup-mcp>. Owner complaints are unverified NHTSA reports. Anthony Hunt does not sell, broker or arrange vehicle sales.
