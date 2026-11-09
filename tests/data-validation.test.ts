// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (name: string) => {
  const path = fileURLToPath(new URL(`../public/data/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf-8"));
};

describe("构建数据", () => {
  const events = read("events.json");
  const taxonomy = read("taxonomy.json");
  const rates = read("rates.json");
  const rateControls = read("rate-control-events.json");
  const tms = read("tms.json");
  const yieldSpread = read("yield-spread.json");

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
    for (const e of events) {
      for (const id of e.relatedIds) expect(ids.has(id)).toBe(true);
    }
  });

  it("核心32与K标注可识别", () => {
    expect(events.filter((e: any) => e.isCore32)).toHaveLength(32);
    expect(events.filter((e: any) => e.keyAnnotation).length).toBeGreaterThanOrEqual(11);
  });

  it("利率管制事件完整且可映射到标普", () => {
    expect(rateControls.length).toBeGreaterThanOrEqual(14);
    for (const e of rateControls) {
      expect(e.title.length).toBeGreaterThan(2);
      expect(e.detail.length).toBeGreaterThan(10);
      expect(e.source.length).toBeGreaterThan(3);
      expect(["in-range", "pre-1927", "post-data"]).toContain(e.chartStatus);
    }
    expect(rateControls.filter((e: any) => e.chartStatus === "in-range").length).toBeGreaterThanOrEqual(13);
  });

  it("10Y−1Y 周度利差覆盖 1962—2026", () => {
    expect(yieldSpread.weekly.length).toBeGreaterThan(3000);
    expect(yieldSpread.weekly[0].date).toBe("1962-01-05");
    expect(yieldSpread.weekly.at(-1).date).toBe("2026-10-30");
    expect(yieldSpread.meta.frequency).toBe("weekly");
    expect(yieldSpread.meta.formula).toBe("WGS10YR - WGS1YR");
  });

  it("TMS 月频数据覆盖 1912—2026 且 1969 拼接连续", () => {
    expect(tms.monthly.length).toBeGreaterThanOrEqual(1370);
    expect(tms.monthly[0].date).toBe("1912-01-01");
    expect(tms.monthly.at(-1).date).toBe("2026-09-01");
    const dec1968 = tms.monthly.find((p: any) => p.date === "1968-12-01");
    const jan1969 = tms.monthly.find((p: any) => p.date === "1969-01-01");
    expect(Math.abs(dec1968.value - jan1969.value)).toBeLessThan(1);
    expect(jan1969.source).toBe("tms2");
    expect(tms.meta.frequency).toBe("monthly");
  });

  it("利率与准备金率序列完整且按日期排序", () => {
    expect(rates.primaryCredit.length).toBeGreaterThan(100);
    expect(rates.primaryCreditEvents.length).toBeGreaterThan(150);
    expect(rates.reserveRequirement.length).toBeGreaterThan(30);
    expect(rates.primaryCredit[0].date <= "1914-12-31").toBe(true);
    expect(rates.reserveRequirement[0].date).toBe("1913-12-23");
    expect(rates.reserveRequirement.at(-1).value).toBe(0);
    for (const series of [rates.primaryCredit, rates.reserveRequirement]) {
      const dates = series.map((p: any) => p.date);
      expect(dates).toEqual([...dates].sort());
    }
  });
});
