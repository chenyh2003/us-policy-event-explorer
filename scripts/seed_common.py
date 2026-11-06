from pathlib import Path
import csv
import json

SITE = Path(__file__).resolve().parents[1]
LOCAL_DATA = SITE / "source-data"
DATA = LOCAL_DATA if LOCAL_DATA.exists() else SITE.parent / "data"
CONTENT = SITE / "content"
ROWS = {
    int(r["序号"]): r
    for r in csv.DictReader(open(DATA / "政策事件总表.csv", encoding="utf-8-sig"))
}
TAXONOMY = json.loads((CONTENT / "taxonomy.json").read_text(encoding="utf-8"))
LABELS = {i["code"]: i["label"] for i in TAXONOMY["instruments"]}

IMPACT = {
    "价格": {
        "equities": "价格约束改变毛利与定价权，行业间分化",
        "rates": "通胀预期与政策不确定性影响利率",
        "usd": "通过通胀与贸易渠道间接影响美元",
        "gold": "滞胀/避险环境下受支撑",
        "sectors": "覆盖行业及其上下游",
    },
    "黄金": {
        "equities": "黄金矿商与实际利率敏感资产受影响",
        "rates": "实际利率与美元信用重定价",
        "usd": "美元与黄金兑换关系变化",
        "gold": "直接改变黄金供需、官价或持有条件",
        "sectors": "黄金矿业、银行、外汇储备",
    },
    "工资": {
        "equities": "劳动密集型行业成本与利润率变化",
        "rates": "工资—通胀预期影响利率",
        "usd": "通过通胀与增长间接影响美元",
        "gold": "工资通胀支撑抗通胀需求",
        "sectors": "零售、餐饮、物流、制造",
    },
    "宏观": {
        "equities": "风险偏好与行业轮动变化",
        "rates": "财政/货币条件变化",
        "usd": "美元与资本流动变化",
        "gold": "避险与货币信用变化",
        "sectors": "宏观敏感行业",
    },
}

CHAIN = {
    "价格": [
        "政策设定价格、数量或准入约束",
        "企业调整产量、采购、定价或转嫁成本",
        "供需缺口与行业利润再分配",
        "通胀与股价重新定价",
    ],
    "黄金": [
        "政策改变黄金与美元的兑换条件",
        "黄金官价/市场价与美元信用重定价",
        "实际利率、美元与黄金资产配置变化",
        "黄金矿商、银行与储备资产受影响",
    ],
    "工资": [
        "政策设定工资底线、涨幅或审批程序",
        "企业调整用工、工时、福利或价格",
        "劳动成本与收入分配变化",
        "利润率与通胀预期再定价",
    ],
    "宏观": [
        "宏观冲击或制度变化出现",
        "政策工具与管制升级/转向",
        "价格、工资、资源分配与预期变化",
        "增长、通胀与市场风险偏好重定价",
    ],
}

ENTRIES = {}


def I(code, parameter, detail):
    if code not in LABELS:
        raise KeyError(f"未知工具 code: {code}")
    return {"code": code, "label": LABELS[code], "parameter": parameter, "detail": detail}


def M(label, value, note=""):
    item = {"label": label, "value": value}
    if note:
        item["note"] = note
    return item


def make(
    eid,
    summary,
    layers,
    instruments,
    targets,
    metrics,
    side,
    winners,
    losers,
    source,
    related=(),
    key="",
    chain=None,
    exemptions=None,
    enforcement="",
    exit_text="",
    market=None,
):
    row = ROWS[eid]
    cat = row["类别"]
    entry = {
        "summary": summary,
        "layers": layers,
        "instruments": instruments,
        "targets": targets,
        "exemptions": exemptions or ["无统一豁免"],
        "transmission": chain or CHAIN[cat],
        "metrics": metrics,
        "marketImpact": market or IMPACT[cat],
        "enforcement": enforcement or row["管制类型"],
        "exit": exit_text or row["结果/备注"],
        "sideEffects": side,
        "winners": winners,
        "losers": losers,
        "relatedIds": list(related),
        "sources": [source],
    }
    if key:
        entry["keyAnnotation"] = key
    ENTRIES[eid] = entry


def write_category(cat, filename):
    data = {str(k): v for k, v in sorted(ENTRIES.items()) if ROWS[k]["类别"] == cat}
    (CONTENT / filename).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"{filename}: {len(data)}")
