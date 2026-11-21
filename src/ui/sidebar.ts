import { t } from "../i18n";
import { countNodes } from "../model/topic";
import type { Graph } from "../graph/graph";
import type { Topic } from "../types";
import { $, closest, esc, isNarrow } from "../util";

export interface SidebarHandlers {
  onSelectTopic(id: string): void;
  onDeleteTopic(id: string): void;
}

/** Left sidebar: the topic library, with the active topic's outline nested under it. */
export function createSidebar(graph: Graph, handlers: SidebarHandlers) {
  const sidebar = $("#sidebar");
  const expandBtn = $("#sidebar-expand");
  const collapseBtn = $("#sidebar-collapse");
  const menuItem = $("#item-sidebar");
  const list = $("#topics");
  const label = $("#topics-label");
  const foot = $("#side-foot");
  let topics: Topic[] = [];
  let active: Topic | null = null;

  const isOpen = (): boolean => !sidebar.hidden;

  function render(): void {
    label.textContent = t("sidebar.topicsN", { n: topics.length });
    list.innerHTML = topics
      .map(topic => {
        const isActive = topic.id === active?.id;
        return (
          `<div class="topic${isActive ? " is-active" : ""}"><div class="topic-row">` +
          `<button type="button" class="topic-item" data-topic="${topic.id}"${isActive ? ' aria-current="true"' : ""}>${esc(topic.title)}<small>${t("sidebar.nodesN", { n: countNodes(topic.tree) })}</small></button>` +
          `<button type="button" class="topic-del" data-delete="${topic.id}" aria-label="${esc(t("sidebar.deleteTopic", { title: topic.title }))}" title="${esc(t("sidebar.delete"))}">×</button></div>` +
          (isActive ? (topic.intro ? `<p class="topic-intro">${esc(topic.intro)}</p>` : "") + `<div class="outline">${outlineHTML()}</div>` : "") +
          `</div>`
        );
      })
      .join("");
    foot.innerHTML = active?.sources.length
      ? `${esc(t("sidebar.refs"))}<ul>${active.sources.map(src => `<li>${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noreferrer">${esc(src.title)}</a>` : esc(src.title)}</li>`).join("")}</ul>`
      : "";
  }

  const outlineHTML = (): string =>
    graph
      .outline()
      .map(item => `<button type="button" class="outline-item${item.open ? " is-open" : ""}" data-focus="${item.id}" data-depth="${item.depth}" style="--node-color:${item.color}">${esc(item.title)}</button>`)
      .join("");

  function setOpen(open: boolean): void {
    if (open === isOpen()) return;
    const before = graph.left();
    sidebar.hidden = !open;
    expandBtn.hidden = open;
    expandBtn.setAttribute("aria-expanded", String(open));
    menuItem.setAttribute("aria-checked", String(open));
    if (open) render();
    graph.keepScreenPosition(before); // the canvas' left edge just moved
  }

  list.addEventListener("click", event => {
    const focusId = closest(event, "[data-focus]")?.dataset.focus;
    const deleteId = closest(event, "[data-delete]")?.dataset.delete;
    const topicId = closest(event, "[data-topic]")?.dataset.topic;
    if (focusId) {
      graph.focusNode(focusId);
      if (isNarrow()) setOpen(false);
    } else if (deleteId) {
      handlers.onDeleteTopic(deleteId);
    } else if (topicId && topicId !== active?.id) {
      handlers.onSelectTopic(topicId);
      if (isNarrow()) setOpen(false);
    }
  });
  expandBtn.addEventListener("click", () => { setOpen(true); collapseBtn.focus(); });
  collapseBtn.addEventListener("click", () => { setOpen(false); expandBtn.focus(); });

  return {
    isOpen,
    setOpen,
    toggle: (): void => setOpen(!isOpen()),
    /** Re-render only if visible (expansion state changed, topic switched, ...). */
    update(nextTopics: Topic[], nextActive: Topic): void {
      topics = nextTopics;
      active = nextActive;
      if (isOpen()) render();
    },
    refresh: (): void => { if (isOpen()) render(); }
  };
}
