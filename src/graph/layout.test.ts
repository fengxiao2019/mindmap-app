import { describe, expect, it } from "vitest";
import type { MindNode, Side, Size } from "../types";
import { ROOT_W, checkBranchMove, computeLayout, hasOverlap, type LayoutInput } from "./layout";

const tree: MindNode = {
  id: "root", title: "root",
  children: [
    { id: "a", title: "a", side: "left", children: [{ id: "a1", title: "a1" }, { id: "a2", title: "a2" }] },
    { id: "b", title: "b", side: "right", children: [{ id: "b1", title: "b1" }] },
    { id: "c", title: "c", side: "right" }
  ]
};
const sizes = new Map<string, Size>(["root", "a", "a1", "a2", "b", "b1", "c"].map(id => [id, { w: id === "root" ? ROOT_W : 220, h: 80 }]));
const sides: Record<string, Side> = { a: "left", b: "right", c: "right" };
const input = (expanded: string[]): LayoutInput => ({ root: tree, expanded: new Set(expanded), sizes, sideOf: id => sides[id] ?? "right" });

describe("computeLayout", () => {
  it("never overlaps, collapsed or expanded", () => {
    for (const expanded of [[], ["root"], ["root", "a", "b"]]) {
      expect(hasOverlap(computeLayout(input(expanded)), sizes)).toBe(false);
    }
  });

  it("puts left branches left of the root and right branches right of it", () => {
    const pos = computeLayout(input(["root"]));
    expect(pos.get("a")!.x + 220).toBeLessThan(pos.get("root")!.x);
    expect(pos.get("b")!.x).toBeGreaterThan(pos.get("root")!.x + ROOT_W);
  });

  it("stacks two branches on the same side", () => {
    const pos = computeLayout(input(["root"]));
    expect(pos.get("b")!.x).toBe(pos.get("c")!.x);
    expect(pos.get("b")!.y).not.toBe(pos.get("c")!.y);
  });
});

describe("checkBranchMove", () => {
  const args = (id: string, depth: number, currentSide: Side | "center", targetSide: Side) =>
    ({ layout: input(["root", "a", "b"]), id, depth, currentSide, targetSide });

  it("allows moving a first-level branch to the other side", () => {
    expect(checkBranchMove(args("a", 1, "left", "right"))).toMatchObject({ ok: true });
  });
  it("treats the same side as a no-op", () => {
    expect(checkBranchMove(args("a", 1, "left", "left"))).toMatchObject({ ok: false, noop: true });
  });
  it("refuses the root and deeper nodes", () => {
    expect(checkBranchMove(args("root", 0, "center", "left")).ok).toBe(false);
    expect(checkBranchMove(args("a1", 2, "left", "right")).ok).toBe(false);
  });
});
