import type { PolicyEvent, SpxPoint, Taxonomy } from "../types";

export interface SiteData {
  events: PolicyEvent[];
  spx: SpxPoint[];
  taxonomy: Taxonomy;
}

export async function loadSiteData(): Promise<SiteData> {
  const base = import.meta.env.BASE_URL;
  const [events, spx, taxonomy] = await Promise.all([
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
  ]);
  return { events, spx, taxonomy };
}
