// Package huntautotexas is the Go client for the Hunt Auto Group Texas public API
// (https://texas.huntautogroup.com/developers/).
//
// The API is read-only and needs no key. It serves public used-car data for Central Texas
// buyers: NHTSA recall campaigns, owner complaints and crash ratings, EPA fuel economy and
// Transport Canada size by model year, plus the site's guides in English and Spanish.
// There are no prices in this data. Owner complaints are unverified NHTSA reports.
//
// Rate limit: 60 requests per 60 seconds per IP. Over the limit the API answers HTTP 429.
//
// Responses are returned as decoded JSON (map[string]any) so new fields never break callers.
// Errors are RFC 9457 problem details, returned as *APIError with a stable Code.
package huntautotexas

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// Version is the SDK version.
const Version = "1.0.0"

// DefaultBaseURL is the production API base. HUNTAUTO_API_URL overrides it.
const DefaultBaseURL = "https://texas.huntautogroup.com/api/v1"

// Client calls the API. The zero value is not usable; create one with New.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	UserAgent  string
}

// New returns a Client with a 20-second timeout.
func New() *Client {
	base := os.Getenv("HUNTAUTO_API_URL")
	if base == "" {
		base = DefaultBaseURL
	}
	return &Client{
		BaseURL:    strings.TrimRight(base, "/"),
		HTTPClient: &http.Client{Timeout: 20 * time.Second},
		UserAgent:  "huntautogroup-texas-go/" + Version,
	}
}

// APIError is an RFC 9457 problem returned by the API. Code is stable (for example model_not_found).
type APIError struct {
	Status int    `json:"status"`
	Code   string `json:"code"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

func (e *APIError) Error() string {
	if e.Detail != "" {
		return fmt.Sprintf("%s (%s): %s", e.Title, e.Code, e.Detail)
	}
	return fmt.Sprintf("%s (%s)", e.Title, e.Code)
}

// Query holds optional query parameters; empty values are left out.
type Query map[string]string

func (c *Client) get(ctx context.Context, path string, q Query) (map[string]any, error) {
	u := c.BaseURL + path
	vals := url.Values{}
	for k, v := range q {
		if v != "" {
			vals.Set(k, v)
		}
	}
	if len(vals) > 0 {
		u += "?" + vals.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", c.UserAgent)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		apiErr := &APIError{Status: resp.StatusCode, Code: "http_" + strconv.Itoa(resp.StatusCode), Title: http.StatusText(resp.StatusCode)}
		_ = json.Unmarshal(body, apiErr)
		if resp.StatusCode == http.StatusTooManyRequests && apiErr.Code == "http_429" {
			apiErr.Code = "rate_limited"
		}
		return nil, apiErr
	}
	var out map[string]any
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("decode %s: %w", u, err)
	}
	return out, nil
}

// Index returns the API index: endpoints, docs, OpenAPI and MCP links.
func (c *Client) Index(ctx context.Context) (map[string]any, error) {
	return c.get(ctx, "/", nil)
}

// Models lists models with data. Query keys: category (truck, suv, car, minivan), limit, cursor.
func (c *Client) Models(ctx context.Context, q Query) (map[string]any, error) {
	return c.get(ctx, "/models/", q)
}

// Model returns all years of one model: recalls, complaints, NHTSA stars, EPA combined MPG.
func (c *Client) Model(ctx context.Context, slug string) (map[string]any, error) {
	return c.get(ctx, "/models/"+url.PathEscape(slug)+"/", nil)
}

// ModelYear returns one model year in detail: NHTSA, EPA engines and MPG, Transport Canada size.
func (c *Client) ModelYear(ctx context.Context, slug string, year int) (map[string]any, error) {
	return c.get(ctx, "/models/"+url.PathEscape(slug)+"/years/"+strconv.Itoa(year)+"/", nil)
}

// Guides lists or searches guides. Query keys: lang (en, es), category, q, limit, cursor.
func (c *Client) Guides(ctx context.Context, q Query) (map[string]any, error) {
	return c.get(ctx, "/guides/", q)
}

// Contact returns how a person reaches Anthony Hunt for free advice. Query key: channel.
func (c *Client) Contact(ctx context.Context, q Query) (map[string]any, error) {
	return c.get(ctx, "/contact/", q)
}
