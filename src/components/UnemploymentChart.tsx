import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { UnemploymentData } from "../types";

export default function UnemploymentChart({ data }: { data: UnemploymentData }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<"annual" | "monthly">("annual");

  const points = useMemo(() => {
    if (mode === "annual") {
      return data.annual.map((p) => [`${p.year}-12-31`, p.value]);
    }
    return data.monthly.map((p) => [p.date, p.value]);
  }, [data, mode]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
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
    chart.setOption(
      {
        animation: false,
        grid: { left: 62, right: 28, top: 26, bottom: 46 },
        tooltip: {
          trigger: "axis",
          confine: true,
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            if (!p) return "";
            const date = String(p.axisValue).slice(0, 7);
            return `<b>${date}</b><br/>失业率：${Number(p.value[1]).toFixed(2)}%`;
          },
        },
        xAxis: {
          type: "time",
          axisLabel: { color: "#667085", fontSize: 10 },
          axisLine: { lineStyle: { color: "#cfd3d8" } },
        },
        yAxis: {
          type: "value",
          name: "失业率（%）",
          min: 0,
          max: mode === "annual" ? 25 : 16,
          nameTextStyle: { color: "#667085", fontSize: 10 },
          axisLabel: { color: "#667085", fontSize: 10 },
          splitLine: { lineStyle: { color: "#eef0f2", type: "dashed" } },
        },
        dataZoom: [
          { type: "inside", filterMode: "none" },
          { type: "slider", height: 14, bottom: 8, borderColor: "#e5e7eb" },
        ],
        series: [
          {
            name: "美国失业率",
            type: "line",
            showSymbol: false,
            sampling: "lttb",
            data: points,
            lineStyle: { width: 1.4, color: "#B45309" },
            itemStyle: { color: "#B45309" },
            areaStyle: { color: "rgba(180,83,9,.08)" },
          },
        ],
      },
      { notMerge: true }
    );
  }, [points, mode]);

  return (
    <section className="chart-panel unemployment-panel">
      <div className="panel-heading">
        <h2>美国失业率</h2>
        <span>{data.meta.annual_range} 年度 / {data.meta.monthly_range} 月度</span>
      </div>
      <div className="chart-legend">
        <button
          className={`rate-toggle ${mode === "annual" ? "active" : ""}`}
          onClick={() => setMode("annual")}
          type="button"
        >
          <i style={{ background: "#B45309" }} />全历史年度
        </button>
        <button
          className={`rate-toggle ${mode === "monthly" ? "active" : ""}`}
          onClick={() => setMode("monthly")}
          type="button"
        >
          <i style={{ background: "#B45309" }} />1948 年后月度
        </button>
      </div>
      <div ref={ref} className="unemployment-chart" />
      <p className="chart-note">
        来源：{data.meta.source}。{data.meta.note}
      </p>
    </section>
  );
}
