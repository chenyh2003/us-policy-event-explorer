from pathlib import Path
import json
import re
from openpyxl import load_workbook

SITE = Path(__file__).resolve().parents[1]
SOURCE = SITE / "source-data"
OUT = SITE / "content" / "rates.json"


def pct(value):
    if value is None:
        return None
    text = str(value).strip().replace("％", "%")
    m = re.search(r"(-?\d+(?:\.\d+)?)\s*%", text)
    return float(m.group(1)) if m else None


def iso(value):
    if value is None:
        return None
    text = str(value)
    return text[:10]


def build_primary():
    wb = load_workbook(SOURCE / "美联储一级信贷利率Primary_Credit_Rate_1914-2026.xlsx", data_only=True)
    points = []
    annual = wb["1914-1933年度区间"]
    for row in annual.iter_rows(min_row=3, values_only=True):
        if row[0] is None:
            continue
        try:
            year = int(row[0])
            avg = float(row[3])
        except (TypeError, ValueError):
            continue
        if avg is not None:
            points.append({"date": f"{year}-01-01", "value": avg, "note": "年度均值"})
    table = wb["时间表"]
    for row in table.iter_rows(min_row=3, values_only=True):
        d = iso(row[1])
        v = pct(row[6])
        if d and v is not None:
            points.append({"date": d, "value": v})
    wb.close()
    by_date = {}
    for p in points:
        by_date[p["date"]] = p
    return [by_date[d] for d in sorted(by_date)]


def build_reserve():
    # 取“交易存款最高档”作为单一代表序列；1933 年前为中央储备城市/最高档。
    points = [
        ("1913-12-23", 18.0, "初始：中央储备城市 18%（最高档）"),
        ("1917-06-21", 13.0, "全面下调后最高档 13%"),
        ("1936-08-16", 19.5, "三步加倍第一步"),
        ("1937-03-01", 22.75, "三步加倍第二步"),
        ("1937-05-01", 26.0, "三步加倍第三步"),
        ("1938-04-16", 22.75, "部分回调"),
        ("1941-11-01", 26.0, "二战期间恢复至上限"),
        ("1942-08-20", 24.0, "中央储备城市下调"),
        ("1942-09-14", 22.0, "中央储备城市继续下调"),
        ("1942-10-03", 20.0, "中央储备城市降至 20%"),
        ("1948-02-27", 22.0, "战后紧缩"),
        ("1948-06-11", 24.0, "战后紧缩"),
        ("1948-09-16", 26.0, "历史最高档"),
        ("1949-05-01", 24.0, "战后衰退放松"),
        ("1949-06-30", 24.0, "继续放松（最高档不变）"),
        ("1949-08-11", 23.5, "中央储备城市 23.5%"),
        ("1949-08-18", 23.0, "中央储备城市 23%"),
        ("1949-08-25", 22.5, "中央储备城市 22.5%"),
        ("1949-09-01", 22.0, "中央储备城市 22%"),
        ("1951-01-11", 23.0, "朝鲜战争后紧缩"),
        ("1951-01-25", 24.0, "继续上调"),
        ("1953-07-01", 22.0, "经济放缓放松"),
        ("1954-06-16", 21.0, "继续放松"),
        ("1954-07-29", 20.0, "继续放松"),
        ("1958-02-27", 19.5, "衰退放松"),
        ("1958-03-20", 19.0, "继续放松"),
        ("1958-04-17", 18.5, "仅中央/储备城市"),
        ("1958-04-24", 18.0, "此后至 1960-09 未变"),
        ("1960-09-01", 17.5, "中央储备城市降至 17.5%"),
        ("1960-12-01", 16.5, "中央储备城市降至 16.5%"),
        ("1968-01-11", 17.0, "储备城市净活期升至 17%"),
        ("1969-04-17", 17.5, "全面上调 0.5pp"),
        ("1973-07-19", 18.0, "最后一次全面上调净活期"),
        ("1974-12-12", 17.5, "大额活期降至 17.5%"),
        ("1975-02-13", 16.5, "高档下调 1pp"),
        ("1976-12-30", 16.25, "高档下调 0.25pp"),
        ("1980-11-13", 12.0, "MCA 过渡：交易存款高档 12%"),
        ("1992-04-02", 10.0, "交易存款统一降至 10%"),
        ("2020-03-26", 0.0, "交易存款准备金率归零"),
    ]
    return [{"date": d, "value": v, "note": n} for d, v, n in points]


def main():
    payload = {
        "primaryCredit": build_primary(),
        "reserveRequirement": build_reserve(),
        "meta": {
            "primaryCredit": {
                "label": "美联储贴现率 / 一级信贷利率",
                "unit": "%",
                "source": "美联储 H.15、FRED DISCOUNT/DPCREDIT；1914—1933 为年度均值",
            },
            "reserveRequirement": {
                "label": "法定存款准备金率（最高档）",
                "unit": "%",
                "source": "《美联储存款准备金率调整全史 1913—2026》；取交易存款最高档/中央储备城市档",
            },
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"primary={len(payload['primaryCredit'])} reserve={len(payload['reserveRequirement'])}")


if __name__ == "__main__":
    main()
