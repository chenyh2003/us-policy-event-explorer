# 美国真实货币供应量 TMS 计算说明

> 版本：v1.0  
> 数据频率：月度  
> 覆盖区间：1912-01 至 2026-09  
> 网站：`site/`  
> 生成脚本：`site/scripts/build_tms.py`  
> 数据文件：`site/content/tms.json`（源数据在 `site/source-data/`）

## 一、口径选择

本文采用 **Rothbard–Salerno 的 TMS2** 口径。

在奥地利学派内部，TMS 有多个版本：

- **TMS1**：较窄，通常不包括储蓄存款；
- **TMS2**：较宽，包括储蓄存款和 MMDA，但不包括小额定期存款、零售货币市场基金（retail MMF）和旅行支票；
- **M Prime**：另一套更窄的口径。

本文使用 TMS2，原因是我们关注的是“可随时按面值转换为一般交换媒介”的美元索取权；储蓄存款和 MMDA 在现实中具有很高的流动性，应与活期存款一起纳入。

## 二、1969 年后的计算公式

使用 FRED 月度、季调序列：

```text
TMS2 = M2SL - STDSL - RMFSL + TREASURY
```

| 代码 | 含义 | 处理 |
|---|---|---|
| `M2SL` | M2，季调，十亿美元 | 基础总量 |
| `STDSL` | 小额定期存款（small-denomination time deposits），季调 | 扣除 |
| `RMFSL` | 零售货币市场基金（retail MMF），季调 | 扣除 |
| `TREASURY` | 存放在美联储的财政部存款 | 加回 |

### 为什么这样加减

- M2 包含：现金、活期存款、其他支票存款、储蓄存款/MMDA、小额定期存款、零售 MMF；
- TMS2 要保留：现金、活期存款、其他支票存款、储蓄存款/MMDA；
- 因此从 M2 中扣除**小额定期存款**和**零售 MMF**；
- 再加回**财政部在美联储的存款**，因为 TMS 统计的是所有经济主体的货币持有，而不只是私人部门；
- **旅行支票**在理论上属于 TMS，但金额很小，且 FRED 序列已停止维护；本文省略，不影响主要结论。

### 数据起点与缺失处理

- `M2SL`、`STDSL` 从 1959-01 开始；
- `RMFSL` 从 1973-01 开始，1973 年前按 0 处理；
- `TREASURY` 从 1986-01 开始，1986 年前按 0 处理；2025-10 之后没有新值，按 2025-10 的最后值延续；
- 本文 TMS2 从 **1969-01** 开始，这是常用 TMS 样本起点，也避开了 1959—1968 年部分组件不完整的问题。

## 三、1969 年前的 Friedman–Schwartz 代理

1969 年前没有与 TMS2 完全对应的月度组件序列。本文使用 Friedman & Schwartz《美国货币史》体系下的 **M2 月度序列**作为代理：

- NBER Macrohistory `m14144a`：1907-05 至 1946-12；
- NBER Macrohistory `m14144c`：1947-01 至 1969-09；
- 这两个序列的口径是：通货 + 商业银行活期存款 + 调整后的定期存款，季调，十亿美元；
- 本文取 1912-01 至 1968-12 的月度值。

### 比例拼接

1968-12 的 Friedman M2 为 **399.7** 十亿美元；1969-01 的 TMS2 为 **466.9** 十亿美元。两者水平不同，主要来自口径差异，而不是真实货币存量在单月跳升 17%。

为避免在图上出现虚假断点，本文做**比例拼接**：

```text
ratio = TMS2(1969-01) / M2(1968-12)
      = 466.9 / 399.7
      ≈ 1.168126

TMS_spliced(t) = M2(t) × ratio,  t < 1969-01
```

这意味着：

- 1969 年前的**增速**仍来自 Friedman–Schwartz M2；
- 1969 年前的**水平**按 1969 年 TMS 水平缩放；
- 因此 1969 年前的水平不是原始 TMS 水平，而是“与 TMS 同尺度的 M2 代理”。

## 四、同比增速

月度同比按 12 个月滞后计算：

```text
YoY(t) = (TMS(t) / TMS(t-12) - 1) × 100%
```

1969 年前使用拼接后的 TMS；由于比例拼接是常数乘法，1969 年前的同比增速与原始 Friedman M2 完全一致。

## 五、关键数值

| 月份 | TMS（十亿美元） | 同比 | 说明 |
|---|---:|---:|---|
| 1912-12 | 17.91 | — | Friedman M2 拼接 |
| 1929-12 | 53.58 | -1.51% | Friedman M2 拼接 |
| 1968-12 | 466.90 | 9.39% | Friedman M2 拼接 |
| 1969-01 | 466.90 | 9.00% | TMS2 起点 |
| 1980-12 | 785.50 | -0.18% | TMS2 |
| 2000-12 | 2,600.48 | 3.68% | TMS2 |
| 2020-12 | 18,380.19 | 38.12% | 疫情后 M2 激增 |
| 2026-09 | 19,680.53 | 6.96% | 最新 |

## 六、数据文件

| 文件 | 内容 |
|---|---|
| `site/content/tms.json` | 月频 TMS：`date`、`value`、`yoy`、`source`，1969 年前附 `raw` |
| `site/public/data/tms.json` | 网站运行时使用的构建产物 |
| `site/scripts/build_tms.py` | 读取源数据、计算 TMS、拼接、输出 JSON |
| `site/source-data/m14144a.dat` | Friedman–Schwartz/NBER M2 月度，1907-05—1946-12 |
| `site/source-data/m14144c.dat` | Friedman–Schwartz/NBER M2 月度，1947-01—1969-09 |
| `site/source-data/M2SL.csv` | FRED M2，季调，月度 |
| `site/source-data/STDSL.csv` | FRED 小额定期存款，季调，月度 |
| `site/source-data/RMFSL.csv` | FRED 零售 MMF，季调，月度 |
| `site/source-data/TREASURY.csv` | FRED 财政部在美联储存款，月度 |

## 七、复现方法

```powershell
cd "C:\Users\cyh23\OneDrive\Desktop\美股\site"
python scripts/build_tms.py
python scripts/build_data.py --strict
npm.cmd run build
```

`build_tms.py` 只读取 `source-data/` 下的本地 CSV/DAT，不依赖运行时网络。

## 八、校验

当前数据校验：

- 观测数：1,377 个月；
- 起点：1912-01；
- 终点：2026-09；
- 1968-12 与 1969-01 拼接差：< 1 十亿美元；
- 1969-01 起 `source = "tms2"`；
- 1969 年前 `source = "friedman_m2_spliced"`，并保留 `raw` 原始 M2。

## 九、限制

1. **1969 年前不是严格 TMS**：Friedman–Schwartz 没有提供与 TMS2 完全一致的月度组件拆分，M2 是代理。
2. **水平拼接不是原始数据**：1969 年前水平经过比例缩放，适合看趋势和增速，不适合当作原始 TMS 水平引用。
3. **TREASURY 覆盖不完整**：1986 年前按 0，2025-10 后按最后值延续；这会影响 TMS 的尾部水平。
4. **旅行支票省略**：金额小，且 FRED 序列停止维护。
5. **数据修订**：FRED 会修订历史 M2 组件；本文使用 2026-11 下载版本。
6. **TMS1/TMS2 争议**：若采用 TMS1，应剔除储蓄存款/MMDA，结果会明显更低。
7. **不是投资建议**：TMS 是货币度量，不构成交易信号。

## 十、参考

- Murray Rothbard, *America's Great Depression* (1963).
- Joseph T. Salerno, “The ‘True’ Money Supply: A Measure of the Supply of the Medium of Exchange in the U.S. Economy,” *Austrian Economics Newsletter* (1987).
- Milton Friedman & Anna J. Schwartz, *A Monetary History of the United States, 1867–1960* (1963).
- NBER Macrohistory Database, Series 14144a/14144c.
- FRED: `M2SL`, `STDSL`, `RMFSL`, `TREASURY`.
- Espinosa et al., “The central banking system paradox,” *Economics and Sociology* (2023), TMS 公式讨论。
