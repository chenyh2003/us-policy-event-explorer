export type Category = "价格" | "黄金" | "工资" | "宏观";

export type LayerId =
  | "monetary"
  | "price_industry"
  | "labor_wage"
  | "energy_resource"
  | "health_consumption"
  | "macro_institution";

export type ChartStatus = "pre-1927" | "in-range" | "post-data";

export interface InstrumentTag {
  code: string;
  label: string;
  parameter: string;
  detail: string;
}

export interface Metric {
  label: string;
  value: string;
  note?: string;
}

export interface MarketImpact {
  equities: string;
  rates: string;
  usd: string;
  gold: string;
  sectors: string;
}

export interface PolicyEvent {
  id: number;
  date: string;
  dateLabel: string;
  endDate?: string;
  category: Category;
  title: string;
  policyType: string;
  coverage: string;
  summary: string;
  layers: LayerId[];
  instruments: InstrumentTag[];
  targets: string[];
  exemptions: string[];
  transmission: string[];
  metrics: Metric[];
  marketImpact: MarketImpact;
  enforcement: string;
  exit: string;
  sideEffects: string[];
  winners: string[];
  losers: string[];
  relatedIds: number[];
  sources: string[];
  keyAnnotation?: string;
  isCore32: boolean;
  chartStatus: ChartStatus;
  chartDate?: string;
  chartClose?: number;
}

export interface SpxPoint {
  date: string;
  close: number;
}

export interface LayerMeta {
  id: LayerId;
  label: string;
  color: string;
}

export interface InstrumentMeta {
  code: string;
  label: string;
  group: string;
  definition: string;
}

export interface Taxonomy {
  layers: LayerMeta[];
  instruments: InstrumentMeta[];
  categoryColors: Record<Category, string>;
}

export interface Filters {
  categories: Category[];
  layers: LayerId[];
  era: "all" | "1912-1929" | "1930-1945" | "1946-1979" | "1980-2000" | "2001-2026";
  query: string;
  instruments: string[];
  onlySelected?: boolean;
}
