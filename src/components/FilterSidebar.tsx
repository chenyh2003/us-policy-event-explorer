import type { Category, Filters, LayerId, PolicyEvent, RateControlEvent, Taxonomy } from "../types";
import { groupState } from "../lib/selection";

const CATEGORIES: Category[] = ["价格", "黄金", "工资", "宏观"];
const ERAS: Filters["era"][] = [
  "all",
  "1912-1929",
  "1930-1945",
  "1946-1979",
  "1980-2000",
  "2001-2026",
];

function GroupToggle({
  state,
  onClick,
  label,
}: {
  state: "all" | "none" | "some";
  onClick: () => void;
  label: string;
}) {
  const glyph = state === "all" ? "●" : state === "some" ? "◐" : "○";
  return (
    <button
      type="button"
      className={`group-toggle state-${state}`}
      onClick={onClick}
      title={`${state === "all" ? "关闭" : "开启"}全部${label}`}
      aria-label={`${state === "all" ? "关闭" : "开启"}全部${label}`}
    >
      {glyph}
    </button>
  );
}

export default function FilterSidebar({
  events,
  taxonomy,
  rateControls,
  selected,
  filters,
  setFilters,
  onGroupToggle,
}: {
  events: PolicyEvent[];
  taxonomy: Taxonomy;
  rateControls: RateControlEvent[];
  selected: Set<number>;
  filters: Filters;
  setFilters: (f: Filters) => void;
  onGroupToggle: (ids: number[]) => void;
}) {
  const toggleCategory = (c: Category) => {
    const has = filters.categories.includes(c);
    setFilters({
      ...filters,
      categories: has
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });
  };

  const toggleLayer = (l: LayerId) => {
    const has = filters.layers.includes(l);
    setFilters({
      ...filters,
      layers: has ? filters.layers.filter((x) => x !== l) : [...filters.layers, l],
    });
  };

  const toggleInstrument = (code: string) => {
    const has = filters.instruments.includes(code);
    setFilters({
      ...filters,
      instruments: has
        ? filters.instruments.filter((x) => x !== code)
        : [...filters.instruments, code],
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <label className="search-label" htmlFor="event-search">搜索事件</label>
        <input
          id="event-search"
          className="search-input"
          type="search"
          placeholder="事件、机构、工具、关键词…"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
      </div>

      <div className="sidebar-section">
        <div className="section-heading">
          <h2>类别</h2>
          <span>{filters.categories.length ? "已筛选" : "全部"}</span>
        </div>
        <p className="control-hint">圆点=整组显示开关；方框=列表与图表筛选</p>
        <div className="filter-list">
          {CATEGORIES.map((c) => {
            const group = events.filter((e) => e.category === c);
            const ids = group.map((e) => e.id);
            return (
              <div className="filter-row" key={c}>
                <GroupToggle
                  state={groupState(selected, ids)}
                  onClick={() => onGroupToggle(ids)}
                  label={c}
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(c)}
                    onChange={() => toggleCategory(c)}
                  />
                  <span className="cat-dot" style={{ background: taxonomy.categoryColors[c] }} />
                  {c}
                </label>
                <span className="muted-count">{group.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-heading">
          <h2>结构层</h2>
          <span>{filters.layers.length ? "已筛选" : "全部"}</span>
        </div>
        <div className="filter-list">
          {taxonomy.layers.map((layer) => {
            const ids = events.filter((e) => e.layers.includes(layer.id)).map((e) => e.id);
            return (
              <div className="filter-row" key={layer.id}>
                <GroupToggle
                  state={groupState(selected, ids)}
                  onClick={() => onGroupToggle(ids)}
                  label={layer.label}
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={filters.layers.includes(layer.id)}
                    onChange={() => toggleLayer(layer.id)}
                  />
                  <span className="layer-swatch" style={{ background: layer.color }} />
                  {layer.label}
                </label>
                <span className="muted-count">{ids.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-heading"><h2>年代</h2></div>
        <select
          className="era-select"
          value={filters.era}
          onChange={(e) => setFilters({ ...filters, era: e.target.value as Filters["era"] })}
        >
          {ERAS.map((era) => (
            <option key={era} value={era}>{era === "all" ? "全部年代" : era}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-section">
        <label className="check-label only-selected">
          <input
            type="checkbox"
            checked={Boolean(filters.onlySelected)}
            onChange={(e) => setFilters({ ...filters, onlySelected: e.target.checked })}
          />
          仅显示已开启的事件
        </label>
      </div>

      <details className="sidebar-section instruments-box">
        <summary>
          政策工具细分
          <span>{filters.instruments.length ? `已选 ${filters.instruments.length}` : "全部"}</span>
        </summary>
        <div className="instrument-filter-list">
          {taxonomy.instruments.map((i) => (
            <label className="check-label instrument-check" key={i.code}>
              <input
                type="checkbox"
                checked={filters.instruments.includes(i.code)}
                onChange={() => toggleInstrument(i.code)}
              />
              <span>
                {i.label}
                <small>{i.group}</small>
              </span>
            </label>
          ))}
        </div>
      </details>

      <details className="sidebar-section rate-control-box">
        <summary>
          利率管制事件
          <span>{rateControls.length}</span>
        </summary>
        <ul className="rate-control-list">
          {rateControls.map((e) => (
            <li key={e.id} title={`${e.detail}\n\n影响：${e.marketImpact}`}>
              <span>{e.dateLabel}</span>
              {e.title}
            </li>
          ))}
        </ul>
      </details>

      {(filters.categories.length || filters.layers.length || filters.instruments.length || filters.query || filters.era !== "all") && (
        <button
          className="btn clear-filters"
          onClick={() =>
            setFilters({ categories: [], layers: [], era: "all", query: "", instruments: [] })
          }
        >
          清除筛选
        </button>
      )}
    </aside>
  );
}
