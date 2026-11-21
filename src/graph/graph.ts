import { t } from "../i18n";
import { type InsertKind, insertNode, removeNode } from "../model/edit";
import { ROOT_COLOR, countNodes } from "../model/topic";
import type { MindNode, Pos, Side, Size, Topic } from "../types";
import { $, clamp, closest, esc } from "../util";
import type { SavedView } from "../model/viewstate";
import { createContextMenu } from "./contextmenu";
import type { ExportSpec } from "./exportImage";
import {
  NODE_W,
  ROOT_W,
  checkBranchMove,
  collectVisible,
  computeLayout,
  edgePath,
  type LayoutInput,
  type MoveVerdict
} from "./layout";

const MIN_SCALE = 0.05;
const MAX_SCALE = 4;
const PAD = 64;
const DRAG_THRESHOLD = 4;

interface NodeMeta {
  node: MindNode;
  parent: MindNode | null;
  depth: number;
  side: Side | "center";
  color: string;
}

export interface OutlineItem {
  id: string;
  title: string;
  depth: number;
  color: string;
  open: boolean;
}

export interface NodeInfo {
  node: MindNode;
  color: string;
  depth: number;
  /** Ancestors from the first level down to the parent (the topic root is left out). */
  path: { id: string; title: string }[];
  children: { id: string; title: string }[];
}

export interface GraphHooks {
  /** The selected node changed (null = nothing selected); the detail panel follows. */
  onSelect(id: string | null): void;
  /** Nodes were expanded or collapsed (the sidebar outline marks open nodes). */
  onExpansionChange(): void;
  /** A first-level branch was dragged to the other side; the topic should be saved. */
  onBranchMoved(): void;
  /** Nodes were inserted, removed or renamed; the topic should be saved and dependent views refreshed. */
  onTreeChanged(): void;
  /** "Export as image" was chosen for a node (it becomes the picture's root). */
  onExportNode(id: string): void;
  /** Show a short message (limits reached, ...). */
  notify(message: string, isError?: boolean): void;
  /** The camera moved by the user (zoom / pan): the view to remember, or null once it is back to "fit to window". */
  onViewChange(view: SavedView | null): void;
  /** The user pressed on the canvas (lets a narrow-screen sidebar close itself). */
  onCanvasPointerDown(): void;
}

interface DragState {
  pointerId: number | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  nodeId: string | null;
  el: HTMLElement | null;
  verdict: MoveVerdict | null;
  side: Side | null;
}

export type Graph = ReturnType<typeof createGraph>;

/** The pan / zoom canvas: renders one topic's tree and handles all pointer interaction. */
export function createGraph(map: HTMLElement, hooks: GraphHooks) {
  const viewport = $(".graph-viewport", map);
  const world = $(".graph-world", map);
  const linesLayer = $(".graph-lines", map);
  const nodesLayer = $(".graph-nodes", map);
  const zoomLabel = $(".zoom-level", map);
  const dropZone = $("#drop-zone", map);
  const dragBanner = $("#drag-banner", map);

  let tree: MindNode = { id: "root", title: "" };
  const expanded = new Set<string>();
  let seen = new Set<string>();
  let selectedId: string | null = null;
  const cam = { scale: 1, x: 0, y: 0, touched: false };
  let layoutPos = new Map<string, Pos>();
  let layoutSizes = new Map<string, Size>();

  /* ---------- per-node metadata: parent, depth, side, branch colour ---------- */
  const meta = new Map<string, NodeMeta>();
  const metaOf = (id: string): NodeMeta => {
    const info = meta.get(id);
    if (!info) throw new Error(`Unknown node ${id}`);
    return info;
  };
  function rebuildMeta(): void {
    meta.clear();
    const walk = (node: MindNode, parent: MindNode | null, depth: number, side: Side | "center", color: string): void => {
      meta.set(node.id, { node, parent, depth, side, color });
      for (const child of node.children ?? []) walk(child, node, depth + 1, child.side ?? side, child.color ?? color);
    };
    walk(tree, null, 0, "center", tree.color ?? ROOT_COLOR);
  }

  const layoutInput = (sizes: ReadonlyMap<string, Size>): LayoutInput => ({
    root: tree,
    expanded,
    sizes,
    sideOf: id => (metaOf(id).side === "left" ? "left" : "right")
  });
  const collapseSubtree = (node: MindNode): void => {
    expanded.delete(node.id);
    node.children?.forEach(collapseSubtree);
  };

  /* ---------- rendering ---------- */
  function nodeHTML(node: MindNode): string {
    const info = metaOf(node.id);
    const isRoot = node.id === tree.id;
    const expandable = Boolean(node.children?.length);
    const classes = ["graph-node", isRoot && "is-root", info.depth === 1 && "is-branch", node.id === selectedId && "is-selected", !seen.has(node.id) && "is-new"]
      .filter(Boolean)
      .join(" ");
    const a11y =
      ` role="button" tabindex="0"` +
      (expandable ? ` data-expandable aria-expanded="${expanded.has(node.id)}"` : "") +
      (node.id === selectedId ? ` aria-current="true"` : "");
    const kicker = node.kicker || (isRoot ? "TOPIC" : expandable ? "NEXT LEVEL" : "KNOWLEDGE");
    return (
      `<div class="${classes}" data-node="${node.id}"${a11y} style="width:${isRoot ? ROOT_W : NODE_W}px;--node-color:${info.color}">` +
      `<span class="node-kicker">${esc(kicker)}</span><span class="node-title">${esc(node.title)}</span>` +
      (node.detail ? `<span class="node-detail">${esc(node.detail)}</span>` : "") +
      `</div>`
    );
  }

  function renderGraph(focusId?: string): void {
    const active = document.activeElement as HTMLElement | null;
    const hadFocus = active !== null && nodesLayer.contains(active);
    const focusTarget = focusId ?? active?.dataset?.node;
    const visible = collectVisible(tree, expanded);

    nodesLayer.innerHTML = visible.map(nodeHTML).join("");
    relayout();
    seen = new Set(visible.map(node => node.id));
    if (selectedId && !seen.has(selectedId)) select(null); // the selected node got hidden by a collapse
    if (hadFocus && focusTarget) nodesLayer.querySelector<HTMLElement>(`[data-node="${focusTarget}"]`)?.focus({ preventScroll: true });
  }

  /** Re-measure the nodes already in the DOM and reposition them and their edges (no re-render). */
  function relayout(): void {
    const visible = collectVisible(tree, expanded);
    const elements = [...nodesLayer.querySelectorAll<HTMLElement>(".graph-node")];
    const sizes = new Map<string, Size>(elements.map(el => [el.dataset.node ?? "", { w: el.offsetWidth, h: el.offsetHeight }]));
    const pos = computeLayout(layoutInput(sizes));
    for (const el of elements) {
      const p = pos.get(el.dataset.node ?? "");
      if (p) {
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      }
    }
    linesLayer.innerHTML = visible
      .filter(node => node.id !== tree.id)
      .map(node => {
        const info = metaOf(node.id);
        const side: Side = info.side === "left" ? "left" : "right";
        return `<path class="graph-line" stroke="${info.color}" d="${edgePath(info.parent?.id ?? tree.id, node.id, side, pos, sizes)}"></path>`;
      })
      .join("");

    layoutPos = pos;
    layoutSizes = sizes;
  }

  // A web font slice that arrives late changes text metrics: re-measure so nodes never overlap.
  document.fonts?.addEventListener("loadingdone", () => relayout());

  /* ---------- camera ---------- */
  function applyTransform(animate = false): void {
    world.classList.toggle("is-animated", animate);
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`;
    // Keep the grid locked to the world so the canvas feels endless.
    let grid = 28 * cam.scale;
    while (grid < 14) grid *= 2;
    map.style.backgroundSize = `${grid}px ${grid}px`;
    map.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
    zoomLabel.textContent = `${Math.round(cam.scale * 100)}%`;
    hooks.onViewChange(currentView());
  }
  /** Zoom and the world point at the window centre; null while the camera is just auto-fitted. */
  function currentView(): SavedView | null {
    if (!cam.touched) return null;
    return { scale: cam.scale, cx: (viewport.clientWidth / 2 - cam.x) / cam.scale, cy: (viewport.clientHeight / 2 - cam.y) / cam.scale };
  }

  function boundsOf(ids: string[]): { x: number; y: number; w: number; h: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of ids) {
      const p = layoutPos.get(id), s = layoutSizes.get(id);
      if (!p || !s) continue;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + s.w);
      maxY = Math.max(maxY, p.y + s.h);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  /** Centre the camera on a bounding box at the given scale. */
  function centreOn(b: { x: number; y: number; w: number; h: number }, scale: number): void {
    cam.scale = scale;
    cam.x = viewport.clientWidth / 2 - (b.x + b.w / 2) * scale;
    cam.y = viewport.clientHeight / 2 - (b.y + b.h / 2) * scale;
  }
  const fitScaleFor = (b: { w: number; h: number }): number =>
    Math.min((viewport.clientWidth - 2 * PAD) / b.w, (viewport.clientHeight - 2 * PAD) / b.h);

  function fitView(animate = true): void {
    const b = boundsOf([...layoutPos.keys()]);
    centreOn(b, clamp(Math.min(fitScaleFor(b), 1), MIN_SCALE, 1));
    cam.touched = false;
    applyTransform(animate);
  }

  /** Bring nodes into view with the smallest possible pan (shrinking only if they cannot fit). */
  function reveal(ids: string[]): void {
    const W = viewport.clientWidth, H = viewport.clientHeight;
    const b = boundsOf(ids);
    const fitScale = fitScaleFor(b);
    if (fitScale < cam.scale) {
      centreOn(b, Math.max(MIN_SCALE, fitScale));
    } else {
      const left = b.x * cam.scale + cam.x, right = (b.x + b.w) * cam.scale + cam.x;
      const top = b.y * cam.scale + cam.y, bottom = (b.y + b.h) * cam.scale + cam.y;
      let dx = right > W - PAD ? W - PAD - right : 0;
      let dy = bottom > H - PAD ? H - PAD - bottom : 0;
      if (left + dx < PAD) dx = PAD - left;
      if (top + dy < PAD) dy = PAD - top;
      cam.x += dx;
      cam.y += dy;
    }
    applyTransform(true);
  }

  function zoomAt(cx: number, cy: number, factor: number, animate = false): void {
    const next = clamp(cam.scale * factor, MIN_SCALE, MAX_SCALE);
    const ratio = next / cam.scale;
    cam.x = cx - (cx - cam.x) * ratio;
    cam.y = cy - (cy - cam.y) * ratio;
    cam.scale = next;
    cam.touched = true;
    applyTransform(animate);
  }

  /* ---------- selection (drives the detail panel) ---------- */
  function select(id: string | null): void {
    if (id === selectedId) return;
    selectedId = id;
    for (const el of nodesLayer.querySelectorAll(".graph-node.is-selected")) {
      el.classList.remove("is-selected");
      el.removeAttribute("aria-current");
    }
    if (id) {
      const el = nodesLayer.querySelector(`[data-node="${id}"]`);
      el?.classList.add("is-selected");
      el?.setAttribute("aria-current", "true");
    }
    hooks.onSelect(id);
  }

  /* ---------- expand / collapse ---------- */
  function toggle(id: string): void {
    const node = metaOf(id).node;
    const opening = !expanded.has(id);
    if (opening) expanded.add(id);
    else collapseSubtree(node); // collapsing closes deeper levels too
    renderGraph(id);
    hooks.onExpansionChange();
    if (opening) reveal([id, ...(node.children ?? []).map(child => child.id)]);
  }

  let suppressClick = false;
  /** Click / Enter on a node: select it (opens the detail panel) and, if it has children, expand or collapse. */
  function activate(el: HTMLElement): void {
    const id = el.dataset.node;
    if (!id) return;
    select(id);
    if (el.hasAttribute("data-expandable")) toggle(id);
    else reveal([id]); // the panel may have narrowed the canvas
  }
  world.addEventListener("click", event => {
    if (suppressClick || closest(event, ".is-editing")) return;
    const el = closest(event, ".graph-node");
    if (el) activate(el);
  });
  world.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (closest(event, ".is-editing")) return; // typing a title
    const el = closest(event, ".graph-node");
    if (!el) return;
    event.preventDefault();
    activate(el);
  });
  // Clicking empty canvas clears the selection.
  map.addEventListener("click", event => {
    if (suppressClick || closest(event, ".graph-node") || closest(event, ".ui")) return;
    select(null);
  });

  /* ---------- right-click: insert new nodes ---------- */
  const contextMenu = createContextMenu(choice => {
    if (!menuTarget) return;
    if (choice === "rename") startEdit(menuTarget, false);
    else if (choice === "delete") deleteNode(menuTarget);
    else if (choice === "export-image") hooks.onExportNode(menuTarget);
    else insert(menuTarget, choice as InsertKind);
  });
  let menuTarget: string | null = null;

  world.addEventListener("contextmenu", event => {
    const el = closest(event, ".graph-node");
    if (!el || closest(event, ".is-editing")) return;
    event.preventDefault();
    const id = el.dataset.node;
    if (!id) return;
    let { clientX: x, clientY: y } = event;
    if (!x && !y) { // opened from the keyboard (menu key / Shift+F10): anchor to the node
      const r = el.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    menuTarget = id;
    const rename = { id: "rename", label: t("ctx.rename") };
    const exportImage = { id: "export-image", label: t("ctx.exportImage") };
    contextMenu.open(
      id === tree.id
        ? [{ id: "branch-left", label: t("ctx.branchLeft") }, { id: "branch-right", label: t("ctx.branchRight") }, null, rename, null, exportImage]
        : [
            { id: "child", label: t("ctx.child") },
            null,
            { id: "before", label: t("ctx.before") },
            { id: "after", label: t("ctx.after") },
            null,
            rename,
            { id: "delete", label: t("ctx.delete"), danger: true },
            null,
            exportImage
          ],
      x,
      y
    );
  });
  // No browser menu over the canvas either (but keep it while typing a title, for copy / paste).
  map.addEventListener("contextmenu", event => { if (!closest(event, ".is-editing")) event.preventDefault(); });

  function insert(targetId: string, kind: InsertKind): void {
    const result = insertNode(tree, targetId, kind);
    if (!result.ok) { hooks.notify(result.reason, true); return; }
    expanded.add(result.parent.id); // make sure the new node is visible
    rebuildMeta();
    hooks.onTreeChanged();
    renderGraph(result.node.id);
    reveal([result.node.id, result.parent.id]);
    startEdit(result.node.id, true);
  }

  /** Delete a node with everything below it; asks first when that would take sub-nodes with it. */
  function deleteNode(id: string): void {
    const info = meta.get(id);
    if (!info?.parent) return; // the root cannot be deleted
    const extra = countNodes(info.node) - 1;
    if (extra > 0 && !confirm(t("node.deleteConfirm", { title: info.node.title, n: extra }))) return;
    const doomed = [...collectAll(info.node)];
    removeNode(tree, id);
    for (const gone of doomed) expanded.delete(gone);
    rebuildMeta();
    renderGraph();
    hooks.onTreeChanged();
    reveal([info.parent.id]);
    hooks.notify(extra > 0 ? t("node.deletedN", { title: info.node.title, n: extra }) : t("node.deleted", { title: info.node.title }));
  }
  const collectAll = (node: MindNode, out: string[] = []): string[] => {
    out.push(node.id);
    node.children?.forEach(child => collectAll(child, out));
    return out;
  };

  /**
   * Edit a node's title and subtitle in place. Enter in the title jumps to the subtitle; Enter in the subtitle,
   * or clicking away, saves; Esc cancels (a brand-new node is discarded).
   */
  function startEdit(id: string, isNew: boolean): void {
    const nodeEl = nodesLayer.querySelector<HTMLElement>(`[data-node="${id}"]`);
    const titleEl = nodeEl?.querySelector<HTMLElement>(".node-title");
    const node = meta.get(id)?.node;
    if (!nodeEl || !titleEl || !node) return;

    // A node without a subtitle gets an empty, placeholder-labelled field to type into.
    let detailEl = nodeEl.querySelector<HTMLElement>(".node-detail");
    if (!detailEl) {
      detailEl = Object.assign(document.createElement("span"), { className: "node-detail" });
      detailEl.dataset.placeholder = t("node.subtitlePlaceholder");
      titleEl.after(detailEl);
    }
    const fields = [titleEl, detailEl];
    for (const field of fields) {
      field.contentEditable = "plaintext-only";
      if (field.contentEditable !== "plaintext-only") field.contentEditable = "true"; // browsers without plaintext-only
      field.classList.add("is-editing");
    }
    const focusField = (field: HTMLElement): void => {
      field.focus({ preventScroll: true });
      getSelection()?.selectAllChildren(field);
    };
    focusField(titleEl);
    relayout(); // the subtitle field may have made the node taller
    // Typing can wrap onto more lines: keep pushing the neighbours out of the way as the node grows.
    nodeEl.addEventListener("input", relayout);

    const read = (field: HTMLElement): string => (field.textContent ?? "").replace(/\s+/g, " ").trim();
    let done = false;
    const finish = (commit: boolean): void => {
      if (done) return;
      done = true;
      nodeEl.removeEventListener("input", relayout);
      nodeEl.removeEventListener("focusout", onFocusOut);
      nodeEl.removeEventListener("keydown", onKey);
      if (!commit && isNew) {
        removeNode(tree, id);
        expanded.delete(id);
        rebuildMeta();
      } else if (commit) {
        const title = read(titleEl) || node.title; // a title is required
        const detail = read(detailEl);
        const changed = title !== node.title || detail !== (node.detail ?? "");
        node.title = title;
        if (detail) node.detail = detail;
        else delete node.detail;
        if (!changed && !isNew) { renderGraph(); return; } // nothing changed: just restore the display
      } else {
        renderGraph(); // cancelled rename
        return;
      }
      hooks.onTreeChanged();
      renderGraph();
    };
    // Moving between the two fields keeps editing; leaving the node saves.
    const onFocusOut = (event: FocusEvent): void => {
      if (event.relatedTarget instanceof Node && nodeEl.contains(event.relatedTarget)) return;
      finish(true);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.isComposing) return; // confirming an IME candidate, not the text
      if (event.key === "Enter") {
        event.preventDefault();
        if (event.target === titleEl) focusField(detailEl);
        else finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    };
    nodeEl.addEventListener("focusout", onFocusOut);
    nodeEl.addEventListener("keydown", onKey);
  }

  /* ---------- moving a first-level branch to the other side ---------- */
  function moveBranch(id: string, side: Side): void {
    const { node } = metaOf(id);
    node.side = side;
    hooks.onBranchMoved();
    rebuildMeta();
    renderGraph(id);
    reveal(collectVisible(node, expanded).map(n => n.id));
  }

  const drag: DragState = { pointerId: null, startX: 0, startY: 0, originX: 0, originY: 0, moved: false, nodeId: null, el: null, verdict: null, side: null };

  function updateNodeDrag(event: PointerEvent, dx: number, dy: number): void {
    if (!drag.el || !drag.nodeId) return;
    drag.el.style.transform = `translate(${dx / cam.scale}px, ${dy / cam.scale}px)`;
    const rect = viewport.getBoundingClientRect();
    const worldX = (event.clientX - rect.left - cam.x) / cam.scale;
    const side: Side = worldX < 0 ? "left" : "right";
    const info = metaOf(drag.nodeId);
    const verdict = checkBranchMove({ layout: layoutInput(layoutSizes), id: drag.nodeId, depth: info.depth, currentSide: info.side, targetSide: side });
    drag.side = side;
    drag.verdict = verdict;

    const rootX = cam.x, W = viewport.clientWidth;
    dropZone.className = "drop-zone" + (verdict.noop ? "" : verdict.ok ? " is-ok" : " is-blocked");
    dropZone.style.left = `${side === "left" ? 0 : rootX}px`;
    dropZone.style.width = `${side === "left" ? rootX : W - rootX}px`;
    dragBanner.hidden = false;
    dragBanner.className = "ui drag-banner" + (verdict.noop ? "" : verdict.ok ? " is-ok" : " is-blocked");
    dragBanner.textContent = verdict.reason;
  }

  function clearNodeDrag(): void {
    dropZone.className = "drop-zone";
    dragBanner.hidden = true;
    if (drag.el) {
      drag.el.classList.remove("is-dragging-node");
      drag.el.style.transform = "";
    }
    drag.nodeId = null;
    drag.el = null;
    drag.verdict = null;
  }

  /* ---------- pointer: pan the canvas, or drag a branch ---------- */
  map.addEventListener("pointerdown", event => {
    hooks.onCanvasPointerDown();
    if (event.button !== 0 || !event.isPrimary || closest(event, ".ui, .is-editing")) return;
    Object.assign(drag, { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: cam.x, originY: cam.y, moved: false });
    const nodeEl = closest(event, ".graph-node.is-branch");
    drag.nodeId = nodeEl?.dataset.node ?? null;
    drag.el = nodeEl;
  });
  map.addEventListener("pointermove", event => {
    if (event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // still a click, not a drag
      drag.moved = true;
      cam.touched = true;
      // A title edit that ended on this very press re-rendered the nodes, so re-find the element.
      if (drag.nodeId && !drag.el?.isConnected) drag.el = nodesLayer.querySelector<HTMLElement>(`[data-node="${drag.nodeId}"]`);
      map.classList.add("is-dragging");
      drag.el?.classList.add("is-dragging-node");
      try { map.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    }
    if (drag.nodeId) {
      updateNodeDrag(event, dx, dy);
      return;
    }
    cam.x = drag.originX + dx;
    cam.y = drag.originY + dy;
    applyTransform(false);
  });
  const endDrag = (event: PointerEvent): void => {
    if (event.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    const commit = drag.moved && drag.nodeId && event.type === "pointerup" && drag.verdict?.ok && drag.side ? { id: drag.nodeId, side: drag.side } : null;
    clearNodeDrag();
    if (commit) moveBranch(commit.id, commit.side);
    drag.pointerId = null;
    drag.moved = false;
    map.classList.remove("is-dragging");
  };
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) map.addEventListener(type, endDrag);
  // Native drag-and-drop / text selection would otherwise steal the pointer mid-pan.
  map.addEventListener("dragstart", event => event.preventDefault());
  map.addEventListener("selectstart", event => { if (!(document.activeElement as HTMLElement | null)?.isContentEditable) event.preventDefault(); });

  /* ---------- wheel: pan, Ctrl/⌘ + wheel (or pinch): zoom ---------- */
  map.addEventListener(
    "wheel",
    event => {
      if (closest(event, ".ui")) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 33 : 1;
      if (event.ctrlKey || event.metaKey) {
        const rect = viewport.getBoundingClientRect();
        const strength = clamp(event.deltaY * unit, -120, 120) * (event.ctrlKey ? 0.01 : 0.0025);
        zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-strength));
      } else {
        cam.x -= event.deltaX * unit;
        cam.y -= event.deltaY * unit;
        cam.touched = true;
        applyTransform(false);
      }
    },
    { passive: false }
  );

  const zoomCentre = (factor: number): void => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, factor, true);
  $(".graph-toolbar", map).addEventListener("click", event => {
    const action = closest(event, "[data-zoom]")?.dataset.zoom;
    if (action === "in") zoomCentre(1.2);
    else if (action === "out") zoomCentre(1 / 1.2);
    else if (action === "reset") fitView(true);
  });
  window.addEventListener("resize", () => { if (!cam.touched) fitView(false); });

  /* ---------- public API ---------- */
  return {
    /** Show a topic fitted to the window: collapsed to its root, or with `expandedIds` (remembered state) opened. */
    load(topic: Topic, expandedIds: readonly string[] = [], view: SavedView | null = null): void {
      select(null);
      tree = topic.tree;
      expanded.clear();
      seen = new Set();
      rebuildMeta();
      // Only nodes that still exist and have something to show can be open.
      for (const id of expandedIds) if (meta.get(id)?.node.children?.length) expanded.add(id);
      renderGraph();
      if (view) {
        cam.scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
        cam.x = viewport.clientWidth / 2 - view.cx * cam.scale;
        cam.y = viewport.clientHeight / 2 - view.cy * cam.scale;
        cam.touched = true;
        applyTransform(false);
      } else {
        fitView(false);
      }
      // Opening a topic should just appear: no pop-in animation for the nodes of the first render.
      for (const el of nodesLayer.querySelectorAll(".is-new")) el.classList.remove("is-new");
    },
    expandAll(): void {
      for (const { node } of meta.values()) if (node.children?.length) expanded.add(node.id);
      renderGraph();
      fitView(true);
      hooks.onExpansionChange();
    },
    collapseAll(): void {
      expanded.clear();
      renderGraph();
      fitView(true);
      hooks.onExpansionChange();
    },
    fit: (): void => fitView(true),
    zoomBy: zoomCentre,
    select,
    selectedId: (): string | null => selectedId,

    /** What the detail panel shows for a node. */
    describe(id: string): NodeInfo | null {
      const info = meta.get(id);
      if (!info) return null;
      const path: NodeInfo["path"] = [];
      for (let parent = info.parent; parent && parent.id !== tree.id; parent = metaOf(parent.id).parent) {
        path.unshift({ id: parent.id, title: parent.title });
      }
      return {
        node: info.node,
        color: info.color,
        depth: info.depth,
        path,
        children: (info.node.children ?? []).map(child => ({ id: child.id, title: child.title }))
      };
    },
    /** The node as the root of a picture: its whole subtree, with each node's colour and side. */
    exportSpec(id: string): ExportSpec | null {
      const info = meta.get(id);
      if (!info) return null;
      const isTreeRoot = id === tree.id;
      return {
        root: info.node,
        colorOf: nodeId => meta.get(nodeId)?.color ?? ROOT_COLOR,
        // Keep the left / right arrangement for the whole map; any other node hangs everything to its right.
        sideOf: branchId => (isTreeRoot && meta.get(branchId)?.side === "left" ? "left" : "right")
      };
    },
    isExpanded: (id: string): boolean => expanded.has(id),
    expandedIds: (): string[] => [...expanded],
    view: currentView,
    colorOf: (id: string): string => metaOf(id).color,

    /** First- and second-level nodes, for the sidebar outline. */
    outline(): OutlineItem[] {
      const items: OutlineItem[] = [];
      const walk = (node: MindNode, depth: number): void => {
        if (depth > 2) return;
        if (depth > 0) items.push({ id: node.id, title: node.title, depth, color: metaOf(node.id).color, open: expanded.has(node.id) });
        node.children?.forEach(child => walk(child, depth + 1));
      };
      walk(tree, 0);
      return items;
    },

    /** Expand the path to a node, then bring it (and its children) to the centre of the canvas. */
    focusNode(id: string, options: { select?: boolean } = {}): void {
      const info = metaOf(id);
      for (let parent = info.parent; parent; parent = metaOf(parent.id).parent) expanded.add(parent.id);
      if (info.node.children?.length) expanded.add(id);
      renderGraph();
      hooks.onExpansionChange();
      const b = boundsOf([id, ...(info.node.children ?? []).map(child => child.id)]);
      centreOn(b, clamp(Math.min(fitScaleFor(b), 1), MIN_SCALE, 1));
      cam.touched = true;
      applyTransform(true);
      const el = nodesLayer.querySelector<HTMLElement>(`[data-node="${id}"]`);
      el?.classList.add("is-pulse");
      setTimeout(() => el?.classList.remove("is-pulse"), 1200);
      if (options.select) select(id);
    },

    /** Call after the canvas' left edge moved (sidebar toggled) to keep content where it was on screen. */
    keepScreenPosition(leftBefore: number): void {
      if (cam.touched) {
        cam.x -= map.getBoundingClientRect().left - leftBefore;
        applyTransform(false);
      } else {
        fitView(false);
      }
    },
    left: (): number => map.getBoundingClientRect().left
  };
}
