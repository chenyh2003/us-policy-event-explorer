import type { PolicyEvent, Taxonomy } from "../types";

const START = 1912;
const END = 2026;
const pct = (year: number) => Math.max(0, Math.min(100, ((year - START) / (END - START)) * 100));

export default function PolicyTimeline({
  events,
  selected,
  taxonomy,
  onOpen,
}: {
  events: PolicyEvent[];
  selected: Set<number>;
  taxonomy: Taxonomy;
  onOpen: (id: number) => void;
}) {
  const enabled = events.filter((e) => selected.has(e.id));

  return (
    <section className="timeline-panel">
      <div className="panel-heading">
        <h2>政策时间轴</h2>
        <span>1912—2026 · 全部已开启事件 · 游标可点开解析</span>
      </div>
      <div className="timeline-axis">
        {[1912, 1930, 1950, 1970, 1990, 2010, 2026].map((y) => (
          <span key={y} style={{ left: `${pct(y)}%` }}>{y}</span>
        ))}
      </div>
      <div className="timeline-lanes">
        {taxonomy.layers.map((layer) => {
          const laneEvents = enabled.filter((e) => e.layers.includes(layer.id));
          return (
            <div className="timeline-lane" key={layer.id}>
              <span className="lane-label">{layer.label}</span>
              <div className="lane-track">
                {laneEvents.map((e, i) => {
                  const status = e.chartStatus === "in-range" ? "" : " out-of-range";
                  return (
                    <button
                      key={`${layer.id}-${e.id}`}
                      type="button"
                      className={`timeline-dot${status}`}
                      title={`${e.dateLabel} ${e.title}${e.chartStatus === "pre-1927" ? "（1927年前）" : e.chartStatus === "post-data" ? "（超出行情数据）" : ""}`}
                      style={{
                        left: `${pct(Number(e.date.slice(0, 4)))}%`,
                        top: `${8 + (i % 3) * 5}px`,
                        background: taxonomy.categoryColors[e.category],
                      }}
                      onClick={() => onOpen(e.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="timeline-footnote">
        <span className="dot-legend" /> 已开启事件
        <span className="dot-legend outline" /> 1927 年前 / 超出行情数据范围
      </div>
    </section>
  );
}
