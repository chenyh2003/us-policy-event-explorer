import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { RatesData, YieldSpreadData } from "../types";

export default function RateChart({
  rates,
  yieldSpread,
}: {
  rates: RatesData;
  yieldSpread: YieldSpreadData;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const updateAxisRef = useRef<(() => void) | null>(null);
  const [showCredit, setShowCredit] = useState(true);
  const [showReserve, setShowReserve] = useState(true);
  const [showSpread, setShowSpread] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.group = "policy-charts";
    echarts.connect("policy-charts");
    chart.on("dataZoom", () => updateAxisRef.current?.());
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const latest = (items: { date: string; value: number }[], date: string) => {
      let low = 0;
      let high = items.length - 1;
      let found: { date: string; value: number } | undefined;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (items[mid].date <= date) {
          found = items[mid];
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return found;
    };
    const spreadPoints = yieldSpread.points;

    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 60, right: 64, top: 26, bottom: 36 },
        tooltip: {
          trigger: "axis",
          confine: true,
          axisPointer: { type: "cross" },
          backgroundColor: "rgba(255,255,255,.97)",
          borderColor: "#ddd",
          textStyle: { color: "#222", fontSize: 12, lineHeight: 18 },
          formatter: (params: any) => {
            const arr = Array.isArray(params) ? params : [params];
            if (!arr.length) return "";
            const raw = arr[0].axisValue;
            const date = typeof raw === "number" ? new Date(raw).toISOString().slice(0, 10) : String(raw).slice(0, 10);
            const rows = [`<b>${date}</b>`];
            const credit = latest(rates.primaryCredit, date);
            const reserve = latest(rates.reserveRequirement, date);
            const spread = latest(spreadPoints, date);
            if (credit) rows.push(`一级信贷利率：${credit.value.toFixed(2)}%`);
            if (reserve) rows.push(`存款准备金率：${reserve.value.toFixed(2)}%`);
            if (spread) rows.push(`10Y−1Y 利差：${spread.value >= 0 ? "+" : ""}${spread.value.toFixed(2)}%`);
            return rows.join("<br/>");
          },
        },
        axisPointer: {
          type: "cross",
          snap: true,
          crossStyle: { color: "#94a3b8", type: "dashed", width: 1 },
          label: { show: true, backgroundColor: "#1F4E79", color: "#fff", fontSize: 10 },
        },
        xAxis: {
          type: "time",
          min: "1912-01-01",
          max: "2026-12-31",
          axisLine: { lineStyle: { color: "#cfd3d8" } },
          axisLabel: { color: "#667085", fontSize: 10 },
          splitLine: { show: false },
          axisPointer: {
            label: {
              formatter: (p: any) => {
                const d = new Date(p.value);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              },
            },
          },
        },
        yAxis: [
          {
            type: "value",
            name: "利率 / 准备金率 (%)",
            min: 0,
            max: 30,
            nameTextStyle: { color: "#667085", fontSize: 10, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 10, formatter: "{value}%" },
            splitLine: { lineStyle: { color: "#eef0f2", type: "dashed" } },
            axisPointer: { label: { formatter: (p: any) => `${Number(p.value).toFixed(2)}%` } },
          },
          {
            type: "value",
            name: "10Y−1Y (%)",
            position: "right",
            min: -3.5,
            max: 4,
            nameTextStyle: { color: "#667085", fontSize: 10, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 10, formatter: "{value}%" },
            splitLine: { show: false },
            axisPointer: { label: { formatter: (p: any) => `${Number(p.value).toFixed(2)}%` } },
          },
        ],
        dataZoom: [
          { type: "inside", filterMode: "none" },
          { type: "slider", show: false, filterMode: "none" },
        ],
        series: [
          ...(showCredit
            ? [{
                id: "primaryCredit",
                name: rates.meta.primaryCredit.label,
                type: "line",
                step: "end",
                showSymbol: false,
                data: rates.primaryCredit.map((p) => [p.date, p.value]),
                lineStyle: { width: 1.4, color: "#8E44AD" },
                itemStyle: { color: "#8E44AD" },
                z: 3,
              }]
            : []),
          ...(showReserve
            ? [{
                id: "reserveRequirement",
                name: rates.meta.reserveRequirement.label,
                type: "line",
                step: "end",
                showSymbol: false,
                data: rates.reserveRequirement.map((p) => [p.date, p.value]),
                lineStyle: { width: 1.4, color: "#2C7FB8" },
                itemStyle: { color: "#2C7FB8" },
                z: 3,
              }]
            : []),
          ...(showSpread
            ? [{
                id: "yieldSpread",
                name: yieldSpread.meta.label,
                type: "line",
                yAxisIndex: 1,
                showSymbol: false,
                data: spreadPoints.map((p) => [p.date, p.value]),
                lineStyle: { width: 1.1, color: "#16A085" },
                itemStyle: { color: "#16A085" },
                markLine: {
                  symbol: "none",
                  label: { show: false },
                  lineStyle: { color: "#94a3b8", type: "dashed", width: 0.8 },
                  data: [{ yAxis: 0 }],
                },
                z: 2.5,
              }]
            : []),
        ],
      },
      { replaceMerge: ["series"] }
    );

    const updateAxis = () => {
      const dz = (chart.getOption().dataZoom as any[])[0];
      const start = Number(dz?.start ?? 0);
      const end = Number(dz?.end ?? 100);
      if (start <= 0.5 && end >= 99.5) {
        chart.setOption({
          yAxis: [
            { min: 0, max: 30 },
            { min: -3.5, max: 4 },
          ],
        });
        return;
      }
      const toTime = (v: any) => (typeof v === "number" ? v : Date.parse(String(v)));
      const domainStart = Math.min(
        Date.parse(rates.primaryCredit[0].date),
        Date.parse(rates.reserveRequirement[0].date),
        Date.parse(yieldSpread.points[0].date)
      );
      const domainEnd = Math.max(
        Date.parse(rates.primaryCredit[rates.primaryCredit.length - 1].date),
        Date.parse(rates.reserveRequirement[rates.reserveRequirement.length - 1].date),
        Date.parse(yieldSpread.points[yieldSpread.points.length - 1].date)
      );
      const from = dz?.startValue != null
        ? toTime(dz.startValue)
        : domainStart + (domainEnd - domainStart) * start / 100;
      const to = dz?.endValue != null
        ? toTime(dz.endValue)
        : domainStart + (domainEnd - domainStart) * end / 100;
      const inWindow = (date: string) => {
        const t = Date.parse(date);
        return t >= from && t <= to;
      };
      const leftValues = [
        ...rates.primaryCredit.filter((p) => inWindow(p.date)).map((p) => p.value),
        ...rates.reserveRequirement.filter((p) => inWindow(p.date)).map((p) => p.value),
      ];
      const rightValues = yieldSpread.points.filter((p) => inWindow(p.date)).map((p) => p.value);
      const leftPad = leftValues.length
        ? Math.max((Math.max(...leftValues) - Math.min(...leftValues)) * 0.1, 0.5)
        : 0;
      const rightPad = rightValues.length
        ? Math.max((Math.max(...rightValues) - Math.min(...rightValues)) * 0.1, 0.05)
        : 0;
      chart.setOption({
        yAxis: [
          leftValues.length
            ? {
                min: Math.max(0, Math.min(...leftValues) - leftPad),
                max: Math.max(...leftValues) + leftPad,
              }
            : {},
          rightValues.length
            ? {
                min: Math.min(...rightValues) - rightPad,
                max: Math.max(...rightValues) + rightPad,
              }
            : {},
        ],
      });
    };
    updateAxisRef.current = updateAxis;
    updateAxis();
  }, [rates, yieldSpread, showCredit, showReserve, showSpread]);

  return (
    <section className="chart-panel rate-panel">
      <div className="panel-heading">
        <h2>利率、准备金率与 10Y−1Y 利差</h2>
        <span>左轴=信贷利率/准备金率；右轴=10Y−1Y；月/日混合频率</span>
      </div>
      <div className="chart-legend">
        <label className="rate-toggle">
          <input type="checkbox" checked={showCredit} onChange={(e) => setShowCredit(e.target.checked)} />
          <i style={{ background: "#8E44AD" }} />一级信贷利率
        </label>
        <label className="rate-toggle">
          <input type="checkbox" checked={showReserve} onChange={(e) => setShowReserve(e.target.checked)} />
          <i style={{ background: "#2C7FB8" }} />存款准备金率
        </label>
        <label className="rate-toggle">
          <input type="checkbox" checked={showSpread} onChange={(e) => setShowSpread(e.target.checked)} />
          <i style={{ background: "#16A085" }} />10Y−1Y 利差
        </label>
      </div>
      <p className="chart-note">
        一级信贷利率/准备金率为月频；10Y−1Y 采用用户提供的 1872—2026 序列（1872-07—1962-01 月频，1962-02 起日频），图中展示 1912 年起并与三图联动区间一致；1948 年前准备金率为最高档。
      </p>
      <div ref={ref} className="market-chart rate-chart" />
    </section>
  );
}
