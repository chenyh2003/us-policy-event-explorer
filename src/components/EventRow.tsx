import type { PolicyEvent, Taxonomy } from "../types";

export default function EventRow({
  event,
  checked,
  taxonomy,
  onToggle,
  onOpen,
}: {
  event: PolicyEvent;
  checked: boolean;
  taxonomy: Taxonomy;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const layerLabels = event.layers
    .map((id) => taxonomy.layers.find((l) => l.id === id)?.label)
    .filter(Boolean)
    .join(" / ");

  return (
    <div className={`event-row ${checked ? "" : "is-off"}`}>
      <label className="row-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(event.id)}
          aria-label={`显示 ${event.title}`}
        />
      </label>
      <button type="button" className="event-main" onClick={() => onOpen(event.id)}>
        <span className="event-date">{event.dateLabel}</span>
        <span className="event-body">
          <span className="event-title">
            {event.title}
            {event.keyAnnotation ? <em className="key-tag">{event.keyAnnotation}</em> : null}
          </span>
          <span className="event-meta">
            <span className="cat-tag" style={{ borderColor: taxonomy.categoryColors[event.category] }}>
              <i style={{ background: taxonomy.categoryColors[event.category] }} />
              {event.category}
            </span>
            <span className="layer-text">{layerLabels || "—"}</span>
            {event.chartStatus !== "in-range" ? (
              <span className="status-tag">
                {event.chartStatus === "pre-1927" ? "1927年前" : "超出行情"}
              </span>
            ) : null}
          </span>
          <span className="event-tools">
            {event.instruments.slice(0, 3).map((i) => (
              <span className="mini-chip" key={`${i.code}-${i.parameter}`}>{i.label}</span>
            ))}
            {event.instruments.length > 3 ? <span className="mini-chip">+{event.instruments.length - 3}</span> : null}
          </span>
        </span>
      </button>
    </div>
  );
}
