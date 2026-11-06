import type { Filters, PolicyEvent } from "../types";

export function filterEvents(
  events: PolicyEvent[],
  filters: Filters,
  selected?: Set<number>
): PolicyEvent[] {
  const q = filters.query.trim().toLowerCase();
  return events.filter((e) => {
    if (filters.categories.length && !filters.categories.includes(e.category)) {
      return false;
    }
    if (filters.layers.length && !filters.layers.some((l) => e.layers.includes(l))) {
      return false;
    }
    if (filters.era !== "all") {
      const year = Number(e.date.slice(0, 4));
      const [a, b] = filters.era.split("-").map(Number);
      if (year < a || year > b) return false;
    }
    if (
      filters.instruments.length &&
      !e.instruments.some((i) => filters.instruments.includes(i.code))
    ) {
      return false;
    }
    if (filters.onlySelected && selected && !selected.has(e.id)) {
      return false;
    }
    if (q) {
      const hay = [
        e.title,
        e.summary,
        e.policyType,
        e.coverage,
        ...e.instruments.map((i) => `${i.label} ${i.parameter}`),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
