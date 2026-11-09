# 美国政策事件与标普500

可部署的 React 单页网站：108 条 1912—2026 美国政策事件，全部可选、可逐条关闭；标普500主图、政策时间轴和结构化事件解析。

## 本地运行

```powershell
cd "C:\Users\cyh23\OneDrive\Desktop\美股\site"
npm.cmd install
npm.cmd run dev
```

打开终端提示的本地地址（通常是 `http://localhost:5173`）。

## 构建

```powershell
npm.cmd run data:strict
npm.cmd run test
npm.cmd run build
npm.cmd run preview
```

`dist/` 可部署到任意静态托管（Netlify、Vercel、GitHub Pages、Nginx）。

## GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`。推送到 `main` 后：

1. 在仓库 `Settings → Pages` 把 Source 设为 **GitHub Actions**
2. Actions 会自动构建并发布
3. 发布地址通常是 `https://<用户名>.github.io/<仓库名>/`

## 数据

- `source-data/政策事件总表.csv`：108 条事件主表
- `source-data/标普500_1927-2026.csv`：标普500日线
- `source-data/美联储一级信贷利率Primary_Credit_Rate_1914-2026.xlsx`：贴现率/一级信贷利率
- `source-data/美联储存款准备金率调整全史_1913-2026.xlsx`：法定存款准备金率
- `content/analysis-*.json`：逐条结构化解析
- `content/rates.json`：利率/准备金率曲线数据（由 `scripts/build_rates.py` 生成）
- `content/rate-control-events.json`：14 条利率管制事件（Regulation Q、收益率钉住、信用卡利率上限等）
- `content/tms.json`：1912—2026 月频 TMS（1969 年前 Friedman M2 拼接）
- `content/yield-spread.json`：1920—2026 10Y−1Y 国债利差（1920—1953 代理；1962 前月频，1962 后周频）
- `source-data/m14144a.dat`、`m14144c.dat`：Friedman-Schwartz 月频 M2（NBER Macrohistory）
- `source-data/M2SL.csv`、`STDSL.csv`、`RMFSL.csv`、`TREASURY.csv`：TMS2 组件
- `source-data/M1333AUSM156NNBR.csv`、`M1333BUSM156NNBR.csv`：长期美国国债收益率（NBER）
- `source-data/M1329AUSM193NNBR.csv`、`M1329BUSM193NNBR.csv`：短期美国国债收益率（NBER）
- `source-data/GS10.csv`、`GS1.csv`：月度 10Y/1Y 国债收益率（1953—1961）
- `source-data/WGS10YR.csv`、`WGS1YR.csv`：周度 10Y/1Y 国债收益率（1962 起）
- `content/taxonomy.json`：结构层与政策工具词典
- `public/data/`：构建产物，运行时读取

## 交互

- 默认 108 条全部开启
- 单个事件独立开关；类别/结构层/年代支持整组开关
- 全部开启、全部关闭、反选
- 预设：核心32、K1—K11
- 搜索、类别/结构层/年代/政策工具筛选
- 选择状态保存到 `localStorage`
- 主图只显示 1927—2026 可映射事件；1927 年前和 2026-06-03 后事件在时间轴展示

## 利率曲线口径

- 一级信贷利率：1914—1933 为年度均值；1934 年后按每次调整的生效日。
- 存款准备金率：取“交易存款最高档”作为单一代表序列；1933 年前为中央储备城市最高档；1980 年 MCA 过渡后取 12%，1992 年降至 10%，2020-03-26 归零。
- 两条曲线使用右轴（0—30%），可通过图例复选框关闭。
- 利率管制事件以红方块标在标普曲线上（按事件日取标普收盘）；可关闭“利率管制事件”图层。
- 鼠标十字标显示日期、左轴标普值与右轴利率/准备金率，并自动读取该日之前的利率水平。
- 悬停事件点/调整点附近会显示完整事件解析：工具、参数、摘要；利率管制事件还会显示类型、影响和来源。
- 主图下方新增独立“利率、准备金率与 10Y−1Y 利差”图；三个图（标普、利率/利差、TMS）上下相邻排列。
- 三图时间区间联动：拖动标普图底部滑块，或在任一图滚轮缩放，三图 x 轴同步。
- 利率/利差图内可分别关闭一级信贷利率、存款准备金率、10Y−1Y 利差。10Y−1Y 口径：1920—1953 用长期国债−短期国债代理；1953—1961 用 GS10−GS1 月频；1962 起用 WGS10YR−WGS1YR 周频。
- 侧栏的类别、结构层、年代、搜索、工具筛选同时作用于事件列表、主图和时间轴；方框是筛选，圆点是整组显示开关。

## 10Y−1Y 利差口径

- **1920-01—1953-03**：长期美国国债收益率 − 短期美国国债收益率（NBER m13033a/b 与 m13029a/b，短期为 3—6 个月/3 个月），月频，**代理口径，不是严格 10Y−1Y**。
- **1953-04—1961-12**：`GS10 − GS1`，月频。
- **1962-01—2026-10**：`WGS10YR − WGS1YR`，周频。
- 图上统一按日期拼接；1953 年前的水平是长短期国债利差代理，适合看曲线形态和倒挂，不宜当作严格 10Y−1Y 水平。

## TMS 口径

完整说明见：`docs/TMS计算说明.md`。

- 月频：1912-01 至 2026-09，共 1,377 个观测。
- 1912—1968：Friedman–Schwartz M2 月度序列（NBER Macrohistory 14144a/14144c，季调），按 1969-01 TMS 水平做比例拼接；保留 1969 年前 M2 增速，水平按 TMS 缩放。
- 1969—2026：Rothbard–Salerno TMS2 = `M2SL - STDSL - RMFSL + TREASURY`（FRED）；TMS2 不含旅行支票、small time deposits、retail MMF。
- 图表左轴为 TMS 水平（对数），右轴为同比增速。

## 利率管制事件口径

覆盖 14 个节点：1933 年银行法与 Regulation Q、1935 年银行法、1942 年国债收益率钉住、1951 年财政部—美联储协议、1966 年利率调整法、1970/1973 年大额 CD 上限暂停、1978 年 Marquette 案、1980 年 DIDMCA、1982 年 Garn-St Germain、1986 年 Q 条例终结、2010 年 CARD Act、2026 年信用卡 10% 上限提案。

## 说明

研究资料整理，不构成投资建议。标普500为价格指数，不含股息；1927—1957 为回溯/重构数据。
