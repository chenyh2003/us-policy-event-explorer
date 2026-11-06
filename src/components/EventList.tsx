import type { PolicyEvent, Taxonomy } from "../types";
import EventRow from "./EventRow";

export default function EventList({
  events,
  selected,
  taxonomy,
  onToggle,
  onOpen,
}: {
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <section className="event-list-panel">
      <div className="panel-heading">
        <h2>事件清单</h2>
        <span>{events.length} 条符合筛选</span>
      </div>
      {events.length === 0 ? (
        <div className="empty-state">没有符合条件的事件。请调整筛选或开启更多节点。</div>
      ) : (
        <div className="event-list">
          {events.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              checked={selected.has(e.id)}
              taxonomy={taxonomy}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
