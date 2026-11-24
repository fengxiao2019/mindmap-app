import { t } from "../i18n";
import type { Graph, NodeInfo } from "../graph/graph";
import { $, closest, esc, linkOnly } from "../util";

/** Right-hand panel with the selected node's explanation, key facts and sub-topics. */
export function createDetail(graph: Graph) {
  const panel = $("#detail");
  const body = $("#detail-body");

  function html({ node, path, children }: NodeInfo): string {
    const parts: string[] = [];
    if (node.kicker) parts.push(`<p class="detail-kicker">${esc(node.kicker)}</p>`);
    parts.push(`<h2 class="detail-title">${esc(node.title)}</h2>`);
    if (path.length) parts.push(`<p class="detail-path">${path.map(p => esc(p.title)).join(" › ")}</p>`);
    if (node.detail) parts.push(`<p class="detail-text">${esc(node.detail)}</p>`);
    if (node.facts?.length) {
      const value = (text: string): string => {
        const href = linkOnly(text);
        return href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>` : esc(text);
      };
      parts.push(`<dl class="facts">${node.facts.map(f => `<div><dt>${esc(f.label)}</dt><dd>${value(f.value)}</dd></div>`).join("")}</dl>`);
    }
    if (children.length) {
      parts.push(`<p class="side-label detail-sub">${esc(t("detail.contains", { n: children.length }))}</p><div class="outline">`);
      parts.push(...children.map(c => `<button type="button" class="outline-item" data-focus="${c.id}" style="--node-color:${esc(graph.colorOf(c.id))}">${esc(c.title)}</button>`));
      parts.push(`</div>`);
    }
    if (!node.detail && !node.facts?.length && !children.length) {
      parts.push(`<p class="detail-empty">${t("detail.empty")}</p>`);
    }
    return parts.join("");
  }

  const hide = (): void => { panel.hidden = true; };

  function show(id: string | null): void {
    const info = id ? graph.describe(id) : null;
    if (!info) return hide();
    body.innerHTML = html(info);
    body.style.setProperty("--node-color", info.color);
    body.scrollTop = 0;
    panel.hidden = false;
  }

  $("#detail-close").addEventListener("click", () => graph.select(null));
  body.addEventListener("click", event => {
    const id = closest(event, "[data-focus]")?.dataset.focus;
    if (id) graph.focusNode(id, { select: true });
  });

  return { show, hide, isOpen: (): boolean => !panel.hidden };
}
