import { useEffect, useMemo, useState } from "react";
import { invertSelection, setAll, toggleGroup, toggleOne } from "../lib/selection";

const KEY = "us-policy-selection-v1";

export function useEventSelection(allIds: number[]) {
  const [selected, setSelected] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return new Set(allIds);
      const stored = JSON.parse(raw) as number[];
      if (!Array.isArray(stored)) return new Set(allIds);
      return new Set(stored.filter((id) => allIds.includes(id)));
    } catch {
      return new Set(allIds);
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...selected]));
  }, [selected]);

  const actions = useMemo(
    () => ({
      toggle: (id: number) => setSelected((s) => toggleOne(s, id)),
      allOn: () => setSelected(setAll(allIds, true)),
      allOff: () => setSelected(setAll(allIds, false)),
      invert: () => setSelected((s) => invertSelection(s, allIds)),
      group: (ids: number[]) => setSelected((s) => toggleGroup(s, ids)),
      setOnly: (ids: number[]) => setSelected(new Set(ids)),
    }),
    [allIds]
  );

  return { selected, actions };
}
