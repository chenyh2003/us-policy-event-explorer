import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { PolicyEvent, RatesData, SpxPoint, Taxonomy } from "../types";

export default function MarketChart({
  spx,
  rates,
  events,
  selected,
  taxonomy,
  onOpen,
}: {
  spx: SpxPoint[];
  rates: RatesData;
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onOpen: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const onOpenRef = useRef(onOpen);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const [showCredit, setShowCredit] = useState(true);
  const [showReserve, setShowReserve] = useState(true);
  const [showRatePoints, setShowRatePoints] = useState(true);

  const spotsFor = (items: RatesData["reserveRequirement"]) =>
    items.flatMap((e) => {
      if (e.date < "1927-01-01") return [];
      let lo = 0;
      let hi = spx.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (spx[mid].date < e.date) lo = mid + 1;
        else hi = mid;
      }
      const point = spx[lo];
      if (!point || point.date < e.date) return [];
      return [[point.date, point.close, e.date, e.value, e.note ?? ""]];
    });

  const creditSpots = useMemo(
    () => spotsFor(rates.primaryCreditEvents),
    [rates.primaryCreditEvents, spx]
  );
  const reserveSpots = useMemo(
    () => spotsFor(rates.reserveRequirement),
    [rates.reserveRequirement, spx]
  );

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.on("click", (params) => {
      if (params.seriesType === "scatter" && Array.isArray(params.data)) {
        const id = Number((params.data as unknown[])[2]);
        if (Number.isFinite(id)) onOpenRef.current(id);
      }
    });
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
    const inRange = events.filter(
      (e) => selected.has(e.id) && e.chartStatus === "in-range" && e.chartDate
    );
    const normal = inRange.filter((e) => !e.keyAnnotation);
    const keys = inRange.filter((e) => e.keyAnnotation);
    const pointOf = (e: PolicyEvent) => [e.chartDate, e.chartClose, e.id];
    const colorOf = (e: PolicyEvent | undefined) =>
      e ? taxonomy.categoryColors[e.category] : "#555";
    const tooltipOf = (e: PolicyEvent) =>
      [
        `<b>${e.dateLabel} · ${e.title}</b>`,
        `${e.category} · ${e.layers.join(" / ")}`,
        e.instruments.map((i) => `${i.label}：${i.parameter}`).join("<br/>"),
        e.summary,
      ].join("<br/>");

    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 60, right: 64, top: 34, bottom: 58 },
        tooltip: {
          trigger: "item",
          confine: true,
          backgroundColor: "rgba(255,255,255,.97)",
          borderColor: "#ddd",
          textStyle: { color: "#222", fontSize: 12, lineHeight: 18 },
          formatter: (p: any) => {
            if (p.seriesType === "line" && p.seriesName !== "标普500" && Array.isArray(p.value)) {
              return `<b>${p.seriesName}</b><br/>${p.name}：${p.value[1]}%`;
            }
            if (p.seriesId === "creditSpots" || p.seriesId === "reserveSpots") {
              const [spxDate, spxClose, eventDate, rateValue, note] = p.data as any[];
              return `<b>${p.seriesName}</b><br/>事件日：${eventDate}<br/>利率：${rateValue}%<br/>标普收盘：${Number(spxClose).toFixed(2)}（${spxDate}）<br/>${note ?? ""}`;
            }
            if (p.seriesType !== "scatter" || !Array.isArray(p.data)) return "";
            const e = eventsById.get(Number(p.data[2]));
            return e ? tooltipOf(e) : "";
          },
        },
        xAxis: {
          type: "time",
          min: "1912-01-01",
          max: "2026-12-31",
          axisLine: { lineStyle: { color: "#cfd3d8" } },
          axisLabel: { color: "#667085", fontSize: 11 },
          splitLine: { show: false },
        },
        yAxis: [
          {
            type: "log",
            name: "标普500（对数）",
            nameTextStyle: { color: "#667085", fontSize: 11, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 11 },
            splitLine: { lineStyle: { color: "#eef0f2", type: "dashed" } },
          },
          {
            type: "value",
            name: "利率 / 准备金率 (%)",
            position: "right",
            min: 0,
            max: 30,
            nameTextStyle: { color: "#667085", fontSize: 10, padding: [0, 0, 6, 0] },
            axisLabel: { color: "#667085", fontSize: 10, formatter: "{value}%" },
            splitLine: { show: false },
          },
        ],
        dataZoom: [
          { type: "inside", filterMode: "none" },
          {
            type: "slider",
            height: 18,
            bottom: 10,
            borderColor: "#e5e7eb",
            fillerColor: "rgba(31,78,121,.12)",
            handleStyle: { color: "#1F4E79" },
            textStyle: { color: "#667085", fontSize: 10 },
          },
        ],
        series: [
          {
            id: "spx",
            name: "标普500",
            type: "line",
            showSymbol: false,
            sampling: "lttb",
            data: spx.map((p) => [p.date, p.close]),
            lineStyle: { width: 1.2, color: "#1F4E79" },
            itemStyle: { color: "#1F4E79" },
            z: 1,
          },
          ...(showCredit
            ? [{
                id: "primaryCredit",
                name: rates.meta.primaryCredit.label,
                type: "line",
                yAxisIndex: 1,
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
                yAxisIndex: 1,
                step: "end",
                showSymbol: false,
                data: rates.reserveRequirement.map((p) => [p.date, p.value]),
                lineStyle: { width: 1.4, color: "#2C7FB8" },
                itemStyle: { color: "#2C7FB8" },
                z: 3,
              }]
            : []),
          ...(showCredit && showRatePoints
            ? [{
                id: "creditSpots",
                name: "一级信贷利率调整点",
                type: "scatter",
                symbol: "circle",
                symbolSize: 6,
                data: creditSpots,
                itemStyle: { color: "#8E44AD", borderColor: "#fff", borderWidth: 0.8 },
                z: 4,
              }]
            : []),
          ...(showReserve && showRatePoints
            ? [{
                id: "reserveSpots",
                name: "存款准备金率调整点",
                type: "scatter",
                symbol: "diamond",
                symbolSize: 7,
                data: reserveSpots,
                itemStyle: { color: "#2C7FB8", borderColor: "#fff", borderWidth: 0.8 },
                z: 4,
              }]
            : []),
          {
            id: "events",
            name: "政策事件",
            type: "scatter",
            data: normal.map(pointOf),
            symbolSize: 8,
            itemStyle: {
              color: (p: any) => colorOf(eventsById.get(Number(p.data[2]))),
              borderColor: "#fff",
              borderWidth: 1,
            },
            emphasis: { scale: 1.8 },
            z: 5,
          },
          {
            id: "keys",
            name: "关键标注",
            type: "scatter",
            symbol: "diamond",
            symbolSize: 14,
            data: keys.map(pointOf),
            itemStyle: {
              color: (p: any) => colorOf(eventsById.get(Number(p.data[2]))),
              borderColor: "#fff",
              borderWidth: 1.5,
            },
            label: {
              show: true,
              position: "top",
              distance: 4,
              formatter: (p: any) => eventsById.get(Number(p.data[2]))?.keyAnnotation ?? "",
              color: "#1f2937",
              fontSize: 9,
              fontWeight: 700,
            },
            emphasis: { scale: 1.4 },
            z: 6,
          },
        ],
      },
      { replaceMerge: ["series"] }
    );
  }, [spx, rates, events, selected, taxonomy, eventsById, showCredit, showReserve, showRatePoints, creditSpots, reserveSpots]);

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <h2>标普500、政策利率与准备金率</h2>
        <span>左轴=标普500（对数）；右轴=利率/准备金率（%）；事件看时间轴</span>
      </div>
      <div className="chart-legend">
        {Object.entries(taxonomy.categoryColors).map(([cat, color]) => (
          <span key={cat}><i style={{ background: color }} />{cat}</span>
        ))}
        <span className="key-legend"><i className="diamond" />K1—K11 关键标注</span>
        <label className="rate-toggle">
          <input type="checkbox" checked={showCredit} onChange={(e) => setShowCredit(e.target.checked)} />
          <i style={{ background: "#8E44AD" }} />一级信贷利率
        </label>
        <label className="rate-toggle">
          <input type="checkbox" checked={showReserve} onChange={(e) => setShowReserve(e.target.checked)} />
          <i style={{ background: "#2C7FB8" }} />存款准备金率
        </label>
        <label className="rate-toggle">
          <input type="checkbox" checked={showRatePoints} onChange={(e) => setShowRatePoints(e.target.checked)} />
          <i className="rate-dot" />调整点（标在标普上）
        </label>
      </div>
      <p className="chart-note">
        来源：美联储 H.15/FRED；准备金率取交易存款最高档，1933 年前为中央储备城市最高档；1914—1933 年信贷利率为年度均值；调整点按事件日映射到标普收盘价；1927 年前及超出行情数据范围的调整点不显示在标普上。
      </p>
      <div ref={ref} className="market-chart" />
    </section>
  );
}
