"""huntautogroup-texas-mcp: stdio MCP server that forwards each JSON-RPC line to the remote,
read-only Streamable HTTP server at https://texas.huntautogroup.com/api/mcp/ (`--docs` uses /api/mcp/docs/).
Standard library only. HUNTAUTO_MCP_URL overrides the endpoint."""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://texas.huntautogroup.com/api/mcp/"


def _write(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def main():
    url = os.environ.get("HUNTAUTO_MCP_URL") or (BASE + "docs/" if "--docs" in sys.argv[1:] else BASE)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except ValueError:
            _write({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})
            continue
        for m in msg if isinstance(msg, list) else [msg]:
            is_note = not isinstance(m, dict) or "id" not in m
            req = urllib.request.Request(url, data=json.dumps(m).encode("utf-8"), method="POST",
                                         headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read().decode("utf-8")
                    if r.status == 202 or is_note or not body:
                        continue
                data = json.loads(body)
                for item in data if isinstance(data, list) else [data]:
                    _write(item)
            except (urllib.error.URLError, ValueError) as e:
                if not is_note:
                    _write({"jsonrpc": "2.0", "id": m.get("id"), "error": {"code": -32603, "message": f"Could not reach {url}: {e}"}})
    return 0


if __name__ == "__main__":
    sys.exit(main())
