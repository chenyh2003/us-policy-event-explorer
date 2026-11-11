import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { PolicyEvent, RateControlEvent, SpxPoint, Taxonomy } from "../types";

export default function MarketChart({
  spx,
  rateControls,
  events,
  selected,
  taxonomy,
  onOpen,
}: {
  spx: SpxPoint[];
  rateControls: RateControlEvent[];
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onOpen: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const updateAxisRef = useRef<(() => void) | null>(null);
  const onOpenRef = useRef(onOpen);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const [showRateControls, setShowRateControls] = useState(true);

  const rateControlSpots = useMemo(
    () =>
      rateControls
        .filter((e) => e.chartStatus === "in-range" && e.chartDate)
        .map((e) => [
          e.chartDate,
          e.chartClose,
          e.id,
          e.dateLabel,
          e.title,
          e.type,
          e.detail,
          e.marketImpact,
          e.source,
        ]),
    [rateControls]
  );

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.group = "policy-charts";
    echarts.connect("policy-charts");
    chartRef.current = chart;
    chart.on("click", (params) => {
      if (params.seriesType === "scatter" && Array.isArray(params.data)) {
        const id = Number((params.data as unknown[])[2]);
        if (Number.isFinite(id)) onOpenRef.current(id);
      }
    });
    chart.on("dataZoom", () => updateAxisRef.current?.());
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

    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { left: 60, right: 24, top: 34, bottom: 58 },
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
            const axisValue = arr[0].axisValue;
            const date =
              typeof axisValue === "number"
                ? new Date(axisValue).toISOString().slice(0, 10)
                : String(axisValue).slice(0, 10);
            const rows: string[] = [`<b>${date}</b>`];
            const latest = (items: { date: string; value: number }[]) => {
              let found: { date: string; value: number } | undefined;
              for (const item of items) {
                if (item.date <= date) found = item;
                else break;
              }
              return found;
            };

            const spxItem = arr.find((p: any) => p.seriesId === "spx");
            const spxValue = spxItem
              ? Number(spxItem.value[1])
              : latest(spx.map((p) => ({ date: p.date, value: p.close })))?.value;
            if (spxValue !== undefined) rows.push(`标普500：${spxValue.toFixed(2)}`);

            const target = new Date(date).getTime();
            const near = (value?: string) =>
              value ? Math.abs(new Date(value).getTime() - target) <= 3 * 86400000 : false;

            for (const e of rateControls.filter((x) => near(x.chartDate))) {
              rows.push(
                `<b style="color:#C0392B">利率管制事件：${e.title}</b>`,
                `${e.dateLabel} · ${e.type}`,
                e.detail,
                `<span style="color:#777">影响：${e.marketImpact}</span>`,
                `<span style="color:#999">${e.source}</span>`
              );
            }

            for (const e of events.filter(
              (x) => selected.has(x.id) && near(x.chartDate)
            )) {
              rows.push(
                `<b>政策事件：${e.title}</b>`,
                `${e.dateLabel} · ${e.category} · ${e.layers.join(" / ")}`,
                e.instruments.map((i) => `${i.label}：${i.parameter}`).join("<br/>"),
                e.summary
              );
            }

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
          axisLabel: { color: "#667085", fontSize: 11 },
          splitLine: { show: false },
          axisPointer: {
            label: {
              formatter: (p: any) => {
                const d = new Date(p.value);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              },
            },
          },
        },
        yAxis: {
          type: "log",
          name: "标普500（对数）",
          nameTextStyle: { color: "#667085", fontSize: 11, padding: [0, 0, 6, 0] },
          axisLabel: { color: "#667085", fontSize: 11 },
          splitLine: { lineStyle: { color: "#eef0f2", type: "dashed" } },
          axisPointer: {
            label: { formatter: (p: any) => Number(p.value).toFixed(2) },
          },
        },
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
          ...(showRateControls
            ? [{
                id: "rateControlSpots",
                name: "利率管制事件",
                type: "scatter",
                symbol: "rect",
                symbolSize: 9,
                data: rateControlSpots,
                itemStyle: { color: "#C0392B", borderColor: "#fff", borderWidth: 1 },
                z: 5.5,
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

    const updateAxis = () => {
      const dz = (chart.getOption().dataZoom as any[])[0];
      const start = Number(dz?.start ?? 0);
      const end = Number(dz?.end ?? 100);
      if (start <= 0.5 && end >= 99.5) {
        chart.setOption({ yAxis: { min: "dataMin", max: "dataMax" } });
        return;
      }
      const toTime = (v: any) => (typeof v === "number" ? v : Date.parse(String(v)));
      const domainStart = Date.parse(spx[0].date);
      const domainEnd = Date.parse(spx[spx.length - 1].date);
      const from = dz?.startValue != null
        ? toTime(dz.startValue)
        : domainStart + (domainEnd - domainStart) * start / 100;
      const to = dz?.endValue != null
        ? toTime(dz.endValue)
        : domainStart + (domainEnd - domainStart) * end / 100;
      const values = spx
        .filter((p) => {
          const t = Date.parse(p.date);
          return t >= from && t <= to;
        })
        .map((p) => p.close);
      if (!values.length) return;
      const min = Math.min(...values);
      const max = Math.max(...values);
      chart.setOption({
        yAxis: {
          min: Math.max(0.01, min * 0.85),
          max: max * 1.15,
        },
      });
    };
    updateAxisRef.current = updateAxis;
    updateAxis();
  }, [spx, events, selected, taxonomy, eventsById, showRateControls, rateControlSpots]);

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <h2>标普500、政策事件与利率管制</h2>
        <span>左轴=标普500；红方块=利率管制事件；利率/准备金率/利差见下方独立图</span>
      </div>
      <div className="chart-legend">
        {Object.entries(taxonomy.categoryColors).map(([cat, color]) => (
          <span key={cat}><i style={{ background: color }} />{cat}</span>
        ))}
        <span className="key-legend"><i className="diamond" />K1—K11 关键标注</span>
        <label className="rate-toggle">
          <input type="checkbox" checked={showRateControls} onChange={(e) => setShowRateControls(e.target.checked)} />
          <i className="rate-square" />利率管制事件
        </label>
      </div>
      <p className="chart-note">
        来源：美联储 H.15/FRED、Regulation Q 史料；标普曲线从 1927 年开始；红方块按事件日映射到标普收盘价；1927 年前及超出行情数据范围的事件不显示在标普上。利率与 10Y−1Y 利差见下方独立图。
      </p>
      <div ref={ref} className="market-chart" />
    </section>
  );
}
