# 美国政策事件交互网站 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个可部署的 React 单页网站，展示标普500与 1912—2026 的 108 条美国政策事件；所有事件默认开启、可逐条或分组关闭，并提供细分到政策工具、参数、传导链和副作用的详情解析。

**架构：** Vite + React + TypeScript 前端；Python 构建脚本把 CSV、人工解析 JSON 和标普日线合并为静态 JSON；ECharts 负责标普主图，DOM/CSS 负责政策时间轴；选择状态、筛选和详情抽屉在浏览器内完成，无后端。

**技术栈：** React 18、TypeScript 5、Vite 5、ECharts 5、Vitest、Testing Library、Python 3.14（仅构建数据）

**规格：** `C:\Users\cyh23\OneDrive\Desktop\美股\site\docs\superpowers\specs\2026-11-05-us-policy-event-explorer-design.md`

## 全局约束

- 所有事件：108 条；类别计数必须是价格 44、黄金 31、工资 26、宏观 7。
- 默认状态：108 条全部开启；每条都有独立开关；分组支持三态；提供全部开启、全部关闭、反选、核心32、K1—K11。
- 标普主图只显示 `chartStatus === "in-range"` 的事件；`pre-1927` 和 `post-data` 事件在政策时间轴展示。
- 所有 108 条必须包含细分工具、参数、传导链、关键数字、市场影响、副作用、受益/受损行业和来源。
- 不引入后端、数据库、登录或实时行情。
- Windows PowerShell 禁止 `npm.ps1`，所有 npm 命令使用 `npm.cmd`。
- 项目当前不是 git 仓库；本计划用构建/测试检查点代替 commit，不执行 `git init`。
- 所有界面文案使用中文；日期显示为 `YYYY-MM-DD`，原始模糊日期保留在 `dateLabel`。
- 详情中不确定的历史数字必须标注“口径待核”，不能写成确定事实。

## 文件结构

### 创建

- `site/package.json` — 依赖与脚本
- `site/index.html` — Vite 入口
- `site/vite.config.ts` — React 插件与 Vitest 配置
- `site/tsconfig.json` — TypeScript 配置
- `site/scripts/build_data.py` — CSV + 解析 + 标普数据合并
- `site/scripts/validate_content.py` — 108 条内容完整性校验
- `site/content/analysis-price.json` — 价格类 44 条解析
- `site/content/analysis-gold.json` — 黄金类 31 条解析
- `site/content/analysis-wage.json` — 工资类 26 条解析
- `site/content/analysis-macro.json` — 宏观类 7 条解析
- `site/content/taxonomy.json` — 6 个结构层与政策工具词典
- `site/public/data/events.json` — 构建产物，运行时读取
- `site/public/data/spx.json` — 构建产物，24,722 个日收盘
- `site/public/data/taxonomy.json` — 构建产物
- `site/src/main.tsx` — React 挂载
- `site/src/App.tsx` — 页面组装与状态
- `site/src/styles.css` — 全部样式
- `site/src/types.ts` — 领域类型
- `site/src/lib/selection.ts` — 选择状态纯函数
- `site/src/lib/filters.ts` — 筛选纯函数
- `site/src/lib/data.ts` — 数据加载与索引
- `site/src/hooks/useEventSelection.ts` — 选择状态与 localStorage
- `site/src/hooks/useEventFilters.ts` — 筛选状态
- `site/src/components/Header.tsx`
- `site/src/components/SelectionToolbar.tsx`
- `site/src/components/FilterSidebar.tsx`
- `site/src/components/EventList.tsx`
- `site/src/components/EventRow.tsx`
- `site/src/components/MarketChart.tsx`
- `site/src/components/PolicyTimeline.tsx`
- `site/src/components/EventDetailDrawer.tsx`
- `site/src/components/InstrumentChips.tsx`
- `site/src/test/setup.ts`
- `site/src/lib/selection.test.ts`
- `site/src/lib/filters.test.ts`
- `site/tests/data-validation.test.ts`

### 修改

- `site/docs/superpowers/specs/2026-11-05-us-policy-event-explorer-design.md` — 仅在实现中发现规格矛盾时更新

---

### 任务 1：初始化 Vite + React + TypeScript 工程

**文件：**
- 创建：`site/package.json`
- 创建：`site/index.html`
- 创建：`site/vite.config.ts`
- 创建：`site/tsconfig.json`
- 创建：`site/src/main.tsx`
- 创建：`site/src/App.tsx`
- 创建：`site/src/styles.css`

- [ ] **步骤 1：写 `package.json`**

```json
{
  "name": "us-policy-event-explorer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "data": "python scripts/build_data.py",
    "data:strict": "python scripts/build_data.py --strict",
    "dev": "python scripts/build_data.py && vite",
    "build": "python scripts/build_data.py && tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "echarts": "^5.5.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **步骤 2：写 `vite.config.ts` 与 `tsconfig.json`**

`vite.config.ts`：

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **步骤 3：写最小入口**

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>美国政策事件与标普500</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`：

```tsx
export default function App() {
  return <main className="app-shell"><h1>美国政策事件与标普500</h1></main>;
}
```

`src/styles.css`：

```css
:root {
  font-family: "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  color: #1f2933;
  background: #f7f7f4;
}
* { box-sizing: border-box; }
body { margin: 0; }
.app-shell { min-height: 100vh; padding: 24px; }
```

- [ ] **步骤 4：安装依赖并验证构建**

运行：

```powershell
npm.cmd install
npm.cmd run build
```

预期：安装成功，`dist/` 生成，无 TypeScript 错误。

---

### 任务 2：建立领域类型、政策工具词典和数据构建脚本

**文件：**
- 创建：`site/src/types.ts`
- 创建：`site/content/taxonomy.json`
- 创建：`site/scripts/build_data.py`
- 创建：`site/tests/data-validation.test.ts`
- 测试：`site/tests/data-validation.test.ts`

- [ ] **步骤 1：写 `src/types.ts`**

```ts
export type Category = "价格" | "黄金" | "工资" | "宏观";

export type LayerId =
  | "monetary"
  | "price_industry"
  | "labor_wage"
  | "energy_resource"
  | "health_consumption"
  | "macro_institution";

export type ChartStatus = "pre-1927" | "in-range" | "post-data";

export interface InstrumentTag {
  code: string;
  label: string;
  parameter: string;
  detail: string;
}

export interface Metric {
  label: string;
  value: string;
  note?: string;
}

export interface MarketImpact {
  equities: string;
  rates: string;
  usd: string;
  gold: string;
  sectors: string;
}

export interface PolicyEvent {
  id: number;
  date: string;
  dateLabel: string;
  endDate?: string;
  category: Category;
  title: string;
  policyType: string;
  coverage: string;
  summary: string;
  layers: LayerId[];
  instruments: InstrumentTag[];
  targets: string[];
  exemptions: string[];
  transmission: string[];
  metrics: Metric[];
  marketImpact: MarketImpact;
  enforcement: string;
  exit: string;
  sideEffects: string[];
  winners: string[];
  losers: string[];
  relatedIds: number[];
  sources: string[];
  keyAnnotation?: string;
  isCore32: boolean;
  chartStatus: ChartStatus;
  chartDate?: string;
  chartClose?: number;
}

export interface SpxPoint {
  date: string;
  close: number;
}

export interface LayerMeta {
  id: LayerId;
  label: string;
  color: string;
}

export interface InstrumentMeta {
  code: string;
  label: string;
  group: string;
  definition: string;
}

export interface Taxonomy {
  layers: LayerMeta[];
  instruments: InstrumentMeta[];
  categoryColors: Record<Category, string>;
}
```

- [ ] **步骤 2：写 `content/taxonomy.json`**

至少包含以下工具。每个 code 必须在所有 108 条解析中被使用或可被引用。

```json
{
  "layers": [
    { "id": "monetary", "label": "货币/黄金", "color": "#B7950B" },
    { "id": "price_industry", "label": "价格/产业", "color": "#D35400" },
    { "id": "labor_wage", "label": "劳动/工资", "color": "#27AE60" },
    { "id": "energy_resource", "label": "能源/资源", "color": "#A04000" },
    { "id": "health_consumption", "label": "医疗/消费", "color": "#8E44AD" },
    { "id": "macro_institution", "label": "宏观/制度", "color": "#2E86C1" }
  ],
  "categoryColors": {
    "价格": "#D35400",
    "黄金": "#B7950B",
    "工资": "#27AE60",
    "宏观": "#2E86C1"
  },
  "instruments": [
    { "code": "price_ceiling_freeze", "label": "最高限价/冻结", "group": "价格", "definition": "规定价格不得超过某一水平，或直接冻结在基准日水平。" },
    { "code": "price_floor_guarantee", "label": "最低限价/担保价", "group": "价格", "definition": "政府承诺最低收购价或价格下限。" },
    { "code": "dual_pricing", "label": "双轨价", "group": "价格", "definition": "同一商品按来源、批次或用途适用不同价格。" },
    { "code": "price_guideline", "label": "指导线/自愿合规", "group": "价格", "definition": "非强制价格或工资增长参考值。" },
    { "code": "production_quota", "label": "生产配额", "group": "数量", "definition": "限制企业或行业的生产数量。" },
    { "code": "import_quota", "label": "进口配额", "group": "数量", "definition": "限制进口数量或市场份额。" },
    { "code": "export_restriction", "label": "出口限制", "group": "数量", "definition": "禁止、许可或限制出口。" },
    { "code": "rationing_coupon", "label": "配给券", "group": "数量", "definition": "按人头或用途发票证，凭券购买。" },
    { "code": "license_permit", "label": "许可证/审批", "group": "执行", "definition": "从事生产、销售、进口或定价需要许可或事前批准。" },
    { "code": "price_notification", "label": "价格申报/事前通知", "group": "执行", "definition": "涨价前必须向主管部门申报或等待审批。" },
    { "code": "subsidy_tax_credit", "label": "补贴/税收抵免", "group": "财政", "definition": "用财政转移支付抵消价格管制或引导行为。" },
    { "code": "government_purchase_reserve", "label": "政府采购/储备", "group": "财政", "definition": "政府收储、释放库存或直接采购。" },
    { "code": "rent_control", "label": "租金管制", "group": "价格", "definition": "限制租金涨幅或设定租金上限。" },
    { "code": "anti_hoarding", "label": "反囤积/反暴利", "group": "执行", "definition": "禁止囤积、惜售或超额利润。" },
    { "code": "wage_freeze", "label": "工资冻结", "group": "工资", "definition": "禁止或限制工资上涨。" },
    { "code": "wage_ceiling", "label": "工资上限", "group": "工资", "definition": "规定工资涨幅或工资水平上限。" },
    { "code": "wage_formula_cola", "label": "工资公式/COLA", "group": "工资", "definition": "按公式、生活成本或生产率调整工资。" },
    { "code": "wage_board_arbitration", "label": "工资委员会/仲裁", "group": "工资", "definition": "由委员会审批、调解或仲裁工资争议。" },
    { "code": "cooling_off", "label": "冷却期", "group": "工资", "definition": "罢工或 lockout 前强制等待、调解。" },
    { "code": "minimum_wage", "label": "最低工资", "group": "工资", "definition": "规定工资下限。" },
    { "code": "overtime_premium", "label": "加班溢价", "group": "工资", "definition": "超过标准工时必须支付更高倍数工资。" },
    { "code": "benefits_social", "label": "福利/社保", "group": "工资", "definition": "通过福利、社保、养老金等非工资渠道补偿。" },
    { "code": "collective_bargaining", "label": "集体谈判", "group": "工资", "definition": "工会与雇主谈判工资和劳动条件。" },
    { "code": "tax_penalty_incentive", "label": "税收惩罚/激励", "group": "工资", "definition": "用税收惩罚超标涨薪或奖励合规。" },
    { "code": "official_gold_price", "label": "黄金官价", "group": "黄金", "definition": "政府设定黄金的官方美元价格。" },
    { "code": "gold_nationalization", "label": "黄金国有化/强制上缴", "group": "黄金", "definition": "要求居民或机构把黄金卖给政府。" },
    { "code": "gold_convertibility_restriction", "label": "黄金兑换限制", "group": "黄金", "definition": "限制美元兑换黄金或黄金兑换美元。" },
    { "code": "gold_export_license", "label": "黄金出口许可/禁运", "group": "黄金", "definition": "限制黄金出口或需要许可证。" },
    { "code": "gold_reserve_requirement", "label": "黄金储备要求", "group": "黄金", "definition": "要求银行或货币发行保持黄金储备比例。" },
    { "code": "gold_dual_market", "label": "黄金双轨制", "group": "黄金", "definition": "官方黄金市场与私人市场分开定价。" },
    { "code": "central_bank_sales_cap", "label": "央行售金上限", "group": "黄金", "definition": "央行之间约定售金数量上限。" },
    { "code": "gold_demonetization", "label": "黄金去货币化", "group": "黄金", "definition": "取消黄金的货币职能或官价。" },
    { "code": "private_gold_ban", "label": "私人持有禁止/合法化", "group": "黄金", "definition": "禁止或恢复居民持有黄金。" },
    { "code": "war_mobilization", "label": "战争动员", "group": "宏观", "definition": "战争时期的全面经济动员与优先分配。" },
    { "code": "fiscal_expansion", "label": "财政扩张", "group": "宏观", "definition": "政府支出、减税或赤字扩张。" },
    { "code": "monetary_regime", "label": "货币制度", "group": "宏观", "definition": "金本位、法币、汇率或央行制度变化。" },
    { "code": "trade_policy", "label": "贸易政策", "group": "宏观", "definition": "关税、禁运、贸易协定或出口管制。" },
    { "code": "regulatory_regime", "label": "监管制度", "group": "宏观", "definition": "设立监管机构、法律框架或司法规则。" }
  ]
}
```

- [ ] **步骤 3：写 `scripts/build_data.py`**

关键逻辑：

```python
from pathlib import Path
import csv, json, re, sys, datetime as dt

SITE = Path(__file__).resolve().parents[1]
DATA = SITE.parent / "data"
CONTENT = SITE / "content"
PUBLIC = SITE / "public" / "data"
STRICT = "--strict" in sys.argv

def normalize_date(label: str) -> tuple[str, str | None]:
    label = label.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", label):
        return label, None
    if re.fullmatch(r"\d{4}-\d{2}", label):
        return f"{label}-01", None
    m = re.fullmatch(r"(\d{4})-(\d{4})", label)
    if m:
        return f"{m.group(1)}-01-01", f"{m.group(2)}-12-31"
    raise ValueError(f"无法解析日期: {label}")

def load_spx():
    rows = list(csv.DictReader(open(DATA / "标普500_1927-2026.csv", encoding="utf-8-sig")))
    return [{"date": r["date"], "close": float(r["close"])} for r in rows]

def nearest_trading_day(spx, date_s):
    for p in spx:
        if p["date"] >= date_s:
            return p
    return None

def load_analysis():
    merged = {}
    for name in ["analysis-price.json", "analysis-gold.json", "analysis-wage.json", "analysis-macro.json"]:
        p = CONTENT / name
        if p.exists():
            merged.update(json.loads(p.read_text(encoding="utf-8")))
    return merged

def build_events(spx, analysis):
    rows = list(csv.DictReader(open(DATA / "政策事件总表.csv", encoding="utf-8-sig")))
    core = list(csv.DictReader(open(DATA / "标普500_三类管制事件.csv", encoding="utf-8-sig")))
    core_keys = {(r["日期"], r["事件"]) for r in core}
    out = []
    missing = []
    for r in rows:
        eid = int(r["序号"])
        date_s, end_s = normalize_date(r["日期"])
        a = analysis.get(str(eid), {})
        if STRICT and not a:
            missing.append(eid)
        point = nearest_trading_day(spx, date_s)
        if date_s < "1927-01-01":
            status, chart_date, chart_close = "pre-1927", None, None
        elif point is None:
            status, chart_date, chart_close = "post-data", None, None
        else:
            status, chart_date, chart_close = "in-range", point["date"], point["close"]
        out.append({
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
            "marketImpact": a.get("marketImpact", {"equities":"","rates":"","usd":"","gold":"","sectors":""}),
            "enforcement": a.get("enforcement", r["管制类型"]),
            "exit": a.get("exit", r["结果/备注"]),
            "sideEffects": a.get("sideEffects", []),
            "winners": a.get("winners", []),
            "losers": a.get("losers", []),
            "relatedIds": a.get("relatedIds", []),
            "sources": a.get("sources", [r["详细章节"]]),
            "keyAnnotation": a.get("keyAnnotation", ""),
            "isCore32": (r["日期"], r["事件/政策"]) in core_keys,
            "chartStatus": status,
            "chartDate": chart_date,
            "chartClose": chart_close,
        })
    if STRICT and missing:
        raise SystemExit(f"缺少解析的事件: {missing}")
    return sorted(out, key=lambda e: (e["date"], e["id"]))

def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    spx = load_spx()
    events = build_events(spx, load_analysis())
    taxonomy = json.loads((CONTENT / "taxonomy.json").read_text(encoding="utf-8"))
    (PUBLIC / "events.json").write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding="utf-8")
    (PUBLIC / "spx.json").write_text(json.dumps(spx, ensure_ascii=False), encoding="utf-8")
    (PUBLIC / "taxonomy.json").write_text(json.dumps(taxonomy, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"events={len(events)} spx={len(spx)} strict={STRICT}")

if __name__ == "__main__":
    main()
```

- [ ] **步骤 4：写数据校验测试**

`tests/data-validation.test.ts`：

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (name: string) =>
  JSON.parse(readFileSync(resolve(__dirname, "../public/data", name), "utf-8"));

describe("构建数据", () => {
  const events = read("events.json");
  const taxonomy = read("taxonomy.json");

  it("有 108 条事件，类别计数正确", () => {
    expect(events).toHaveLength(108);
    const counts = events.reduce((acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ 价格: 44, 黄金: 31, 工资: 26, 宏观: 7 });
  });

  it("ID 唯一且日期可排序", () => {
    expect(new Set(events.map((e: any) => e.id)).size).toBe(108);
    expect(events.every((e: any) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))).toBe(true);
  });

  it("工具 code 都在 taxonomy 中", () => {
    const codes = new Set(taxonomy.instruments.map((i: any) => i.code));
    for (const e of events) {
      for (const i of e.instruments) expect(codes.has(i.code)).toBe(true);
    }
  });
});
```

- [ ] **步骤 5：运行构建与测试**

```powershell
npm.cmd run data
npm.cmd run test
```

预期：`events=108`；数据测试通过。允许解析尚未补齐时部分字段为空，后续任务会补全。

---

### 任务 3：实现选择状态与筛选纯函数

**文件：**
- 创建：`site/src/lib/selection.ts`
- 创建：`site/src/lib/filters.ts`
- 创建：`site/src/lib/selection.test.ts`
- 创建：`site/src/lib/filters.test.ts`
- 创建：`site/src/hooks/useEventSelection.ts`

- [ ] **步骤 1：写失败测试**

`selection.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { invertSelection, toggleGroup, toggleOne, setAll } from "./selection";

const all = [1, 2, 3, 4];

describe("selection", () => {
  it("toggleOne 关闭再打开", () => {
    const closed = toggleOne(new Set(all), 2);
    expect([...closed]).toEqual([1, 3, 4]);
    expect([...toggleOne(closed, 2)]).toEqual([1, 2, 3, 4]);
  });

  it("setAll 全开/全关", () => {
    expect(setAll(all, true).size).toBe(4);
    expect(setAll(all, false).size).toBe(0);
  });

  it("invertSelection 反选", () => {
    expect([...invertSelection(new Set([1, 2]), all)]).toEqual([3, 4]);
  });

  it("toggleGroup 对部分选中的组执行全开", () => {
    const group = [2, 3];
    expect([...toggleGroup(new Set([2, 3]), group)]).toEqual([2, 3]);
    expect([...toggleGroup(new Set([1, 2, 3]), group)]).toEqual([1]);
    expect([...toggleGroup(new Set([1]), group)]).toEqual([1, 2, 3]);
  });
});
```

`filters.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { filterEvents } from "./filters";

const events = [
  { id: 1, title: "OPA 价格冻结", category: "价格", date: "1942-05-11", layers: ["price_industry"], instruments: [{ code: "price_ceiling_freeze", label: "最高限价/冻结" }] },
  { id: 2, title: "FLSA 最低工资", category: "工资", date: "1938-06-25", layers: ["labor_wage"], instruments: [{ code: "minimum_wage", label: "最低工资" }] },
];

describe("filterEvents", () => {
  it("按类别筛选", () => {
    expect(filterEvents(events as any, { categories: ["价格"], layers: [], era: "all", query: "", instruments: [] }).map((e) => e.id)).toEqual([1]);
  });

  it("按关键词和工具筛选", () => {
    expect(filterEvents(events as any, { categories: [], layers: [], era: "all", query: "最低", instruments: ["minimum_wage"] }).map((e) => e.id)).toEqual([2]);
  });
});
```

- [ ] **步骤 2：实现 `selection.ts`**

```ts
export function toggleOne(selected: Set<number>, id: number): Set<number> {
  const next = new Set(selected);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export function setAll(ids: number[], on: boolean): Set<number> {
  return new Set(on ? ids : []);
}

export function invertSelection(selected: Set<number>, allIds: number[]): Set<number> {
  return new Set(allIds.filter((id) => !selected.has(id)));
}

export function toggleGroup(selected: Set<number>, groupIds: number[]): Set<number> {
  const next = new Set(selected);
  const allOn = groupIds.every((id) => next.has(id));
  for (const id of groupIds) allOn ? next.delete(id) : next.add(id);
  return next;
}

export function groupState(selected: Set<number>, groupIds: number[]): "all" | "none" | "some" {
  const on = groupIds.filter((id) => selected.has(id)).length;
  return on === 0 ? "none" : on === groupIds.length ? "all" : "some";
}
```

- [ ] **步骤 3：实现 `filters.ts`**

```ts
import type { Category, LayerId, PolicyEvent } from "../types";

export interface Filters {
  categories: Category[];
  layers: LayerId[];
  era: "all" | "1912-1929" | "1930-1945" | "1946-1979" | "1980-2000" | "2001-2026";
  query: string;
  instruments: string[];
  onlySelected?: boolean;
}

export function filterEvents(events: PolicyEvent[], filters: Filters, selected?: Set<number>): PolicyEvent[] {
  const q = filters.query.trim().toLowerCase();
  return events.filter((e) => {
    if (filters.categories.length && !filters.categories.includes(e.category)) return false;
    if (filters.layers.length && !filters.layers.some((l) => e.layers.includes(l))) return false;
    if (filters.era !== "all") {
      const year = Number(e.date.slice(0, 4));
      const [a, b] = filters.era.split("-").map(Number);
      if (year < a || year > b) return false;
    }
    if (filters.instruments.length && !e.instruments.some((i) => filters.instruments.includes(i.code))) return false;
    if (filters.onlySelected && selected && !selected.has(e.id)) return false;
    if (q) {
      const hay = [e.title, e.summary, e.policyType, e.coverage, ...e.instruments.map((i) => i.label)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
```

- [ ] **步骤 4：写 `useEventSelection.ts`**

```ts
import { useEffect, useMemo, useState } from "react";
import { invertSelection, setAll, toggleGroup, toggleOne } from "../lib/selection";

const KEY = "us-policy-selection-v1";

export function useEventSelection(allIds: number[]) {
  const [selected, setSelected] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return new Set(allIds);
      const ids = JSON.parse(raw) as number[];
      const valid = ids.filter((id) => allIds.includes(id));
      return valid.length ? new Set(valid) : new Set(allIds);
    } catch {
      return new Set(allIds);
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...selected]));
  }, [selected]);

  const actions = useMemo(() => ({
    toggle: (id: number) => setSelected((s) => toggleOne(s, id)),
    allOn: () => setSelected(setAll(allIds, true)),
    allOff: () => setSelected(setAll(allIds, false)),
    invert: () => setSelected((s) => invertSelection(s, allIds)),
    group: (ids: number[]) => setSelected((s) => toggleGroup(s, ids)),
  }), [allIds]);

  return { selected, actions };
}
```

- [ ] **步骤 5：运行测试**

```powershell
npm.cmd run test -- src/lib/selection.test.ts src/lib/filters.test.ts
```

预期：全部通过。

---

### 任务 4：页面骨架、顶部工具栏、筛选侧栏和事件列表

**文件：**
- 修改：`site/src/App.tsx`
- 创建：`site/src/components/Header.tsx`
- 创建：`site/src/components/SelectionToolbar.tsx`
- 创建：`site/src/components/FilterSidebar.tsx`
- 创建：`site/src/components/EventList.tsx`
- 创建：`site/src/components/EventRow.tsx`
- 修改：`site/src/styles.css`

- [ ] **步骤 1：在 `App.tsx` 加载数据并组装布局**

```tsx
import { useEffect, useMemo, useState } from "react";
import type { PolicyEvent, SpxPoint, Taxonomy } from "./types";
import { useEventSelection } from "./hooks/useEventSelection";
import Header from "./components/Header";
import SelectionToolbar from "./components/SelectionToolbar";
import FilterSidebar from "./components/FilterSidebar";
import EventList from "./components/EventList";

export default function App() {
  const [events, setEvents] = useState<PolicyEvent[]>([]);
  const [spx, setSpx] = useState<SpxPoint[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/events.json`).then((r) => r.json()),
      fetch(`${base}data/spx.json`).then((r) => r.json()),
      fetch(`${base}data/taxonomy.json`).then((r) => r.json()),
    ]).then(([e, s, t]) => { setEvents(e); setSpx(s); setTaxonomy(t); });
  }, []);

  const allIds = useMemo(() => events.map((e) => e.id), [events]);
  const { selected, actions } = useEventSelection(allIds);

  if (!taxonomy) return <div className="loading">加载数据…</div>;

  return (
    <div className="app-shell">
      <Header total={events.length} selected={selected.size} />
      <SelectionToolbar events={events} selected={selected} actions={actions} />
      <div className="workspace">
        <FilterSidebar events={events} taxonomy={taxonomy} selected={selected} query={query} setQuery={setQuery} />
        <main className="main-panel">
          <div className="chart-placeholder">图表将在下一任务接入</div>
          <EventList events={events} selected={selected} onToggle={actions.toggle} onOpen={setActiveId} />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **步骤 2：实现 `Header` 与 `SelectionToolbar`**

`Header.tsx`：

```tsx
export default function Header({ total, selected }: { total: number; selected: number }) {
  return (
    <header className="page-header">
      <div>
        <h1>美国政策事件与标普500</h1>
        <p>1912—2026 政策事件 · 标普500日线 1927—2026 · 共 {total} 条，已开启 {selected} 条</p>
      </div>
    </header>
  );
}
```

`SelectionToolbar.tsx`：

```tsx
import type { PolicyEvent } from "../types";

export default function SelectionToolbar({ events, selected, actions }: {
  events: PolicyEvent[];
  selected: Set<number>;
  actions: { allOn: () => void; allOff: () => void; invert: () => void; group: (ids: number[]) => void };
}) {
  const core = events.filter((e) => e.isCore32).map((e) => e.id);
  const keys = events.filter((e) => e.keyAnnotation).map((e) => e.id);
  return (
    <div className="selection-toolbar">
      <button onClick={actions.allOn}>全部开启</button>
      <button onClick={actions.allOff}>全部关闭</button>
      <button onClick={actions.invert}>反选</button>
      <button onClick={() => { actions.allOff(); actions.group(core); }}>核心32</button>
      <button onClick={() => { actions.allOff(); actions.group(keys); }}>K1—K11</button>
      <span>{selected.size} / {events.length}</span>
    </div>
  );
}
```

注意：`actions.group` 是切换语义；上面“先全关再 group”可用，但如果 group 内原本全开、全关后再 group 会全开。更稳妥是在 hook 里增加 `setIds(ids)`；实现时增加 `setOnly(ids)`。

```ts
setOnly: (ids: number[]) => setSelected(new Set(ids))
```

并使用：

```tsx
<button onClick={() => actions.setOnly(core)}>核心32</button>
<button onClick={() => actions.setOnly(keys)}>K1—K11</button>
```

- [ ] **步骤 3：实现 `FilterSidebar` 与 `EventList`**

`FilterSidebar` 至少包含：

- 搜索框
- 类别复选（价格/黄金/工资/宏观）
- 结构层复选（6 层）
- 年代下拉
- 工具标签多选
- 分组开关按钮

`EventList`：

```tsx
import type { PolicyEvent } from "../types";
import EventRow from "./EventRow";

export default function EventList({ events, selected, onToggle, onOpen }: {
  events: PolicyEvent[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="event-list">
      {events.map((e) => (
        <EventRow key={e.id} event={e} checked={selected.has(e.id)} onToggle={onToggle} onOpen={onOpen} />
      ))}
    </div>
  );
}
```

`EventRow`：

```tsx
import type { PolicyEvent } from "../types";

export default function EventRow({ event, checked, onToggle, onOpen }: {
  event: PolicyEvent;
  checked: boolean;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <div className={`event-row ${checked ? "" : "is-off"}`}>
      <input type="checkbox" checked={checked} onChange={() => onToggle(event.id)} aria-label={`显示 ${event.title}`} />
      <button className="event-main" onClick={() => onOpen(event.id)}>
        <span className="event-date">{event.dateLabel}</span>
        <span className="event-title">{event.title}</span>
        <span className="event-cat">{event.category}</span>
      </button>
    </div>
  );
}
```

- [ ] **步骤 4：加基础样式并运行**

```powershell
npm.cmd run dev
```

预期：页面能加载 108 条事件；勾选/取消勾选后行状态变化；顶部计数变化；刷新后选择保留。

---

### 任务 5：标普500主图（ECharts）

**文件：**
- 创建：`site/src/components/MarketChart.tsx`
- 修改：`site/src/App.tsx`
- 修改：`site/src/styles.css`

- [ ] **步骤 1：实现 `MarketChart.tsx`**

```tsx
import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { PolicyEvent, SpxPoint, Taxonomy } from "../types";

export default function MarketChart({ spx, events, selected, taxonomy, onOpen }: {
  spx: SpxPoint[];
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onOpen: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    chart.on("click", (params) => {
      if (params.seriesType === "scatter" && params.data) {
        onOpen(Number((params.data as any[])[2]));
      }
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [onOpen]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const markers = events
      .filter((e) => selected.has(e.id) && e.chartStatus === "in-range" && e.chartDate)
      .map((e) => [e.chartDate, e.chartClose, e.id]);
    chart.setOption({
      backgroundColor: "transparent",
      animation: false,
      grid: { left: 56, right: 24, top: 36, bottom: 42 },
      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          if (p.seriesType !== "scatter") return "";
          const e = events.find((x) => x.id === Number(p.data[2]));
          return e ? `<b>${e.dateLabel}</b><br/>${e.title}<br/>${e.category} · ${e.instruments.map((i) => i.label).join(" / ")}` : "";
        },
      },
      xAxis: { type: "time", min: "1927-01-01", max: "2026-12-31" },
      yAxis: { type: "log", name: "标普500（对数）" },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 8 }],
      series: [
        {
          name: "标普500",
          type: "line",
          showSymbol: false,
          sampling: "lttb",
          data: spx.map((p) => [p.date, p.close]),
          lineStyle: { width: 1, color: "#1F4E79" },
        },
        {
          name: "政策事件",
          type: "scatter",
          symbolSize: 9,
          data: markers,
          itemStyle: {
            color: (p: any) => {
              const e = events.find((x) => x.id === Number(p.data[2]));
              return e ? taxonomy.categoryColors[e.category] : "#333";
            },
            borderColor: "#fff",
            borderWidth: 1,
          },
        },
      ],
    }, { notMerge: true });
  }, [spx, events, selected, taxonomy]);

  return <div ref={ref} className="market-chart" />;
}
```

- [ ] **步骤 2：接入 `App.tsx`**

```tsx
import MarketChart from "./components/MarketChart";
...
<MarketChart spx={spx} events={events} selected={selected} taxonomy={taxonomy} onOpen={setActiveId} />
```

删除任务 4 的 `chart-placeholder`。

- [ ] **步骤 3：样式**

```css
.market-chart { width: 100%; height: 520px; background: #fff; border: 1px solid #e3e3dc; border-radius: 10px; }
```

- [ ] **步骤 4：验证**

```powershell
npm.cmd run dev
```

预期：标普曲线正常；默认 108 条中 96 条在曲线范围显示；关闭某条后标记消失；点击标记能打开 `activeId`（详情抽屉下一任务接入）。

---

### 任务 6：政策时间轴

**文件：**
- 创建：`site/src/components/PolicyTimeline.tsx`
- 修改：`site/src/App.tsx`
- 修改：`site/src/styles.css`

- [ ] **步骤 1：实现 6 条轨道的 DOM 时间轴**

```tsx
import type { PolicyEvent, Taxonomy } from "../types";

const START = 1912, END = 2026;
const pct = (year: number) => ((year - START) / (END - START)) * 100;

export default function PolicyTimeline({ events, selected, taxonomy, onOpen }: {
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onOpen: (id: number) => void;
}) {
  const layers = taxonomy.layers;
  return (
    <section className="timeline-panel">
      <h2>政策时间轴（1912—2026）</h2>
      <div className="timeline-axis">
        {[1912, 1930, 1950, 1970, 1990, 2010, 2026].map((y) => (
          <span key={y} style={{ left: `${pct(y)}%` }}>{y}</span>
        ))}
      </div>
      <div className="timeline-lanes">
        {layers.map((layer) => {
          const laneEvents = events.filter((e) => selected.has(e.id) && e.layers.includes(layer.id));
          return (
            <div className="timeline-lane" key={layer.id}>
              <span className="lane-label">{layer.label}</span>
              <div className="lane-track">
                {laneEvents.map((e) => (
                  <button
                    key={e.id}
                    className="timeline-dot"
                    title={`${e.dateLabel} ${e.title}`}
                    style={{ left: `${pct(Number(e.date.slice(0, 4)))}%`, background: taxonomy.categoryColors[e.category] }}
                    onClick={() => onOpen(e.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **步骤 2：接入 `App.tsx`**

把 `<PolicyTimeline ... />` 放在 `MarketChart` 下方。

- [ ] **步骤 3：样式**

```css
.timeline-panel { margin-top: 18px; background: #fff; border: 1px solid #e3e3dc; border-radius: 10px; padding: 16px; }
.timeline-axis { position: relative; height: 24px; margin-left: 90px; border-bottom: 1px solid #ddd; }
.timeline-axis span { position: absolute; transform: translateX(-50%); font-size: 11px; color: #777; }
.timeline-lane { display: grid; grid-template-columns: 90px 1fr; align-items: center; height: 34px; }
.lane-label { font-size: 12px; color: #555; }
.lane-track { position: relative; height: 100%; border-bottom: 1px dashed #eee; }
.timeline-dot { position: absolute; top: 10px; width: 10px; height: 10px; border-radius: 50%; border: 1px solid #fff; transform: translateX(-50%); cursor: pointer; padding: 0; }
```

- [ ] **步骤 4：验证**

```powershell
npm.cmd run dev
```

预期：1912 年前事件可见；关闭事件后对应轨道点消失；点击点能打开详情。

---

### 任务 7：事件详情抽屉

**文件：**
- 创建：`site/src/components/EventDetailDrawer.tsx`
- 创建：`site/src/components/InstrumentChips.tsx`
- 修改：`site/src/App.tsx`
- 修改：`site/src/styles.css`

- [ ] **步骤 1：`InstrumentChips`**

```tsx
import type { InstrumentTag } from "../types";

export default function InstrumentChips({ items }: { items: InstrumentTag[] }) {
  return (
    <div className="chips">
      {items.map((i) => <span className="chip" key={`${i.code}-${i.parameter}`}>{i.label}</span>)}
    </div>
  );
}
```

- [ ] **步骤 2：`EventDetailDrawer`**

```tsx
import type { PolicyEvent } from "../types";
import InstrumentChips from "./InstrumentChips";

export default function EventDetailDrawer({ event, onClose, onToggle, selected }: {
  event: PolicyEvent | null;
  onClose: () => void;
  onToggle: (id: number) => void;
  selected: Set<number>;
}) {
  if (!event) return null;
  const on = selected.has(event.id);
  return (
    <aside className="detail-drawer">
      <div className="detail-head">
        <div>
          <div className="detail-date">{event.dateLabel} · {event.category}</div>
          <h2>{event.title}</h2>
        </div>
        <button onClick={onClose} aria-label="关闭详情">×</button>
      </div>
      <p className="detail-summary">{event.summary}</p>
      <button className={on ? "toggle-on" : "toggle-off"} onClick={() => onToggle(event.id)}>
        {on ? "关闭此节点" : "开启此节点"}
      </button>

      <h3>政策工具细分</h3>
      <InstrumentChips items={event.instruments} />
      <table className="instrument-table">
        <tbody>
          {event.instruments.map((i) => (
            <tr key={`${i.code}-${i.parameter}`}>
              <th>{i.label}</th>
              <td><b>{i.parameter}</b><br />{i.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>作用对象与豁免</h3>
      <p>{event.targets.join("、") || "—"}</p>
      <p className="muted">豁免：{event.exemptions.join("、") || "—"}</p>

      <h3>传导链</h3>
      <ol>{event.transmission.map((s, i) => <li key={i}>{s}</li>)}</ol>

      <h3>关键数字</h3>
      <ul>{event.metrics.map((m) => <li key={m.label}><b>{m.label}：</b>{m.value}{m.note ? `（${m.note}）` : ""}</li>)}</ul>

      <h3>市场影响</h3>
      <dl className="impact-grid">
        <dt>股票</dt><dd>{event.marketImpact.equities}</dd>
        <dt>利率</dt><dd>{event.marketImpact.rates}</dd>
        <dt>美元</dt><dd>{event.marketImpact.usd}</dd>
        <dt>黄金</dt><dd>{event.marketImpact.gold}</dd>
        <dt>行业</dt><dd>{event.marketImpact.sectors}</dd>
      </dl>

      <h3>执行与退出</h3>
      <p><b>执行：</b>{event.enforcement}</p>
      <p><b>退出：</b>{event.exit}</p>

      <h3>副作用</h3>
      <ul>{event.sideEffects.map((s) => <li key={s}>{s}</li>)}</ul>

      <h3>受益 / 受损</h3>
      <p><b>受益：</b>{event.winners.join("、") || "—"}</p>
      <p><b>受损：</b>{event.losers.join("、") || "—"}</p>

      <h3>来源</h3>
      <p className="muted">{event.sources.join(" · ")}</p>
    </aside>
  );
}
```

- [ ] **步骤 3：接入 `App.tsx`**

```tsx
import EventDetailDrawer from "./components/EventDetailDrawer";
...
const active = events.find((e) => e.id === activeId) ?? null;
...
<EventDetailDrawer event={active} onClose={() => setActiveId(null)} onToggle={actions.toggle} selected={selected} />
```

- [ ] **步骤 4：样式**

```css
.detail-drawer { position: fixed; top: 0; right: 0; width: min(480px, 92vw); height: 100vh; overflow: auto; background: #fff; border-left: 1px solid #e3e3dc; box-shadow: -12px 0 32px rgba(0,0,0,.08); padding: 22px; z-index: 20; }
.detail-head { display: flex; justify-content: space-between; gap: 12px; }
.detail-head h2 { margin: 4px 0 0; font-size: 20px; }
.detail-date { font-size: 12px; color: #777; }
.detail-summary { font-size: 14px; line-height: 1.7; color: #333; }
.instrument-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.instrument-table th { width: 34%; text-align: left; vertical-align: top; padding: 8px 10px 8px 0; color: #555; }
.instrument-table td { padding: 8px 0; border-top: 1px solid #eee; line-height: 1.6; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; }
.chip { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: #f1f2ed; color: #444; }
```

- [ ] **步骤 5：验证**

```powershell
npm.cmd run dev
```

预期：点击图标记、时间轴点、列表行都能打开详情；点击“关闭此节点”后该事件从图表/时间轴消失，详情仍保留并显示“开启此节点”。

---

### 任务 8：补齐价格类 44 条解析

**文件：**
- 创建：`site/content/analysis-price.json`
- 测试：`site/scripts/validate_content.py`

- [ ] **步骤 1：写 `scripts/validate_content.py`**

```python
from pathlib import Path
import json, sys

SITE = Path(__file__).resolve().parents[1]
CONTENT = SITE / "content"
TAXONOMY = json.loads((CONTENT / "taxonomy.json").read_text(encoding="utf-8"))
CODES = {i["code"] for i in TAXONOMY["instruments"]}
REQUIRED = ["summary", "layers", "instruments", "targets", "transmission", "metrics", "marketImpact", "enforcement", "exit", "sideEffects", "winners", "losers", "sources"]
EXPECTED = {"analysis-price.json": 44, "analysis-gold.json": 31, "analysis-wage.json": 26, "analysis-macro.json": 7}

ok = True
for name, count in EXPECTED.items():
    p = CONTENT / name
    if not p.exists():
        print(f"MISSING {name}"); ok = False; continue
    data = json.loads(p.read_text(encoding="utf-8"))
    if len(data) != count:
        print(f"COUNT {name}: {len(data)} != {count}"); ok = False
    for eid, item in data.items():
        for field in REQUIRED:
            if not item.get(field):
                print(f"EMPTY {name} id={eid} field={field}"); ok = False
        for ins in item.get("instruments", []):
            if ins.get("code") not in CODES:
                print(f"BAD CODE {name} id={eid} {ins.get('code')}"); ok = False
        if len(item.get("transmission", [])) < 3:
            print(f"SHORT CHAIN {name} id={eid}"); ok = False
        if len(item.get("sideEffects", [])) < 2:
            print(f"FEW SIDE EFFECTS {name} id={eid}"); ok = False
sys.exit(0 if ok else 1)
```

- [ ] **步骤 2：为价格类 44 条逐条写解析**

打开 `../data/政策事件总表.csv`，筛选 `类别=价格`，按 `序号` 写入 `analysis-price.json`。每条至少包含：

```json
{
  "7": {
    "summary": "EPAA 把石油切成旧油/新油两个价格体系，用配额和 entitlements 把低价油收益在炼厂之间再分配。",
    "layers": ["energy_resource", "price_industry"],
    "instruments": [
      { "code": "dual_pricing", "label": "双轨价", "parameter": "旧油上限约 5.25 美元/桶；新油不受上限约束", "detail": "按油田/批次划分旧油与新油，旧油执行低价，新油随市场。" },
      { "code": "production_quota", "label": "生产配额", "parameter": "炼厂按历史产量获得旧油配额", "detail": "配额决定谁能拿到低价原油，形成炼厂之间的成本差。" },
      { "code": "subsidy_tax_credit", "label": "补贴/税收抵免", "parameter": "Entitlements 现金转移", "detail": "没有足够旧油的炼厂向有旧油的炼厂购买 entitlements，平衡成本。" }
    ],
    "targets": ["原油", "炼厂", "成品油"],
    "exemptions": ["新油", "部分小炼厂"],
    "transmission": [
      "旧油价格被压到上限以下",
      "炼厂争抢旧油配额，配额成为稀缺资产",
      "成品油价格与炼化利润出现分化",
      "entitlements 把部分租金从旧油持有者转移给缺油炼厂"
    ],
    "metrics": [
      { "label": "旧油上限", "value": "约 5.25 美元/桶", "note": "1973 年 EPAA 后逐步调整" },
      { "label": "管制持续时间", "value": "1973—1981" }
    ],
    "marketImpact": {
      "equities": "炼化企业利润分化，依赖旧油配额的炼厂受益",
      "rates": "能源通胀推高利率，但管制压低部分成品油价格",
      "usd": "石油进口成本与美元走势联动",
      "gold": "滞胀环境下黄金受避险需求支撑",
      "sectors": "上游、炼化、油服、航空、运输"
    },
    "enforcement": "联邦能源办公室/DOE 分配配额并监管价格",
    "exit": "1981 年里根 EO 12287 分阶段解除石油价格管制",
    "sideEffects": ["旧油短缺与排队", "炼厂投资扭曲", "配额寻租", "进口依赖上升"],
    "winners": ["持有旧油配额的炼厂", "部分上游生产商"],
    "losers": ["缺油炼厂", "航空/运输等用油行业", "消费者"],
    "relatedIds": [9, 30],
    "sources": ["01#5.4", "07#石油"]
  }
}
```

要求：
- 每条至少 2 个工具标签（确实只有单一工具的事件可 1 个）。
- 参数必须来自 CSV 或 `01/02/03/05/07` 报告；不确定的加 `"note": "口径待核"`。
- 不能只写“配额”“管制”，必须写清配额对象、价格对象、覆盖范围或执行方式。
- `layers` 只能是 taxonomy 中的 6 个 id。
- K1—K11 事件在对应条目中加 `"keyAnnotation": "K1"` 等。

- [ ] **步骤 3：校验价格类**

```powershell
python scripts/validate_content.py
```

预期：此阶段会提示其他类别缺失；价格类本身不能有 `EMPTY`、`BAD CODE`、`SHORT CHAIN`、`FEW SIDE EFFECTS`。

---

### 任务 9：补齐黄金类 31 条解析

**文件：**
- 创建：`site/content/analysis-gold.json`

- [ ] **步骤 1：逐条写 31 条**

从 CSV 筛选 `类别=黄金`。黄金类重点是货币制度，不要只写“禁止黄金出口”。每条至少区分：

- 官价/重估
- 强制上缴/国有化
- 兑换限制
- 出口许可/禁运
- 储备要求
- 双轨制
- 私人持有
- 央行售金/去货币化

示例（EO 6102）：

```json
{
  "13": {
    "summary": "EO 6102 强制居民和机构把黄金上缴美联储，切断私人黄金与美元的自由兑换，为 1934 年美元贬值铺路。",
    "layers": ["monetary"],
    "instruments": [
      { "code": "gold_nationalization", "label": "黄金国有化/强制上缴", "parameter": "上缴价 20.67 美元/盎司；100 美元豁免", "detail": "个人、银行、企业持有黄金须在期限内卖给美联储。" },
      { "code": "private_gold_ban", "label": "私人持有禁止/合法化", "parameter": "禁止私人囤积黄金", "detail": "除首饰、工业用途和少量豁免外，私人持有黄金违法。" },
      { "code": "gold_convertibility_restriction", "label": "黄金兑换限制", "parameter": "暂停美元兑换黄金", "detail": "配合银行假日，切断黄金外流。" }
    ],
    "targets": ["居民", "银行", "企业", "黄金出口"],
    "exemptions": ["100 美元以内", "首饰/工业用途", "部分央行"],
    "transmission": [
      "私人黄金被集中到政府手中",
      "黄金兑换被切断，美元与黄金的私人兑换市场消失",
      "1934 年黄金官价从 20.67 提高到 35 美元",
      "美元对黄金贬值约 41%，以黄金计价的债务负担下降"
    ],
    "metrics": [
      { "label": "上缴价", "value": "20.67 美元/盎司" },
      { "label": "1934 年官价", "value": "35 美元/盎司" },
      { "label": "美元贬值幅度", "value": "约 41%" }
    ],
    "marketImpact": {
      "equities": "再通胀预期抬升，周期股和黄金矿股受益",
      "rates": "实际利率与通胀预期重定价",
      "usd": "美元对黄金贬值，对其它货币走向取决于后续政策",
      "gold": "官方金价重估，私人市场受限",
      "sectors": "黄金矿业、银行、出口行业"
    },
    "enforcement": "财政部/美联储执行，违规可刑事处罚",
    "exit": "1974 年 EO 11825 恢复私人持有黄金",
    "sideEffects": ["黄金黑市", "资产配置扭曲", "司法争议", "国际资本流动变化"],
    "winners": ["黄金矿商", "债务人", "出口行业"],
    "losers": ["黄金持有者", "债权人", "进口行业"],
    "relatedIds": [14, 18, 19],
    "sources": ["02#3.2", "laws/05_EO_6102_1933_全文.md"],
    "keyAnnotation": "K1"
  }
}
```

- [ ] **步骤 2：校验**

```powershell
python scripts/validate_content.py
```

预期：黄金类 31 条无空字段；工具 code 合法；传导链至少 3 步。

---

### 任务 10：补齐工资类 26 条解析

**文件：**
- 创建：`site/content/analysis-wage.json`

- [ ] **步骤 1：逐条写 26 条**

从 CSV 筛选 `类别=工资`。每条区分：

- 工资冻结/上限
- 工资公式/COLA
- 工资委员会/仲裁
- 冷却期
- 最低工资
- 加班溢价
- 福利/社保
- 集体谈判
- 税收惩罚/激励

示例（FLSA）：

```json
{
  "22": {
    "summary": "FLSA 建立联邦最低工资、44 小时标准工时和加班溢价，把工资管制从战时冻结转为长期劳动底线。",
    "layers": ["labor_wage"],
    "instruments": [
      { "code": "minimum_wage", "label": "最低工资", "parameter": "首年 0.25 美元/小时", "detail": "覆盖州际商业相关行业，后续逐步提高。" },
      { "code": "overtime_premium", "label": "加班溢价", "parameter": "超过 44 小时支付 1.5 倍", "detail": "标准工时从 44 小时逐步降到 40 小时。" }
    ],
    "targets": ["州际商业企业", "雇员"],
    "exemptions": ["农业", "家政", "部分管理岗位"],
    "transmission": [
      "低工资工人获得工资下限",
      "超过标准工时的工作成本上升",
      "企业用提高价格、减少工时或自动化消化成本",
      "劳动收入份额与行业成本结构变化"
    ],
    "metrics": [
      { "label": "首年最低工资", "value": "0.25 美元/小时" },
      { "label": "标准工时", "value": "44 小时，后降至 40 小时" },
      { "label": "加班溢价", "value": "1.5 倍" }
    ],
    "marketImpact": {
      "equities": "劳动密集型行业成本上升，自动化/效率受益",
      "rates": "工资—价格螺旋预期影响利率",
      "usd": "间接通过通胀与增长影响",
      "gold": "工资通胀支撑黄金的抗通胀属性",
      "sectors": "制造、零售、餐饮、物流"
    },
    "enforcement": "劳工部工资与工时司",
    "exit": "长期制度，未退出；标准工时和最低工资多次上调",
    "sideEffects": ["部分低技能岗位减少", "工时调整", "合规成本", "地区差异"],
    "winners": ["低工资工人", "工会", "自动化设备商"],
    "losers": ["低毛利劳动密集企业", "部分小企业"],
    "relatedIds": [23, 24, 32],
    "sources": ["03#3.2", "laws/02_价格与工资管制.md"],
    "keyAnnotation": "K2"
  }
}
```

- [ ] **步骤 2：校验**

```powershell
python scripts/validate_content.py
```

预期：工资类 26 条无空字段；至少 2 个副作用；传导链完整。

---

### 任务 11：补齐宏观类 7 条解析并严格校验 108 条

**文件：**
- 创建：`site/content/analysis-macro.json`
- 测试：`site/scripts/validate_content.py`
- 修改：`site/tests/data-validation.test.ts`

- [ ] **步骤 1：写宏观类 7 条**

从 CSV 筛选 `类别=宏观`，包括一战动员、战后通缩等。宏观条目的 `layers` 至少包含 `macro_institution`；如果与价格/货币相关，可加第二层。

示例（1917 美国参战）：

```json
{
  "4": {
    "summary": "美国参战把经济切换到战时动员，价格、工资、资源分配管制从此前的局部试验升级为全国性制度。",
    "layers": ["macro_institution", "price_industry"],
    "instruments": [
      { "code": "war_mobilization", "label": "战争动员", "parameter": "全国工业/军需优先", "detail": "设立战时工业委员会等机构，协调军需订单与原料分配。" },
      { "code": "government_purchase_reserve", "label": "政府采购/储备", "parameter": "军需采购", "detail": "政府成为关键投入品的大买家，影响价格与产能。" }
    ],
    "targets": ["工业", "军需", "食品", "燃料"],
    "exemptions": ["非军需民用部门部分豁免"],
    "transmission": [
      "军需订单扩张",
      "关键原料和运力紧张",
      "价格/工资管制与优先分配出台",
      "战后需求收缩与通胀回落"
    ],
    "metrics": [
      { "label": "参战时间", "value": "1917-04-06" },
      { "label": "管制机构", "value": "WIB、食品管理局、燃料管理局" }
    ],
    "marketImpact": {
      "equities": "军需、钢铁、化工受益，民用消费受挤压",
      "rates": "战争融资推高债务与利率",
      "usd": "金本位下资本流动与黄金储备承压",
      "gold": "战时黄金流动与出口限制加强",
      "sectors": "军工、钢铁、化工、运输"
    },
    "enforcement": "联邦政府/战时机构",
    "exit": "1918 停战后逐步解散",
    "sideEffects": ["产能扭曲", "战后通缩", "财政压力", "劳工冲突"],
    "winners": ["军工", "钢铁", "化工"],
    "losers": ["民用消费", "和平行业"],
    "relatedIds": [5, 6, 7, 8],
    "sources": ["01#3.1", "05#1917"]
  }
}
```

- [ ] **步骤 2：严格构建并校验 108 条**

```powershell
python scripts/validate_content.py
npm.cmd run data:strict
```

预期：`events=108`；无缺失解析；所有必填字段非空。

- [ ] **步骤 3：扩展数据测试**

在 `tests/data-validation.test.ts` 增加：

```ts
it("每条事件都有完整解析字段", () => {
  for (const e of events) {
    expect(e.summary.length).toBeGreaterThan(8);
    expect(e.layers.length).toBeGreaterThan(0);
    expect(e.instruments.length).toBeGreaterThan(0);
    expect(e.transmission.length).toBeGreaterThanOrEqual(3);
    expect(e.metrics.length).toBeGreaterThanOrEqual(1);
    expect(e.sideEffects.length).toBeGreaterThanOrEqual(2);
    expect(e.winners.length).toBeGreaterThan(0);
    expect(e.losers.length).toBeGreaterThan(0);
    expect(e.sources.length).toBeGreaterThan(0);
  }
});

it("关联事件 ID 都存在", () => {
  const ids = new Set(events.map((e: any) => e.id));
  for (const e of events) for (const id of e.relatedIds) expect(ids.has(id)).toBe(true);
});

it("核心32与K标注可识别", () => {
  expect(events.filter((e: any) => e.isCore32)).toHaveLength(32);
  expect(events.filter((e: any) => e.keyAnnotation).length).toBeGreaterThanOrEqual(11);
});
```

- [ ] **步骤 4：运行**

```powershell
npm.cmd run test
```

预期：全部通过。

---

### 任务 12：响应式、视觉打磨与最终验收

**文件：**
- 修改：`site/src/styles.css`
- 修改：`site/src/App.tsx`
- 修改：`site/src/components/*.tsx`

- [ ] **步骤 1：完善桌面布局**

```css
.workspace { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 18px; align-items: start; }
.sidebar { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; background: #fff; border: 1px solid #e3e3dc; border-radius: 10px; padding: 14px; }
.main-panel { min-width: 0; }
.event-list { margin-top: 18px; background: #fff; border: 1px solid #e3e3dc; border-radius: 10px; max-height: 420px; overflow: auto; }
.event-row { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-bottom: 1px solid #f0f0eb; }
.event-row.is-off { opacity: .45; }
.event-main { display: grid; grid-template-columns: 90px 1fr auto; gap: 10px; width: 100%; text-align: left; background: none; border: 0; cursor: pointer; }
```

- [ ] **步骤 2：移动端**

```css
@media (max-width: 960px) {
  .workspace { grid-template-columns: 1fr; }
  .sidebar { position: static; max-height: none; }
  .market-chart { height: 380px; }
  .detail-drawer { top: auto; bottom: 0; width: 100%; height: min(78vh, 720px); border-left: 0; border-top: 1px solid #e3e3dc; border-radius: 16px 16px 0 0; }
  .event-main { grid-template-columns: 76px 1fr; }
  .event-cat { display: none; }
}
```

- [ ] **步骤 3：空状态与错误处理**

- 数据加载失败：显示“数据加载失败，请先运行 `npm.cmd run data`”。
- 筛选无结果：显示“没有符合条件的事件”。
- 所有事件关闭：图表保留曲线，标记为空；显示“当前没有开启的事件”。

- [ ] **步骤 4：最终验收**

```powershell
python scripts/validate_content.py
npm.cmd run test
npm.cmd run build
npm.cmd run preview
```

逐项检查：

- 默认 108 条全部开启，顶部显示 `108 / 108`。
- 单条关闭后主图、时间轴、计数同步。
- 类别/结构层分组三态正常。
- 全部开启/全部关闭/反选正常。
- 核心32 只开 32 条；K1—K11 只开 11 条。
- 1927 年前 11 条在时间轴可见、可关闭。
- 2026-09-18 事件在时间轴可见，标注超出行情数据范围。
- 每条详情都有工具细分、参数、传导链、数字、副作用。
- 刷新后选择状态保留。
- `dist/` 可部署。

---

## 自检

- 规格覆盖：108 条、默认全开、逐条关闭、分组三态、核心32/K11、主图、时间轴、详情细分、localStorage、构建验收均有对应任务。
- 占位符扫描：计划中不含“待定/TODO/后续实现”；内容任务以实际字段、示例和校验命令定义。
- 类型一致性：`PolicyEvent`、`Filters`、`selection` 函数签名在任务 2/3/4/7 中保持一致；`setOnly` 在任务 4 明确加入。
