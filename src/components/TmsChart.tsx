import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { TmsData } from "../types";

export default function TmsChart({ tms }: { tms: TmsData }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const latest = tms.monthly[tms.monthly.length - 1];

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.group = "policy-charts";
    echarts.connect("policy-charts");
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
    const level = tms.monthly.map((p) => [p.date, p.value]);
    const yoy = tms.monthly.filter((p) => p.yoy !== undefined).map((p) => [p.date, p.yoy]);

    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 64, right: 56, top: 28, bottom: 44 },
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
            const point = tms.monthly.find((p) => p.date === date);
            if (!point) return `<b>${date}</b>`;
            return [
              `<b>${date}</b>`,
              `TMS：${point.value.toLocaleString("en-US", { maximumFractionDigits: 2 })} 十亿美元`,
              point.yoy !== undefined ? `同比：${point.yoy.toFixed(2)}%` : "",
              `<span style="color:#999">${point.source === "tms2" ? "Rothbard-Salerno TMS2" : "Friedman M2（按1969 TMS水平拼接）"}</span>`,
            ].filter(Boolean).join("<br/>");
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
          axisLabel: { color: "#667085", fontSize: 11 },
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
            type: "log",
            name: "TMS（十亿美元，对数）",
            nameTextStyle: { color: "#667085", fontSize: 10, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 10 },
            splitLine: { lineStyle: { color: "#eef0f2", type: "dashed" } },
            axisPointer: { label: { formatter: (p: any) => Number(p.value).toFixed(0) } },
          },
          {
            type: "value",
            name: "同比 (%)",
            position: "right",
            min: -20,
            max: 40,
            nameTextStyle: { color: "#667085", fontSize: 10, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 10, formatter: "{value}%" },
            splitLine: { show: false },
            axisPointer: { label: { formatter: (p: any) => `${Number(p.value).toFixed(1)}%` } },
          },
        ],
        dataZoom: [
          { type: "inside", filterMode: "none" },
          { type: "slider", show: false, filterMode: "none" },
        ],
        series: [
          {
            id: "tms",
            name: "TMS",
            type: "line",
            showSymbol: false,
            sampling: "lttb",
            data: level,
            lineStyle: { width: 1.5, color: "#1F4E79" },
            itemStyle: { color: "#1F4E79" },
            markLine: {
              symbol: "none",
              label: { formatter: "1969 TMS", color: "#8a5a00", fontSize: 9 },
              lineStyle: { color: "#B7950B", type: "dashed", width: 1 },
              data: [{ xAxis: "1969-01-01" }],
            },
            markArea: {
              silent: true,
              label: { show: true, position: "insideTop", color: "#8a94a0", fontSize: 9 },
              data: [
                [{ xAxis: "1912-01-01", name: "Friedman M2 拼接" }, { xAxis: "1969-01-01" }],
                [{ xAxis: "1969-01-01", name: "Rothbard-Salerno TMS2" }, { xAxis: "2026-12-31" }],
              ],
              itemStyle: { color: "rgba(31,78,121,.035)" },
            },
            z: 3,
          },
          {
            id: "tmsYoy",
            name: "TMS 同比",
            type: "line",
            yAxisIndex: 1,
            showSymbol: false,
            data: yoy,
            lineStyle: { width: 1.1, color: "#C0392B" },
            itemStyle: { color: "#C0392B" },
            z: 4,
          },
        ],
      },
      { replaceMerge: ["series"] }
    );
  }, [tms]);

  return (
    <section className="chart-panel tms-panel">
      <div className="panel-heading">
        <h2>美国真实货币供应量 TMS（月度）</h2>
        <span>左轴=TMS（对数）；右轴=同比；1969 年前为 Friedman M2 拼接</span>
      </div>
      <div className="chart-legend">
        <span><i style={{ background: "#1F4E79" }} />TMS 水平</span>
        <span><i style={{ background: "#C0392B" }} />同比 %</span>
        {latest ? <span className="tms-latest">最新 {latest.date.slice(0, 7)}：{latest.value.toLocaleString("en-US", { maximumFractionDigits: 0 })} 十亿美元 · 同比 {latest.yoy?.toFixed(2)}%</span> : null}
      </div>
      <p className="chart-note">
        1912—1968：Friedman–Schwartz M2 月度代理，按 1969-01 TMS 水平比例拼接；1969—2026：TMS2 = M2SL − STDSL − RMFSL + TREASURY（FRED）。TMS2 不含旅行支票、small time deposits、retail MMF。
      </p>
      <div ref={ref} className="market-chart tms-chart" />
    </section>
  );
}
