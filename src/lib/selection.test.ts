import { describe, expect, it } from "vitest";
import { invertSelection, setAll, toggleGroup, toggleOne } from "./selection";

const all = [1, 2, 3, 4];

describe("selection", () => {
  it("toggleOne 关闭再打开", () => {
    const closed = toggleOne(new Set(all), 2);
    expect([...closed]).toEqual([1, 3, 4]);
    expect([...toggleOne(closed, 2)].sort()).toEqual([1, 2, 3, 4]);
  });

  it("setAll 全开/全关", () => {
    expect(setAll(all, true).size).toBe(4);
    expect(setAll(all, false).size).toBe(0);
  });

  it("invertSelection 反选", () => {
    expect([...invertSelection(new Set([1, 2]), all)]).toEqual([3, 4]);
  });

  it("toggleGroup 对部分选中的组执行全开", () => {
    const group = [2, 3];
    expect([...toggleGroup(new Set([1, 2, 3, 4]), group)]).toEqual([1, 4]);
    expect([...toggleGroup(new Set([1, 2, 3]), group)]).toEqual([1]);
    expect([...toggleGroup(new Set([1]), group)]).toEqual([1, 2, 3]);
  });
});
