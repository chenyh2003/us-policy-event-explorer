import { useEffect } from "react";
import type { PolicyEvent, Taxonomy } from "../types";
import InstrumentChips from "./InstrumentChips";

const list = (items: string[]) => (items.length ? items.join("、") : "—");

export default function EventDetailDrawer({
  event,
  events,
  taxonomy,
  selected,
  onClose,
  onToggle,
  onOpen,
}: {
  event: PolicyEvent | null;
  events: PolicyEvent[];
  taxonomy: Taxonomy;
  selected: Set<number>;
  onClose: () => void;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [event, onClose]);

  if (!event) return null;
  const on = selected.has(event.id);
  const layerLabels = event.layers
    .map((id) => taxonomy.layers.find((l) => l.id === id)?.label)
    .filter(Boolean);
  const statusText =
    event.chartStatus === "pre-1927"
      ? "1927 年前，仅在时间轴展示"
      : event.chartStatus === "post-data"
      ? "超出行情数据范围，仅在时间轴展示"
      : "已映射到标普500曲线";
  const related = event.relatedIds
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is PolicyEvent => Boolean(e));

  return (
    <aside className="detail-drawer" aria-label="事件详情">
      <div className="detail-head">
        <div>
          <div className="detail-date">
            {event.dateLabel} · {event.category}
            {event.keyAnnotation ? <span className="key-badge">{event.keyAnnotation}</span> : null}
          </div>
          <h2>{event.title}</h2>
          <div className="detail-sub">
            {layerLabels.join(" / ")} · {event.policyType}
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭详情">×</button>
      </div>

      <p className="detail-summary">{event.summary}</p>

      <div className="detail-actions">
        <button
          type="button"
          className={`btn ${on ? "danger" : "primary"}`}
          onClick={() => onToggle(event.id)}
        >
          {on ? "关闭此节点" : "开启此节点"}
        </button>
        <span className={`status-pill ${event.chartStatus}`}>{statusText}</span>
      </div>

      <section className="detail-section">
        <h3>政策工具细分</h3>
        <InstrumentChips items={event.instruments} />
        <table className="instrument-table">
          <tbody>
            {event.instruments.map((i) => (
              <tr key={`${i.code}-${i.parameter}`}>
                <th>{i.label}</th>
                <td>
                  <b>{i.parameter}</b>
                  <br />
                  {i.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="detail-section two-col">
        <div>
          <h3>作用对象</h3>
          <p>{list(event.targets)}</p>
        </div>
        <div>
          <h3>豁免 / 例外</h3>
          <p>{list(event.exemptions)}</p>
        </div>
      </section>

      <section className="detail-section">
        <h3>传导链</h3>
        <ol className="chain-list">
          {event.transmission.map((s, i) => <li key={`${s}-${i}`}>{s}</li>)}
        </ol>
      </section>

      <section className="detail-section">
        <h3>关键数字</h3>
        <div className="metric-grid">
          {event.metrics.map((m) => (
            <div className="metric-card" key={`${m.label}-${m.value}`}>
              <span>{m.label}</span>
              <b>{m.value}</b>
              {m.note ? <small>{m.note}</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h3>市场影响</h3>
        <dl className="impact-grid">
          <dt>股票</dt><dd>{event.marketImpact.equities || "—"}</dd>
          <dt>利率</dt><dd>{event.marketImpact.rates || "—"}</dd>
          <dt>美元</dt><dd>{event.marketImpact.usd || "—"}</dd>
          <dt>黄金</dt><dd>{event.marketImpact.gold || "—"}</dd>
          <dt>行业</dt><dd>{event.marketImpact.sectors || "—"}</dd>
        </dl>
      </section>

      <section className="detail-section two-col">
        <div>
          <h3>执行方式</h3>
          <p>{event.enforcement || "—"}</p>
        </div>
        <div>
          <h3>退出 / 结局</h3>
          <p>{event.exit || "—"}</p>
        </div>
      </section>

      <section className="detail-section">
        <h3>副作用</h3>
        <ul className="bullet-list">
          {event.sideEffects.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

      <section className="detail-section two-col">
        <div>
          <h3>受益行业</h3>
          <p>{list(event.winners)}</p>
        </div>
        <div>
          <h3>受损行业</h3>
          <p>{list(event.losers)}</p>
        </div>
      </section>

      {related.length ? (
        <section className="detail-section">
          <h3>关联事件</h3>
          <div className="related-list">
            {related.map((r) => (
              <button key={r.id} type="button" className="related-link" onClick={() => onOpen(r.id)}>
                <span>{r.dateLabel}</span>
                {r.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>来源</h3>
        <p className="muted">{event.sources.join(" · ") || "—"}</p>
      </section>
    </aside>
  );
}
