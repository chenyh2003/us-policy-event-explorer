import type { PolicyEvent } from "../types";

export default function SelectionToolbar({
  events,
  selected,
  onAllOn,
  onAllOff,
  onInvert,
  onSetOnly,
}: {
  events: PolicyEvent[];
  selected: Set<number>;
  onAllOn: () => void;
  onAllOff: () => void;
  onInvert: () => void;
  onSetOnly: (ids: number[]) => void;
}) {
  const core = events.filter((e) => e.isCore32).map((e) => e.id);
  const keys = events.filter((e) => e.keyAnnotation).map((e) => e.id);
  const off = events.length - selected.size;

  return (
    <section className="selection-toolbar" aria-label="选择工具">
      <div className="toolbar-group">
        <button className="btn primary" onClick={onAllOn}>全部开启</button>
        <button className="btn" onClick={onAllOff}>全部关闭</button>
        <button className="btn" onClick={onInvert}>反选</button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-label">预设</span>
        <button className="btn subtle" onClick={() => onSetOnly(core)}>
          核心32 <small>{core.length}</small>
        </button>
        <button
          className="btn subtle"
          onClick={() => onSetOnly(keys)}
          title="K6 同时对应价格冻结与黄金窗口，因此共 12 条事件"
        >
          K1—K11 <small>{keys.length} 条</small>
        </button>
      </div>
      <div className="selection-count">
        <span className="count-on">{selected.size} 开启</span>
        <span className="count-off">{off} 关闭</span>
      </div>
    </section>
  );
}
