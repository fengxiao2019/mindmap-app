import { t } from "../i18n";
import type { MindNode, Pos, Side, Size } from "../types";

export const NODE_W = 220;
export const ROOT_W = 270;
const GAP_X = 96;
const GAP_Y = 16;

export interface LayoutInput {
  root: MindNode;
  expanded: ReadonlySet<string>;
  /** Measured size of every visible node. */
  sizes: ReadonlyMap<string, Size>;
  /** Which side of the root a first-level branch sits on. */
  sideOf: (branchId: string) => Side;
}

export const visibleChildren = (node: MindNode, expanded: ReadonlySet<string>): MindNode[] =>
  expanded.has(node.id) ? node.children ?? [] : [];

export function collectVisible(node: MindNode, expanded: ReadonlySet<string>, out: MindNode[] = []): MindNode[] {
  out.push(node);
  for (const child of visibleChildren(node, expanded)) collectVisible(child, expanded, out);
  return out;
}

/** Top-left position of every visible node, computed from measured sizes. */
export function computeLayout({ root, expanded, sizes, sideOf }: LayoutInput): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const span = new Map<string, number>();
  const size = (id: string): Size => {
    const s = sizes.get(id);
    if (!s) throw new Error(`No measured size for node ${id}`);
    return s;
  };
  const spanOf = (id: string): number => span.get(id) ?? 0;
  const stackHeight = (nodes: MindNode[]): number =>
    nodes.reduce((sum, node, i) => sum + spanOf(node.id) + (i ? GAP_Y : 0), 0);

  const measure = (node: MindNode): void => {
    const kids = visibleChildren(node, expanded);
    kids.forEach(measure);
    span.set(node.id, Math.max(size(node.id).h, stackHeight(kids)));
  };

  const place = (node: MindNode, x: number, centerY: number, side: Side): void => {
    pos.set(node.id, { x, y: centerY - size(node.id).h / 2 });
    const kids = visibleChildren(node, expanded);
    let top = centerY - stackHeight(kids) / 2;
    for (const kid of kids) {
      const kidX = side === "right" ? x + size(node.id).w + GAP_X : x - GAP_X - size(kid.id).w;
      place(kid, kidX, top + spanOf(kid.id) / 2, side);
      top += spanOf(kid.id) + GAP_Y;
    }
  };

  measure(root);
  pos.set(root.id, { x: -ROOT_W / 2, y: -size(root.id).h / 2 });

  // Branches sharing a side are stacked vertically, each centred on its own span.
  const branches = visibleChildren(root, expanded);
  for (const side of ["left", "right"] as const) {
    const group = branches.filter(branch => sideOf(branch.id) === side);
    let top = -stackHeight(group) / 2;
    for (const branch of group) {
      const x = side === "left" ? -ROOT_W / 2 - GAP_X - size(branch.id).w : ROOT_W / 2 + GAP_X;
      place(branch, x, top + spanOf(branch.id) / 2, side);
      top += spanOf(branch.id) + GAP_Y;
    }
  }
  return pos;
}

/** Curve from the parent's facing edge to the child's facing edge. */
export function edgePath(
  parentId: string,
  childId: string,
  side: Side,
  pos: ReadonlyMap<string, Pos>,
  sizes: ReadonlyMap<string, Size>
): string {
  const p = pos.get(parentId), c = pos.get(childId), ps = sizes.get(parentId), cs = sizes.get(childId);
  if (!p || !c || !ps || !cs) return "";
  const startX = side === "right" ? p.x + ps.w : p.x;
  const endX = side === "right" ? c.x : c.x + cs.w;
  const startY = p.y + ps.h / 2;
  const endY = c.y + cs.h / 2;
  const midX = (startX + endX) / 2;
  return `M${startX} ${startY}C${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
}

/** True when any two laid-out nodes intersect. */
export function hasOverlap(pos: ReadonlyMap<string, Pos>, sizes: ReadonlyMap<string, Size>): boolean {
  const rects = [...pos].flatMap(([id, p]) => {
    const s = sizes.get(id);
    return s ? [{ x: p.x, y: p.y, w: s.w, h: s.h }] : [];
  });
  return rects.some((a, i) =>
    rects.slice(i + 1).some(b => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
  );
}

export interface MoveVerdict {
  ok: boolean;
  /** True when the drop would change nothing (already on that side). */
  noop?: boolean;
  reason: string;
}

const sideName = (side: Side): string => t(side === "left" ? "side.left" : "side.right");

/**
 * Can a branch move to `targetSide`? Rules: only a first-level branch may change side (its whole subtree
 * follows); the side must actually change; and a trial layout with the move applied must leave every
 * visible node free of overlaps.
 */
export function checkBranchMove(args: {
  layout: LayoutInput;
  id: string;
  depth: number;
  currentSide: Side | "center";
  targetSide: Side;
}): MoveVerdict {
  const { layout, id, depth, currentSide, targetSide } = args;
  if (id === layout.root.id) return { ok: false, reason: t("move.root") };
  if (depth !== 1) return { ok: false, reason: t("move.onlyBranch") };
  if (currentSide === targetSide) return { ok: false, noop: true, reason: t("move.same") };
  const trial = computeLayout({ ...layout, sideOf: branchId => (branchId === id ? targetSide : layout.sideOf(branchId)) });
  if (hasOverlap(trial, layout.sizes)) return { ok: false, reason: t("move.overlap", { side: sideName(targetSide) }) };
  return { ok: true, reason: t("move.release", { side: sideName(targetSide) }) };
}
