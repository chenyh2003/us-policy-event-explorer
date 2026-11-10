from pathlib import Path
import csv
import json

SITE = Path(__file__).resolve().parents[1]
SOURCE = SITE / "source-data" / "spread_10y_1y_daily.csv"
OUT = SITE / "content" / "yield-spread.json"


def normalize_date(raw):
    parts = raw.strip().replace("/", "-").split("-")
    if len(parts) != 3:
        raise ValueError(f"无法解析日期: {raw!r}")
    year, month, day = (int(part) for part in parts)
    return f"{year:04d}-{month:02d}-{day:02d}"


def main():
    points = []
    seen = set()
    with open(SOURCE, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ["date", "spread_10y_minus_1y"]:
            raise ValueError(f"意外的列名: {reader.fieldnames}")
        for line_number, row in enumerate(reader, start=2):
            date = normalize_date(row["date"])
            if date in seen:
                raise ValueError(f"第 {line_number} 行日期重复: {date}")
            try:
                value = float(row["spread_10y_minus_1y"])
            except (TypeError, ValueError) as exc:
                raise ValueError(f"第 {line_number} 行数值无效: {row['spread_10y_minus_1y']!r}") from exc
            seen.add(date)
            points.append({"date": date, "value": value})

    points.sort(key=lambda point: point["date"])
    if not points:
        raise ValueError("利差序列为空")

    monthly = sum(1 for point in points if point["date"] < "1962-02-01")
    daily = len(points) - monthly
    payload = {
        "points": points,
        "meta": {
            "label": "美国国债 10Y − 1Y 利差",
            "unit": "百分点",
            "frequency": "monthly 1872-07—1962-01; daily 1962-02—2026-08",
            "formula": "10 年期美国国债收益率 − 1 年期美国国债收益率",
            "source": "用户提供的 spread_10y_1y_daily.csv（1872-07-01—2026-08-10）",
            "monthly_count": monthly,
            "daily_count": daily,
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"points={len(points)} monthly={monthly} daily={daily} "
        f"first={points[0]['date']} last={points[-1]['date']}"
    )


if __name__ == "__main__":
    main()
