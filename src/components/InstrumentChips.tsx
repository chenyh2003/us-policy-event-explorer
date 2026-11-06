import type { InstrumentTag } from "../types";

export default function InstrumentChips({ items }: { items: InstrumentTag[] }) {
  return (
    <div className="chips">
      {items.map((i) => (
        <span className="chip" key={`${i.code}-${i.parameter}`}>
          {i.label}
        </span>
      ))}
    </div>
  );
}
