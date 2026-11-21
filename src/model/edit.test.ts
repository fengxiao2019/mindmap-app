import { describe, expect, it } from "vitest";
import type { MindNode } from "../types";
import { defaultTitle, insertNode, removeNode } from "./edit";
import { LIMITS, countNodes, normalizeTopic } from "./topic";

const makeTree = (): MindNode =>
  normalizeTopic({
    title: "T",
    tree: {
      title: "Root",
      children: [
        { id: "a", title: "A", side: "left", children: [{ id: "a1", title: "A1" }, { id: "a2", title: "A2" }] },
        { id: "b", title: "B", side: "right" }
      ]
    }
  }).tree;

const titles = (nodes: MindNode[] | undefined): string[] => (nodes ?? []).map(n => n.title);
const ids = (node: MindNode): string[] => [node.id, ...(node.children ?? []).flatMap(ids)];

describe("insertNode", () => {
  it("adds a child as the last child, turning a leaf into a parent", () => {
    const tree = makeTree();
    const res = insertNode(tree, "b", "child");
    expect(res.ok).toBe(true);
    expect(tree.children?.[1]?.children?.[0]?.title).toBe(defaultTitle());
    const res2 = insertNode(tree, "a", "child");
    expect(res2.ok && res2.parent.id).toBe("a");
    expect(titles(tree.children?.[0]?.children)).toEqual(["A1", "A2", defaultTitle()]);
  });

  it("inserts siblings before and after the target", () => {
    const tree = makeTree();
    insertNode(tree, "a1", "before");
    insertNode(tree, "a2", "after");
    const a = tree.children?.[0];
    expect(a?.children?.map(c => c.title)).toEqual([defaultTitle(), "A1", "A2", defaultTitle()]);
  });

  it("gives a new first-level sibling the same side and an unused colour", () => {
    const tree = makeTree();
    const res = insertNode(tree, "a", "after");
    if (!res.ok) throw new Error(res.reason);
    expect(res.node.side).toBe("left");
    const colours = (tree.children ?? []).map(b => b.color);
    expect(new Set(colours).size).toBe(colours.length);
  });

  it("adds first-level branches on either side of the root only", () => {
    const tree = makeTree();
    const left = insertNode(tree, "root", "branch-left");
    const right = insertNode(tree, "root", "branch-right");
    expect(left.ok && left.node.side).toBe("left");
    expect(right.ok && right.node.side).toBe("right");
    expect(tree.children).toHaveLength(4);
    expect(insertNode(tree, "a", "branch-left").ok).toBe(false);
  });

  it("refuses siblings of the root and unknown targets", () => {
    const tree = makeTree();
    expect(insertNode(tree, "root", "before").ok).toBe(false);
    expect(insertNode(tree, "root", "after").ok).toBe(false);
    expect(insertNode(tree, "nope", "child").ok).toBe(false);
  });

  it("generates unique ids", () => {
    const tree = makeTree();
    for (let i = 0; i < 30; i++) insertNode(tree, "a", "child");
    const all = ids(tree);
    expect(new Set(all).size).toBe(all.length);
  });

  it("enforces depth and node limits", () => {
    const tree = makeTree();
    let deepest = "a";
    for (let depth = 1; depth < LIMITS.depth; depth++) {
      const res = insertNode(tree, deepest, "child");
      if (!res.ok) throw new Error(res.reason);
      deepest = res.node.id;
    }
    expect(insertNode(tree, deepest, "child").ok).toBe(false);
    expect(insertNode(tree, deepest, "after").ok).toBe(true); // siblings stay at the same depth

    const full = makeTree();
    while (countNodes(full) < LIMITS.nodes) insertNode(full, "b", "child");
    const before = countNodes(full);
    expect(insertNode(full, "b", "child").ok).toBe(false);
    expect(countNodes(full)).toBe(before);
  });
});

describe("removeNode", () => {
  it("removes a node and drops an empty children array", () => {
    const tree = makeTree();
    const res = insertNode(tree, "b", "child");
    if (!res.ok) throw new Error(res.reason);
    expect(removeNode(tree, res.node.id)).toBe(true);
    expect(tree.children?.[1]?.children).toBeUndefined();
    expect(removeNode(tree, "root")).toBe(false);
  });
});
