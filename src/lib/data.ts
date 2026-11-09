import type { PolicyEvent, RateControlEvent, RatesData, SpxPoint, Taxonomy, TmsData } from "../types";

export interface SiteData {
  events: PolicyEvent[];
  spx: SpxPoint[];
  taxonomy: Taxonomy;
  rates: RatesData;
  rateControls: RateControlEvent[];
  tms: TmsData;
}

export async function loadSiteData(): Promise<SiteData> {
  const base = import.meta.env.BASE_URL;
  const [events, spx, taxonomy, rates, rateControls, tms] = await Promise.all([
    fetch(`${base}data/events.json`).then((r) => {
      if (!r.ok) throw new Error("events.json 加载失败");
      return r.json();
    }),
    fetch(`${base}data/spx.json`).then((r) => {
      if (!r.ok) throw new Error("spx.json 加载失败");
      return r.json();
    }),
    fetch(`${base}data/taxonomy.json`).then((r) => {
      if (!r.ok) throw new Error("taxonomy.json 加载失败");
      return r.json();
    }),
    fetch(`${base}data/rates.json`).then((r) => {
      if (!r.ok) throw new Error("rates.json 加载失败");
      return r.json();
    }),
    fetch(`${base}data/rate-control-events.json`).then((r) => {
      if (!r.ok) throw new Error("rate-control-events.json 加载失败");
      return r.json();
    }),
    fetch(`${base}data/tms.json`).then((r) => {
      if (!r.ok) throw new Error("tms.json 加载失败");
      return r.json();
    }),
  ]);
  return { events, spx, taxonomy, rates, rateControls, tms };
}
