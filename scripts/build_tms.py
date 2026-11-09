from pathlib import Path
import csv
import json
import re

SITE = Path(__file__).resolve().parents[1]
SOURCE = SITE / "source-data"
OUT = SITE / "content" / "tms.json"


def read_dat(name):
    rows = {}
    for line in (SOURCE / name).read_text(encoding="utf-8", errors="ignore").splitlines():
        parts = line.split()
        if len(parts) < 3:
            continue
        try:
            year, month = int(parts[0]), int(parts[1])
            value = float(parts[2])
        except ValueError:
            continue
        rows[(year, month)] = value
    return rows


def read_fred(name):
    rows = {}
    with open(SOURCE / name, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            date = row["observation_date"]
            value = row.iloc[1] if hasattr(row, "iloc") else list(row.values())[1]
            try:
                rows[date] = float(value)
            except (TypeError, ValueError):
                continue
    return rows


def month_range(start, end):
    y, m = start
    while (y, m) <= end:
        yield y, m
        m += 1
        if m == 13:
            y, m = y + 1, 1


def main():
    m2_old = read_dat("m14144a.dat")
    m2_mid = read_dat("m14144c.dat")
    m2 = {**m2_old, **m2_mid}

    m2_sl = read_fred("M2SL.csv")
    std_sl = read_fred("STDSL.csv")
    rmf_sl = read_fred("RMFSL.csv")
    treasury = read_fred("TREASURY.csv")

    monthly = []
    for (y, m) in month_range((1912, 1), (1968, 12)):
        value = m2.get((y, m))
        if value is not None:
            monthly.append({"date": f"{y:04d}-{m:02d}-01", "value": round(value, 2), "source": "friedman_m2"})

    treasury_dates = sorted(treasury)
    treasury_start = treasury_dates[0]
    treasury_end = treasury_dates[-1]
    last_treasury = treasury[treasury_end]

    for (y, m) in month_range((1969, 1), (2026, 9)):
        date = f"{y:04d}-{m:02d}-01"
        vm = m2_sl.get(date)
        vs = std_sl.get(date, 0.0)
        vr = rmf_sl.get(date, 0.0)
        if date < treasury_start:
            vt = 0.0
        elif date > treasury_end:
            vt = last_treasury
        else:
            vt = treasury.get(date, 0.0)
        if vm is None:
            continue
        tms = vm - vs - vr + vt
        monthly.append({"date": date, "value": round(tms, 2), "source": "tms2"})

    by_date = {p["date"]: p for p in monthly}
    ordered = [by_date[d] for d in sorted(by_date)]

    before = [p for p in ordered if p["date"] < "1969-01-01"]
    after = [p for p in ordered if p["date"] >= "1969-01-01"]
    if before and after:
        ratio = after[0]["value"] / before[-1]["value"]
        for point in before:
            point["raw"] = point["value"]
            point["value"] = round(point["value"] * ratio, 2)
            point["source"] = "friedman_m2_spliced"
    ordered = before + after

    for i, point in enumerate(ordered):
        if i >= 12:
            prev = ordered[i - 12]
            point["yoy"] = round((point["value"] / prev["value"] - 1) * 100, 2)

    payload = {
        "monthly": ordered,
        "meta": {
            "label": "美国真实货币供应量 TMS",
            "unit": "十亿美元",
            "frequency": "monthly",
            "pre1969": "Friedman-Schwartz M2（NBER 14144a/14144c，月度、季调）",
            "post1969": "Rothbard-Salerno TMS2 = M2SL - STDSL - RMFSL + TREASURY",
            "splice": "1969-01",
            "splice_method": "Friedman M2 按 1969-01 TMS 水平做比例拼接；1969 年前保留 M2 增速，水平按 TMS 缩放。",
            "note": "TMS2 不含旅行支票、small time deposits、retail MMF；TREASURY 1986 年前按 0，缺失尾部按最近值。",
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"monthly={len(ordered)} first={ordered[0]['date']} last={ordered[-1]['date']} splice={payload['meta']['splice']}")


if __name__ == "__main__":
    main()
