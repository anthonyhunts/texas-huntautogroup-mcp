package huntautotexas

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testClient(h http.HandlerFunc) (*Client, func()) {
	srv := httptest.NewServer(h)
	c := New()
	c.BaseURL = srv.URL
	return c, srv.Close
}

func TestModelYearPathAndDecode(t *testing.T) {
	c, done := testClient(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/models/toyota-tacoma/years/2018/" {
			t.Errorf("path = %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"slug":"toyota-tacoma","year":2018,"nhtsa":{"recall_campaigns":3}}`))
	})
	defer done()
	got, err := c.ModelYear(context.Background(), "toyota-tacoma", 2018)
	if err != nil {
		t.Fatal(err)
	}
	if got["nhtsa"].(map[string]any)["recall_campaigns"].(float64) != 3 {
		t.Errorf("recall_campaigns = %v", got["nhtsa"])
	}
}

func TestQueryOmitsEmpty(t *testing.T) {
	c, done := testClient(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.RawQuery != "category=truck" {
			t.Errorf("query = %q", r.URL.RawQuery)
		}
		w.Write([]byte(`{"items":[]}`))
	})
	defer done()
	if _, err := c.Models(context.Background(), Query{"category": "truck", "limit": ""}); err != nil {
		t.Fatal(err)
	}
}

func TestProblemDetails(t *testing.T) {
	c, done := testClient(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/problem+json")
		w.WriteHeader(404)
		w.Write([]byte(`{"type":"x","title":"Not found","status":404,"code":"model_not_found","detail":"no such model"}`))
	})
	defer done()
	_, err := c.Model(context.Background(), "nope")
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Code != "model_not_found" || apiErr.Status != 404 {
		t.Fatalf("err = %#v", err)
	}
}

func TestRateLimited(t *testing.T) {
	c, done := testClient(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(429)
	})
	defer done()
	_, err := c.Index(context.Background())
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Code != "rate_limited" {
		t.Fatalf("err = %#v", err)
	}
}
