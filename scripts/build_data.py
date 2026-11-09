from pathlib import Path
import bisect
import csv
import datetime as dt
import json
import re
import sys

SITE = Path(__file__).resolve().parents[1]
LOCAL_DATA = SITE / "source-data"
DATA = LOCAL_DATA if LOCAL_DATA.exists() else SITE.parent / "data"
CONTENT = SITE / "content"
PUBLIC = SITE / "public" / "data"
STRICT = "--strict" in sys.argv

CATEGORY_MAP = {"价格管制": "价格", "黄金价格管制": "黄金", "工资管制": "工资"}


def normalize_date(label: str) -> tuple[str, str | None]:
    label = label.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", label):
        return label, None
    if re.fullmatch(r"\d{4}-\d{2}", label):
        return f"{label}-01", None
    m = re.fullmatch(r"(\d{4})-(\d{4})", label)
    if m:
        return f"{m.group(1)}-01-01", f"{m.group(2)}-12-31"
    if re.fullmatch(r"\d{4}", label):
        return f"{label}-01-01", None
    raise ValueError(f"无法解析日期: {label}")


def load_spx():
    rows = list(csv.DictReader(open(DATA / "标普500_1927-2026.csv", encoding="utf-8-sig")))
    return [{"date": r["date"], "close": float(r["close"])} for r in rows]


def nearest_trading_day(spx, spx_dates, date_s):
    i = bisect.bisect_left(spx_dates, date_s)
    if i >= len(spx):
        return None
    return spx[i]


def load_analysis():
    merged = {}
    for name in [
        "analysis-price.json",
        "analysis-gold.json",
        "analysis-wage.json",
        "analysis-macro.json",
    ]:
        p = CONTENT / name
        if p.exists():
            data = json.loads(p.read_text(encoding="utf-8"))
            merged.update({str(k): v for k, v in data.items()})
    return merged


def core_ids(core_rows, rows):
    matched: set[int] = set()
    for c in core_rows:
        cat = CATEGORY_MAP.get(c["类别"], c["类别"])
        d = c["日期"]
        candidates = [r for r in rows if r["日期"] == d and r["类别"] == cat]
        if not candidates:
            candidates = [r for r in rows if r["日期"][:7] == d[:7] and r["类别"] == cat]
        if not candidates:
            candidates = [r for r in rows if r["日期"][:4] == d[:4] and r["类别"] == cat]
        if not candidates:
            candidates = [r for r in rows if r["日期"] == d]
        if not candidates:
            candidates = [r for r in rows if r["日期"][:7] == d[:7]]
        if "Pay Board" in c["事件"]:
            candidates = [r for r in rows if r["序号"] == "60"] or candidates
        if c["类别"] == "工资管制" and "管制到期" in c["事件"]:
            candidates = [r for r in rows if r["序号"] == "66"] or candidates
        if candidates:
            candidates.sort(key=lambda r: abs(dt.date.fromisoformat(normalize_date(r["日期"])[0]).toordinal() - dt.date.fromisoformat(normalize_date(d)[0]).toordinal()))
            matched.add(int(candidates[0]["序号"]))
    return matched


def build_events(spx, analysis):
    spx_dates = [p["date"] for p in spx]
    rows = list(csv.DictReader(open(DATA / "政策事件总表.csv", encoding="utf-8-sig")))
    core_rows = list(csv.DictReader(open(DATA / "标普500_三类管制事件.csv", encoding="utf-8-sig")))
    core_set = core_ids(core_rows, rows)
    out = []
    missing = []
    for r in rows:
        eid = int(r["序号"])
        date_s, end_s = normalize_date(r["日期"])
        a = analysis.get(str(eid), {})
        if STRICT and not a:
            missing.append(eid)
        point = nearest_trading_day(spx, spx_dates, date_s)
        if date_s < "1927-01-01":
            status, chart_date, chart_close = "pre-1927", None, None
        elif point is None:
            status, chart_date, chart_close = "post-data", None, None
        else:
            status, chart_date, chart_close = "in-range", point["date"], point["close"]

        out.append(
            {
                "id": eid,
                "date": date_s,
                "dateLabel": r["日期"],
                "endDate": end_s,
                "category": r["类别"],
                "title": r["事件/政策"],
                "policyType": r["管制类型"],
                "coverage": r["覆盖范围"],
                "summary": a.get("summary") or r["关键内容"],
                "layers": a.get("layers", []),
                "instruments": a.get("instruments", []),
                "targets": a.get("targets", []),
                "exemptions": a.get("exemptions", []),
                "transmission": a.get("transmission", []),
                "metrics": a.get("metrics", []),
                "marketImpact": a.get(
                    "marketImpact",
                    {"equities": "", "rates": "", "usd": "", "gold": "", "sectors": ""},
                ),
                "enforcement": a.get("enforcement", r["管制类型"]),
                "exit": a.get("exit", r["结果/备注"]),
                "sideEffects": a.get("sideEffects", []),
                "winners": a.get("winners", []),
                "losers": a.get("losers", []),
                "relatedIds": a.get("relatedIds", []),
                "sources": a.get("sources", [r["详细章节"]]),
                "keyAnnotation": a.get("keyAnnotation", ""),
                "isCore32": eid in core_set,
                "chartStatus": status,
                "chartDate": chart_date,
                "chartClose": chart_close,
            }
        )
    if STRICT and missing:
        raise SystemExit(f"缺少解析的事件: {missing}")
    return sorted(out, key=lambda e: (e["date"], e["id"]))


def enrich_rate_controls(spx):
    spx_dates = [p["date"] for p in spx]
    raw = json.loads((CONTENT / "rate-control-events.json").read_text(encoding="utf-8"))
    out = []
    for event in raw["events"]:
        date_s, _ = normalize_date(event["date"])
        point = nearest_trading_day(spx, spx_dates, date_s)
        if date_s < "1927-01-01":
            status, chart_date, chart_close = "pre-1927", None, None
        elif point is None:
            status, chart_date, chart_close = "post-data", None, None
        else:
            status, chart_date, chart_close = "in-range", point["date"], point["close"]
        out.append(
            {
                **event,
                "date": date_s,
                "chartStatus": status,
                "chartDate": chart_date,
                "chartClose": chart_close,
            }
        )
    return out


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    spx = load_spx()
    events = build_events(spx, load_analysis())
    taxonomy = json.loads((CONTENT / "taxonomy.json").read_text(encoding="utf-8"))
    rates = json.loads((CONTENT / "rates.json").read_text(encoding="utf-8"))
    rate_controls = enrich_rate_controls(spx)
    tms = json.loads((CONTENT / "tms.json").read_text(encoding="utf-8"))
    yield_spread = json.loads((CONTENT / "yield-spread.json").read_text(encoding="utf-8"))
    (PUBLIC / "events.json").write_text(
        json.dumps(events, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC / "spx.json").write_text(json.dumps(spx, ensure_ascii=False), encoding="utf-8")
    (PUBLIC / "taxonomy.json").write_text(
        json.dumps(taxonomy, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC / "rates.json").write_text(
        json.dumps(rates, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC / "rate-control-events.json").write_text(
        json.dumps(rate_controls, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC / "tms.json").write_text(
        json.dumps(tms, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC / "yield-spread.json").write_text(
        json.dumps(yield_spread, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    core_count = sum(1 for e in events if e["isCore32"])
    print(f"events={len(events)} core32={core_count} spx={len(spx)} strict={STRICT}")


if __name__ == "__main__":
    main()
