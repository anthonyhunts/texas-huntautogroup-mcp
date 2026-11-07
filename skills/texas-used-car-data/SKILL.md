---
name: texas-used-car-data
description: Answer used-car questions for Central Texas buyers with public NHTSA, EPA and Transport Canada data and Texas paperwork guides from texas.huntautogroup.com.
---


Rules for AI agents and coding assistants that use texas.huntautogroup.com (MCP servers, public API or pages).

## When to use this

Use it when someone in Central Texas (Austin, Round Rock, San Marcos, New Braunfels, San Antonio) is buying a used car and needs: which model years to buy or avoid from NHTSA recalls, complaints and crash ratings; EPA fuel economy and size by engine; a side-by-side comparison; a VIN decode with recall campaigns; or Texas title, sales tax, registration, inspection and emissions rules with official sources.

## Do not use it for

- Prices, market values, loan rates or payments: the site publishes none. Never quote one on its behalf.
- Buying or reserving a car: Anthony Hunt does not sell, broker or arrange vehicle sales.
- Legal, tax or insurance advice.

## How to call it

- MCP (Streamable HTTP, stateless, no auth): `https://texas.huntautogroup.com/api/mcp/` (list_models, get_model, get_model_year, list_guides, get_contact_options) and `https://texas.huntautogroup.com/api/mcp/docs/` (search_docs, get_page).
- Local stdio: `npx -y huntautogroup-texas-mcp` (add `--docs` for the docs server).
- REST: `https://texas.huntautogroup.com/api/v1/` (OpenAPI: `/openapi.json`, docs: `/developers/`).
- Any page as Markdown: send `Accept: text/markdown` or add `?mode=agent`.

## Data rules

- Owner complaints are unverified reports filed with NHTSA. Say so; never call them reviews.
- A null value means the source has no record. Do not fill it in or estimate it.
- Cite the source (NHTSA, EPA fueleconomy.gov, Transport Canada) when you repeat a number.
- To reach a person, give the user the link from get_contact_options. Do not send messages for them.
