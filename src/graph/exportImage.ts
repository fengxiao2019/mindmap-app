import type { MindNode, Side, Size } from "../types";
import { FONT, MONO, loadFonts, treeText } from "./fonts";
import { NODE_W, ROOT_W, collectVisible, computeLayout, edgePath } from "./layout";

/** Everything needed to draw one node and everything below it as a stand-alone mind map. */
export interface ExportSpec {
  /** The node that becomes the root of the picture. */
  root: MindNode;
  colorOf(id: string): string;
  /** Side of a first-level branch of `root`. */
  sideOf(branchId: string): Side;
}

const MARGIN = 48;
const MAX_SIDE = 16000; // stay inside browsers' canvas size limits
const MAX_PIXELS = 120_000_000;

interface Box {
  node: MindNode;
  isRoot: boolean;
  color: string;
  kicker: string[];
  title: string[];
  detail: string[];
  padX: [number, number];
  padY: number;
  border: [number, number]; // left, right
  size: Size;
}

/** Split into wrap units: every CJK character on its own, other text in whole words. */
const tokens = (text: string): string[] => text.match(/[\u2e80-\u9fff\uff00-\uffef]|[^\s\u2e80-\u9fff\uff00-\uffef]+|\s+/g) ?? [];

/** Greedy line wrapping with the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  const push = (): void => { if (line.trim()) lines.push(line.trimEnd()); line = ""; };
  for (const token of tokens(text)) {
    if (ctx.measureText(line + token).width <= maxWidth) { line += token; continue; }
    push();
    if (/^\s+$/.test(token)) continue;
    if (ctx.measureText(token).width <= maxWidth) { line = token; continue; }
    for (const ch of token) { // a single word wider than the box: break it anywhere
      if (ctx.measureText(line + ch).width > maxWidth) push();
      line += ch;
    }
  }
  push();
  return lines.length ? lines : [""];
}

const fonts = {
  kicker: `700 10px ${MONO}`,
  title: `800 16px ${FONT}`,
  rootTitle: `800 20px ${FONT}`,
  detail: `400 12px ${FONT}`
};
const LH = { kicker: 12, title: 20, rootTitle: 25, detail: 16.8 };

function measureBoxes(ctx: CanvasRenderingContext2D, spec: ExportSpec, nodes: MindNode[]): Map<string, Box> {
  const boxes = new Map<string, Box>();
  for (const node of nodes) {
    const isRoot = node === spec.root;
    const expandable = Boolean(node.children?.length);
    const width = isRoot ? ROOT_W : NODE_W;
    const padX: [number, number] = isRoot ? [20, 20] : [16, 38];
    const border: [number, number] = isRoot ? [0, 0] : [4, 1];
    const padY = isRoot ? 20 : 14;
    const inner = width - padX[0] - padX[1] - border[0] - border[1];

    ctx.font = fonts.kicker;
    const kicker = wrap(ctx, node.kicker || (isRoot ? "TOPIC" : expandable ? "NEXT LEVEL" : "KNOWLEDGE"), inner);
    ctx.font = isRoot ? fonts.rootTitle : fonts.title;
    const title = wrap(ctx, node.title, inner);
    ctx.font = fonts.detail;
    const detail = node.detail ? wrap(ctx, node.detail, inner) : [];

    const h =
      padY * 2 + (isRoot ? 0 : 2) +
      kicker.length * LH.kicker + 5 +
      title.length * (isRoot ? LH.rootTitle : LH.title) +
      (detail.length ? 6 + detail.length * LH.detail : 0);
    boxes.set(node.id, {
      node, isRoot, color: spec.colorOf(node.id), kicker, title, detail, padX, padY, border,
      size: { w: width, h: Math.ceil(Math.max(h, expandable ? 88 : 74)) }
    });
  }
  return boxes;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Draw `spec.root` and all its descendants (fully expanded) to a PNG. Resolves to null if the browser cannot encode it. */
export async function renderSubtreePng(spec: ExportSpec): Promise<Blob | null> {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  await loadFonts(treeText(spec.root)); // measuring with a fallback font would make the picture's boxes the wrong size

  const expanded = new Set<string>();
  const mark = (node: MindNode): void => {
    if (node.children?.length) expanded.add(node.id);
    node.children?.forEach(mark);
  };
  mark(spec.root);
  const nodes = collectVisible(spec.root, expanded);
  const boxes = measureBoxes(probe, spec, nodes);
  const sizes = new Map<string, Size>([...boxes].map(([id, box]) => [id, box.size]));
  const pos = computeLayout({ root: spec.root, expanded, sizes, sideOf: spec.sideOf });

  // Which side every node hangs on (a branch's whole subtree shares its side) and its parent, for the edges.
  const sideOf = new Map<string, Side>();
  const parentOf = new Map<string, string>();
  const assign = (node: MindNode, side: Side): void => {
    for (const child of node.children ?? []) {
      parentOf.set(child.id, node.id);
      const childSide = node === spec.root ? spec.sideOf(child.id) : side;
      sideOf.set(child.id, childSide);
      assign(child, childSide);
    }
  };
  assign(spec.root, "right");

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [id, p] of pos) {
    const s = sizes.get(id);
    if (!s) continue;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + s.w); maxY = Math.max(maxY, p.y + s.h);
  }
  const width = Math.ceil(maxX - minX + 2 * MARGIN), height = Math.ceil(maxY - minY + 2 * MARGIN);
  const scale = Math.min(2, MAX_SIDE / width, MAX_SIDE / height, Math.sqrt(MAX_PIXELS / (width * height)));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#edf0eb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(MARGIN - minX, MARGIN - minY);

  // edges
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.globalAlpha = 0.85;
  for (const node of nodes) {
    const parentId = node === spec.root ? undefined : parentOf.get(node.id);
    if (!parentId) continue;
    ctx.strokeStyle = spec.colorOf(node.id);
    ctx.stroke(new Path2D(edgePath(parentId, node.id, sideOf.get(node.id) ?? "right", pos, sizes)));
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // nodes
  const letterSpaced = "letterSpacing" in ctx;
  for (const node of nodes) {
    const box = boxes.get(node.id), p = pos.get(node.id);
    if (!box || !p) continue;
    const { w, h } = box.size;

    ctx.save();
    ctx.shadowColor = "rgba(38, 68, 73, .14)";
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = box.isRoot ? "#152a35" : "#fbfcf8";
    roundRectPath(ctx, p.x, p.y, w, h, 4);
    ctx.fill();
    ctx.restore();

    if (!box.isRoot) {
      ctx.strokeStyle = "#9eb4b3";
      ctx.lineWidth = 1;
      roundRectPath(ctx, p.x + 0.5, p.y + 0.5, w - 1, h - 1, 4);
      ctx.stroke();
      ctx.save();
      roundRectPath(ctx, p.x, p.y, w, h, 4);
      ctx.clip();
      ctx.fillStyle = box.color;
      ctx.fillRect(p.x, p.y, box.border[0], h);
      ctx.restore();
    }

    const left = p.x + box.border[0] + box.padX[0];
    const centreX = p.x + w / 2;
    ctx.textBaseline = "middle";
    ctx.textAlign = box.isRoot ? "center" : "left";
    const textX = box.isRoot ? centreX : left;
    let y = p.y + box.padY + (box.isRoot ? 0 : 1);

    ctx.font = fonts.kicker;
    ctx.fillStyle = box.isRoot ? "#9bd5d8" : box.color;
    if (letterSpaced) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.2px";
    for (const line of box.kicker) { ctx.fillText(line.toUpperCase(), textX, y + LH.kicker / 2); y += LH.kicker; }
    if (letterSpaced) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    y += 5;

    ctx.font = box.isRoot ? fonts.rootTitle : fonts.title;
    ctx.fillStyle = box.isRoot ? "#f5fbfa" : "#15212a";
    const titleLh = box.isRoot ? LH.rootTitle : LH.title;
    for (const line of box.title) { ctx.fillText(line, textX, y + titleLh / 2); y += titleLh; }

    if (box.detail.length) {
      y += 6;
      ctx.font = fonts.detail;
      ctx.fillStyle = box.isRoot ? "#c1dce0" : "#596872";
      for (const line of box.detail) { ctx.fillText(line, textX, y + LH.detail / 2); y += LH.detail; }
    }
  }

  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}
