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
    long_a = read_fred("M1333AUSM156NNBR.csv")
    long_b = read_fred("M1333BUSM156NNBR.csv")
    short_a = read_fred("M1329AUSM193NNBR.csv")
    short_b = read_fred("M1329BUSM193NNBR.csv")
    gs10 = read_fred("GS10.csv")
    gs1 = read_fred("GS1.csv")
    wgs10 = read_fred("WGS10YR.csv")
    wgs1 = read_fred("WGS1YR.csv")

    long_rate = {}
    for date, value in long_a.items():
        if date < "1941-10-01":
            long_rate[date] = value
    for date, value in long_b.items():
        if date >= "1941-10-01":
            long_rate[date] = value

    short_rate = {}
    for date, value in short_a.items():
        if date < "1931-01-01":
            short_rate[date] = value
    for date, value in short_b.items():
        if date >= "1931-01-01":
            short_rate[date] = value

    pre1953 = []
    for date in sorted(set(long_rate) & set(short_rate)):
        if "1920-01-01" <= date <= "1953-03-01":
            pre1953.append({"date": date, "value": round(long_rate[date] - short_rate[date], 2)})

    pre1962 = []
    for date in sorted(set(gs10) & set(gs1)):
        if "1953-04-01" <= date <= "1961-12-01":
            pre1962.append({"date": date, "value": round(gs10[date] - gs1[date], 2)})

    weekly = []
    for date in sorted(set(wgs10) & set(wgs1)):
        weekly.append({"date": date, "value": round(wgs10[date] - wgs1[date], 2)})

    payload = {
        "pre1953": pre1953,
        "pre1962": pre1962,
        "weekly": weekly,
        "meta": {
            "label": "美国国债 10Y − 1Y 利差",
            "unit": "百分点",
            "frequency": "monthly 1920-01—1961-12; weekly 1962-01+",
            "formula": "1920-01—1953-03: 长期美国国债收益率 − 短期美国国债收益率（代理）; 1953-04—1961-12: GS10 - GS1; 1962-01+: WGS10YR - WGS1YR",
            "source": "NBER m13033a/b（长期国债）与 m13029a/b（短期国债，3-6M/3M）；FRED GS10/GS1；FRED WGS10YR/WGS1YR",
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"pre1953={len(pre1953)} pre1962={len(pre1962)} weekly={len(weekly)} first={pre1953[0]['date']} last={weekly[-1]['date']}")


if __name__ == "__main__":
    main()
