import { t } from "../i18n";
import type { MindNode } from "../types";
import { LIMITS, PALETTE, countNodes } from "./topic";

/** Title of a freshly inserted node (in the current language). */
export const defaultTitle = (): string => t("node.new");

/** Where a new node goes relative to the node that was right-clicked. */
export type InsertKind = "child" | "before" | "after" | "branch-left" | "branch-right";

export type InsertResult =
  | { ok: true; node: MindNode; parent: MindNode }
  | { ok: false; reason: string };

interface Located {
  node: MindNode;
  parent: MindNode | null;
  depth: number;
}

function locate(root: MindNode, id: string): Located | null {
  const walk = (node: MindNode, parent: MindNode | null, depth: number): Located | null => {
    if (node.id === id) return { node, parent, depth };
    for (const child of node.children ?? []) {
      const found = walk(child, node, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(root, null, 0);
}

function freshId(root: MindNode): string {
  const used = new Set<string>();
  const collect = (node: MindNode): void => {
    used.add(node.id);
    node.children?.forEach(collect);
  };
  collect(root);
  let id: string;
  do id = `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  while (used.has(id));
  return id;
}

/** A palette colour no other first-level branch uses yet (cycles once they are all taken). */
function pickBranchColor(root: MindNode): string {
  const branches = root.children ?? [];
  const taken = new Set(branches.map(branch => branch.color));
  return PALETTE.find(color => !taken.has(color)) ?? PALETTE[branches.length % PALETTE.length] ?? "#148fa0";
}

/**
 * Insert a new, empty node into the tree (mutating it).
 *  - `child`: appended as the last child of the target.
 *  - `before` / `after`: a sibling placed directly above / below the target. The root has no siblings.
 *  - `branch-left` / `branch-right`: a new first-level branch, only valid on the root.
 * New first-level branches get a side and an unused colour.
 */
export function insertNode(root: MindNode, targetId: string, kind: InsertKind): InsertResult {
  const target = locate(root, targetId);
  if (!target) return { ok: false, reason: t("edit.notFound") };
  if (countNodes(root) >= LIMITS.nodes) return { ok: false, reason: t("edit.maxNodes", { n: LIMITS.nodes }) };

  const node: MindNode = { id: freshId(root), title: defaultTitle() };

  if (kind === "branch-left" || kind === "branch-right") {
    if (target.parent) return { ok: false, reason: t("edit.branchOnRoot") };
    node.side = kind === "branch-left" ? "left" : "right";
    node.color = pickBranchColor(root);
    (root.children ??= []).push(node);
    return { ok: true, node, parent: root };
  }

  if (kind === "child") {
    if (target.depth + 1 > LIMITS.depth) return { ok: false, reason: t("edit.maxDepth", { n: LIMITS.depth }) };
    (target.node.children ??= []).push(node);
    return { ok: true, node, parent: target.node };
  }

  const parent = target.parent;
  if (!parent?.children) return { ok: false, reason: t("edit.rootNoSibling") };
  if (target.depth === 1) {
    node.side = target.node.side ?? "right";
    node.color = pickBranchColor(root);
  }
  parent.children.splice(parent.children.indexOf(target.node) + (kind === "after" ? 1 : 0), 0, node);
  return { ok: true, node, parent };
}

/** Remove a node (never the root). Returns whether anything was removed. */
export function removeNode(root: MindNode, id: string): boolean {
  const target = locate(root, id);
  if (!target?.parent?.children) return false;
  target.parent.children.splice(target.parent.children.indexOf(target.node), 1);
  if (!target.parent.children.length) delete target.parent.children;
  return true;
}
