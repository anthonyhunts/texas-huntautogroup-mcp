"""huntautogroup-texas: command-line client for the Hunt Auto Group Texas public API."""
import argparse
import json
import sys

from . import __version__
from .client import ApiError, Client


def _table(rows, cols):
    cell = lambda v: "-" if v in (None, "") else str(v)
    w = [max([len(c)] + [len(cell(r.get(c))) for r in rows]) for c in cols]
    line = lambda vals: "  ".join(cell(v).ljust(w[i]) for i, v in enumerate(vals)).rstrip()
    return "\n".join([line(cols), line(["-" * n for n in w])] + [line([r.get(c) for c in cols]) for r in rows])


def main(argv=None):
    ap = argparse.ArgumentParser(prog="huntautogroup-texas",
                                 description="Used-car data for Central Texas buyers (NHTSA recalls, complaints and crash stars, EPA MPG) "
                                             "from https://texas.huntautogroup.com. Read-only, no key. There are no prices in this data.")
    ap.add_argument("--version", action="version", version=__version__)
    ap.add_argument("--json", action="store_true", help="print the raw JSON response")
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("models", help="list models with data")
    m.add_argument("--category", choices=["truck", "suv", "car", "minivan"])
    m.add_argument("--limit", type=int)
    sub.add_parser("model", help="all years of one model").add_argument("slug")
    y = sub.add_parser("year", help="one model year in detail")
    y.add_argument("slug")
    y.add_argument("year", type=int)
    g = sub.add_parser("guides", help="list or search guides")
    g.add_argument("--q")
    g.add_argument("--lang", choices=["en", "es"])
    g.add_argument("--category")
    g.add_argument("--limit", type=int)
    sub.add_parser("contact", help="how to reach Anthony (a person, not a dealer)")
    a = ap.parse_args(argv)

    c = Client()
    try:
        if a.cmd == "models":
            data = c.models(category=a.category, limit=a.limit)
            text = _table([{**x, "years": ",".join(x.get("years") or [])} for x in data["items"]], ["slug", "name", "category", "years"])
        elif a.cmd == "model":
            data = c.model(a.slug)
            text = f'{data["name"]}  {data.get("page") or ""}\n' + _table(
                data["years"], ["year", "recall_campaigns", "owner_complaints", "nhtsa_overall_stars", "epa_combined_mpg"])
        elif a.cmd == "year":
            data = c.model_year(a.slug, a.year)
            text = json.dumps(data, indent=2)
        elif a.cmd == "guides":
            data = c.guides(q=a.q, lang=a.lang, category=a.category, limit=a.limit)
            text = "\n".join(f'{x["title"]}\n  https://texas.huntautogroup.com{x["path"]}' for x in data["items"])
        else:
            data = c.contact()
            text = json.dumps(data, indent=2)
    except ApiError as e:
        print(f"error ({e.code}): {e}", file=sys.stderr)
        return 1
    print(json.dumps(data, indent=2) if a.json else text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
