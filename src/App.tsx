import { useCallback, useEffect, useMemo, useState } from "react";
import type { Filters, PolicyEvent, RateControlEvent, RatesData, SpxPoint, Taxonomy } from "./types";
import { loadSiteData } from "./lib/data";
import { filterEvents } from "./lib/filters";
import { useEventSelection } from "./hooks/useEventSelection";
import Header from "./components/Header";
import SelectionToolbar from "./components/SelectionToolbar";
import FilterSidebar from "./components/FilterSidebar";
import MarketChart from "./components/MarketChart";
import PolicyTimeline from "./components/PolicyTimeline";
import EventList from "./components/EventList";
import EventDetailDrawer from "./components/EventDetailDrawer";

const emptyFilters: Filters = {
  categories: [],
  layers: [],
  era: "all",
  query: "",
  instruments: [],
  onlySelected: false,
};

function Explorer({
  events,
  spx,
  taxonomy,
  rates,
  rateControls,
}: {
  events: PolicyEvent[];
  spx: SpxPoint[];
  taxonomy: Taxonomy;
  rates: RatesData;
  rateControls: RateControlEvent[];
}) {
  const allIds = useMemo(() => events.map((e) => e.id), [events]);
  const { selected, actions } = useEventSelection(allIds);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeId, setActiveId] = useState<number | null>(() => {
    const raw = new URLSearchParams(window.location.search).get("event");
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  });

  const openEvent = useCallback((id: number) => {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("event", String(id));
    window.history.replaceState(null, "", url);
  }, []);
  const closeEvent = useCallback(() => {
    setActiveId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    window.history.replaceState(null, "", url);
  }, []);

  const filtered = useMemo(
    () => filterEvents(events, filters, selected),
    [events, filters, selected]
  );
  const active = events.find((e) => e.id === activeId) ?? null;
  const inRange = events.filter((e) => e.chartStatus === "in-range").length;
  const pre1927 = events.filter((e) => e.chartStatus === "pre-1927").length;
  const postData = events.filter((e) => e.chartStatus === "post-data").length;

  return (
    <div className="app-shell">
      <Header
        total={events.length}
        selected={selected.size}
        inRange={inRange}
        pre1927={pre1927}
        postData={postData}
      />
      <SelectionToolbar
        events={events}
        selected={selected}
        onAllOn={actions.allOn}
        onAllOff={actions.allOff}
        onInvert={actions.invert}
        onSetOnly={actions.setOnly}
      />
      <div className="workspace">
        <FilterSidebar
          events={events}
          taxonomy={taxonomy}
          rateControls={rateControls}
          selected={selected}
          filters={filters}
          setFilters={setFilters}
          onGroupToggle={actions.group}
        />
        <main className="main-panel">
          <MarketChart
            spx={spx}
            rates={rates}
            rateControls={rateControls}
            events={filtered}
            selected={selected}
            taxonomy={taxonomy}
            onOpen={openEvent}
          />
          <PolicyTimeline
            events={filtered}
            selected={selected}
            taxonomy={taxonomy}
            onOpen={openEvent}
          />
          <EventList
            events={filtered}
            selected={selected}
            taxonomy={taxonomy}
            onToggle={actions.toggle}
            onOpen={openEvent}
          />
        </main>
      </div>
      <footer className="page-footer">
        研究资料整理，不构成投资建议。标普500为价格指数，不含股息；1927—1957 为回溯/重构数据。
      </footer>
      <EventDetailDrawer
        event={active}
        events={events}
        taxonomy={taxonomy}
        selected={selected}
        onClose={closeEvent}
        onToggle={actions.toggle}
        onOpen={openEvent}
      />
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<{ events: PolicyEvent[]; spx: SpxPoint[]; taxonomy: Taxonomy; rates: RatesData; rateControls: RateControlEvent[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSiteData()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "数据加载失败"));
  }, []);

  if (error) {
    return (
      <div className="loading-screen">
        <h1>数据加载失败</h1>
        <p>{error}</p>
        <p>请先在项目目录运行：<code>npm.cmd run data</code></p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading-screen">正在加载 108 条政策事件与标普500数据…</div>;
  }

  return <Explorer events={data.events} spx={data.spx} taxonomy={data.taxonomy} rates={data.rates} rateControls={data.rateControls} />;
}
