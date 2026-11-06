export function toggleOne(selected: Set<number>, id: number): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function setAll(ids: number[], on: boolean): Set<number> {
  return new Set(on ? ids : []);
}

export function invertSelection(selected: Set<number>, allIds: number[]): Set<number> {
  return new Set(allIds.filter((id) => !selected.has(id)));
}

export function toggleGroup(selected: Set<number>, groupIds: number[]): Set<number> {
  const next = new Set(selected);
  const allOn = groupIds.every((id) => next.has(id));
  for (const id of groupIds) {
    if (allOn) next.delete(id);
    else next.add(id);
  }
  return next;
}

export function groupState(
  selected: Set<number>,
  groupIds: number[]
): "all" | "none" | "some" {
  const on = groupIds.filter((id) => selected.has(id)).length;
  return on === 0 ? "none" : on === groupIds.length ? "all" : "some";
}
