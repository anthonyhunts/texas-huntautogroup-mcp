"""Hunt Auto Group Texas: Python SDK, CLI and stdio MCP server for the public used-car data API.

    from huntautogroup_texas import Client
    c = Client()
    c.model_year("toyota-tacoma", 2018)

Read-only, no API key. Docs: https://texas.huntautogroup.com/developers/
"""
from .client import ApiError, Client

__all__ = ["Client", "ApiError"]
__version__ = "1.1.0"
