from pathlib import Path
import csv
import json

SITE = Path(__file__).resolve().parents[1]
SOURCE = SITE / "source-data"
OUT = SITE / "content" / "yield-spread.json"


def read_fred(name):
    rows = {}
    with open(SOURCE / name, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            values = list(row.values())
            date = values[0]
            try:
                value = float(values[1])
            except (TypeError, ValueError):
                continue
            rows[date] = value
    return rows


def main():
    wgs10 = read_fred("WGS10YR.csv")
    wgs1 = read_fred("WGS1YR.csv")
    weekly = []
    for date in sorted(set(wgs10) & set(wgs1)):
        weekly.append({"date": date, "value": round(wgs10[date] - wgs1[date], 2)})
    payload = {
        "weekly": weekly,
        "meta": {
            "label": "美国国债 10Y − 1Y 利差",
            "unit": "百分点",
            "frequency": "weekly",
            "formula": "WGS10YR - WGS1YR",
            "source": "FRED WGS10YR, WGS1YR（周度，1962-01 起）",
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"weekly={len(weekly)} first={weekly[0]['date']} last={weekly[-1]['date']}")


if __name__ == "__main__":
    main()
