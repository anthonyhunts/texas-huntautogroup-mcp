# huntautotexas (Go SDK)

Go client for the **[Hunt Auto Group Texas](https://texas.huntautogroup.com/)** public API. That site is an educational used-car blog for Central Texas (Austin to San Antonio) by Anthony Hunt.

The client gives read-only access to public data:
- NHTSA recall campaigns, owner complaints and crash ratings
- EPA fuel economy and Transport Canada size by model year
- every guide on the site, in English and Spanish

There is no API key and no account. The package uses only the standard library. The data has no prices.

```bash
go get github.com/anthonyhunts/texas-huntautogroup-mcp/go@latest
```

```go
package main

import (
	"context"
	"errors"
	"fmt"

	huntautotexas "github.com/anthonyhunts/texas-huntautogroup-mcp/go"
)

func main() {
	c := huntautotexas.New()
	ctx := context.Background()

	trucks, _ := c.Models(ctx, huntautotexas.Query{"category": "truck", "limit": "5"})
	fmt.Println(trucks["items"])

	year, err := c.ModelYear(ctx, "toyota-tacoma", 2018)
	var apiErr *huntautotexas.APIError
	if errors.As(err, &apiErr) {
		fmt.Println(apiErr.Code) // stable code, for example model_not_found
		return
	}
	fmt.Println(year["nhtsa"])
}
```

Methods: `Index`, `Models`, `Model`, `ModelYear`, `Guides`, `Contact`. Responses come back as decoded JSON (`map[string]any`).

Errors are RFC 9457 problem details, returned as `*APIError` with a stable `Code`.

The rate limit is 60 requests per 60 seconds per IP. Over the limit, the API answers HTTP 429 and the client returns `Code` `rate_limited`.

Set `HUNTAUTO_API_URL` to use a different API base URL.

- Docs and OpenAPI: <https://texas.huntautogroup.com/developers/>
- MCP server: <https://texas.huntautogroup.com/mcp/>

Owner complaints are unverified NHTSA reports. Anthony Hunt does not sell, broker or arrange vehicle sales.
