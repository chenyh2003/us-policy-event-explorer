import { describe, expect, it } from "vitest";
import { filterEvents } from "./filters";
import type { Filters, PolicyEvent } from "../types";

const events = [
  {
    id: 1,
    title: "OPA 价格冻结",
    category: "价格",
    date: "1942-05-11",
    summary: "价格冻结",
    policyType: "直接管制",
    coverage: "全国",
    layers: ["price_industry"],
    instruments: [{ code: "price_ceiling_freeze", label: "最高限价/冻结" }],
  },
  {
    id: 2,
    title: "FLSA 最低工资",
    category: "工资",
    date: "1938-06-25",
    summary: "最低工资",
    policyType: "工资底线",
    coverage: "州际贸易",
    layers: ["labor_wage"],
    instruments: [{ code: "minimum_wage", label: "最低工资" }],
  },
] as unknown as PolicyEvent[];

const base: Filters = {
  categories: [],
  layers: [],
  era: "all",
  query: "",
  instruments: [],
};

describe("filterEvents", () => {
  it("按类别筛选", () => {
    expect(
      filterEvents(events, { ...base, categories: ["价格"] }).map((e) => e.id)
    ).toEqual([1]);
  });

  it("按关键词和工具筛选", () => {
    expect(
      filterEvents(events, {
        ...base,
        query: "最低",
        instruments: ["minimum_wage"],
      }).map((e) => e.id)
    ).toEqual([2]);
  });

  it("按年代筛选", () => {
    expect(
      filterEvents(events, { ...base, era: "1930-1945" }).map((e) => e.id)
    ).toEqual([1, 2]);
  });
});
