import { renderSubtreePng } from "./graph/exportImage";
import { type Lang, applyStaticTranslations, getLang, onLangChange, setLang, t } from "./i18n";
import { firstPaintFontWait, loadFonts, treeText } from "./graph/fonts";
import { createGraph } from "./graph/graph";
import { SAMPLE_ID, defaultLibraryTopic, loadActiveId, loadLibrary, refreshBuiltIn, saveActiveId, saveLibrary } from "./model/library";
import { toMarkdown } from "./model/markdown";
import { loadSettings, saveSettings } from "./model/settings";
import { LIMITS, newTopicId, normalizeTopic, templateDocument, topicToDocument } from "./model/topic";
import { type SavedView, forgetExpanded, loadExpanded, loadView, saveExpanded, saveView } from "./model/viewstate";
import type { Topic } from "./types";
import { createDetail } from "./ui/detail";
import { showExportPreview } from "./ui/exportPreview";
import { createMenubar } from "./ui/menubar";
import { createSidebar } from "./ui/sidebar";
import { toast } from "./ui/toast";
import { $ } from "./util";

const safeName = (name: string): string => name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "mindmap";

function download(filename: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Wires the model (topic library), the canvas, the sidebar and the menu bar together. */
export function createApp(): void {
  applyStaticTranslations();
  let topics = loadLibrary();
  let topic: Topic = topics[0] ?? defaultLibraryTopic();

  const persist = (): void => {
    if (!saveLibrary(topics)) toast(t("toast.storageFull"), true);
  };

  const settings = loadSettings();
  const autoDetailItem = $("#item-auto-detail");
  autoDetailItem.setAttribute("aria-checked", String(settings.autoDetail));

  let pendingView: { topicId: string; view: SavedView | null } | null = null;
  let viewTimer = 0;
  const flushView = (): void => {
    clearTimeout(viewTimer);
    if (pendingView) saveView(pendingView.topicId, pendingView.view);
    pendingView = null;
  };
  window.addEventListener("pagehide", flushView);
  window.addEventListener("beforeunload", flushView);

  const graph = createGraph($("#map"), {
    // Selecting a node opens the panel only if the setting says so; an already open panel always follows the selection.
    onSelect: id => {
      if (!id) detail.hide();
      else if (settings.autoDetail || detail.isOpen()) detail.show(id);
    },
    onExpansionChange: () => {
      sidebar.refresh();
      saveExpanded(topic.id, graph.expandedIds()); // survives a page refresh
    },
    onBranchMoved: persist,
    onViewChange: view => {
      // Zooming / panning fires constantly: remember the latest view shortly after it settles (or when the page closes).
      pendingView = { topicId: topic.id, view };
      clearTimeout(viewTimer);
      viewTimer = window.setTimeout(flushView, 250);
    },
    onTreeChanged: () => {
      // The built-in topic is rebuilt from code on every load, which would wipe the user's edits;
      // the first edit turns it into an ordinary saved topic instead.
      if (topic.id === SAMPLE_ID) {
        forgetExpanded(topic.id);
        saveView(topic.id, null);
        topic.id = newTopicId();
        saveView(topic.id, graph.view());
        saveActiveId(topic.id);
      }
      persist();
      saveExpanded(topic.id, graph.expandedIds()); // a new node's parent opens; a deleted node closes
      sidebar.refresh(); // node count + outline
      const id = graph.selectedId();
      if (id && detail.isOpen()) detail.show(id); // a renamed node's title / children list
    },
    onExportNode: id => { void exportNodeImage(id); },
    notify: toast,
    onCanvasPointerDown: () => sidebar.closeIfNarrow()
  });

  const sidebar = Object.assign(
    createSidebar(graph, {
      onSelectTopic: id => loadTopic(id),
      onDeleteTopic: id => deleteTopic(id)
    }),
    { closeIfNarrow: () => { if (matchMedia("(max-width: 700px)").matches) sidebar.setOpen(false); } }
  );

  const detail = createDetail(graph);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && graph.selectedId()) graph.select(null);
  });

  function loadTopic(id: string | null): void {
    flushView(); // the view of the topic we are leaving
    topic = topics.find(x => x.id === id) ?? topics[0] ?? defaultLibraryTopic();
    document.title = topic.title;
    $("#topbar-title").textContent = topic.title;
    $("#map").setAttribute("aria-label", t("map.ariaTopic", { title: topic.title }));
    graph.load(topic, loadExpanded(topic.id), loadView(topic.id));
    pendingView = null; // loading applies the saved view itself; nothing new to remember
    sidebar.update(topics, topic);
    saveActiveId(topic.id);
  }

  /** Right-click → export: the chosen node and everything below it becomes a PNG. */
  async function exportNodeImage(id: string): Promise<void> {
    const spec = graph.exportSpec(id);
    if (!spec) return;
    toast(t("toast.rendering"));
    try {
      const png = await renderSubtreePng(spec);
      if (!png) throw new Error(t("toast.noCanvas"));
      const filename = `${safeName(id === topic.tree.id ? topic.title : `${topic.title}-${spec.root.title}`)}.png`;
      $("#toast").hidden = true;
      // Preview first; the file is only written when the user confirms with "保存图片".
      showExportPreview({
        blob: png,
        filename,
        title: spec.root.title,
        onSave: () => { download(filename, png, "image/png"); toast(t("toast.imageSaved", { file: filename })); }
      });
    } catch (error) {
      toast(t("toast.imageFailed", { reason: error instanceof Error ? error.message : String(error) }), true);
    }
  }

  /* ---------- library actions ---------- */
  async function importFiles(files: File[]): Promise<void> {
    const added: Topic[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        if (file.size > LIMITS.fileBytes) throw new Error(t("toast.tooBig"));
        let raw: unknown;
        try {
          raw = JSON.parse(await file.text());
        } catch {
          throw new Error(t("toast.badJson"));
        }
        const imported = normalizeTopic(raw);
        topics.push(imported);
        added.push(imported);
      } catch (error) {
        errors.push(`${file.name}${t("md.sep")}${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const last = added.at(-1);
    if (last) {
      persist();
      loadTopic(last.id);
    }
    if (errors.length) toast(t("toast.importFailed", { errors: errors.join("\n") }), true);
    else if (added.length) toast(t("toast.imported", { n: added.length, names: added.map(a => a.title).join(t("toast.listSep")) }));
  }

  function deleteTopic(id: string): void {
    const target = topics.find(x => x.id === id);
    if (!target || !confirm(t("toast.deleteTopic", { title: target.title }))) return;
    topics = topics.filter(x => x.id !== id);
    forgetExpanded(id);
    saveView(id, null);
    if (!topics.length) topics = [defaultLibraryTopic()];
    persist();
    loadTopic(topic.id === id ? (topics[0]?.id ?? null) : topic.id);
  }

  /* ---------- file input + drag-and-drop import ---------- */
  const importInput = $<HTMLInputElement>("#import-file");
  importInput.addEventListener("change", () => {
    void importFiles([...(importInput.files ?? [])]);
    importInput.value = "";
  });
  document.addEventListener("dragover", event => {
    if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
  });
  document.addEventListener("drop", event => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    const json = [...event.dataTransfer.files].filter(file => /\.json$/i.test(file.name) || file.type === "application/json");
    void importFiles(json);
  });

  /* ---------- menu bar ---------- */
  const json = (value: unknown): string => JSON.stringify(value, null, 2) + "\n";
  createMenubar(
    {
      "import": () => importInput.click(),
      "template": () => { download("mindmap-template.json", json(templateDocument()), "application/json;charset=utf-8"); toast(t("toast.templateDownloaded")); },
      "delete": () => deleteTopic(topic.id),
      "export-json": () => { download(`${safeName(topic.title)}.json`, json(topicToDocument(topic)), "application/json;charset=utf-8"); toast(t("toast.jsonExported")); },
      "export-md": () => { download(`${safeName(topic.title)}.md`, toMarkdown(topic), "text/markdown;charset=utf-8"); toast(t("toast.mdExported")); },
      "copy-md": async () => {
        try {
          await navigator.clipboard.writeText(toMarkdown(topic));
          toast(t("toast.mdCopied"));
        } catch {
          toast(t("toast.mdCopyFailed"), true);
        }
      },
      "expand": () => graph.expandAll(),
      "collapse": () => graph.collapseAll(),
      "fit": () => graph.fit(),
      "zoom-in": () => graph.zoomBy(1.2),
      "zoom-out": () => graph.zoomBy(1 / 1.2),
      "auto-detail": () => {
        settings.autoDetail = !settings.autoDetail;
        autoDetailItem.setAttribute("aria-checked", String(settings.autoDetail));
        saveSettings(settings);
        toast(t(settings.autoDetail ? "toast.autoDetailOn" : "toast.autoDetailOff"));
      },
      "show-detail": () => {
        const id = graph.selectedId();
        if (id) detail.show(id);
        else toast(t("toast.selectFirst"));
      },
      "sidebar": () => sidebar.toggle()
    },
    () => sidebar.setOpen(false)
  );

  /* ---------- language ---------- */
  const langButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-lang]")];
  const syncLangButtons = (): void => {
    for (const button of langButtons) button.setAttribute("aria-pressed", String(button.dataset.lang === getLang()));
  };
  syncLangButtons();
  $(".lang-switch").addEventListener("click", event => {
    const lang = (event.target instanceof Element ? event.target.closest<HTMLElement>("[data-lang]") : null)?.dataset.lang;
    if (lang === "zh" || lang === "en") setLang(lang as Lang);
  });
  onLangChange(() => {
    applyStaticTranslations();
    syncLangButtons();
    // The built-in topic ships in both languages: an unedited copy follows the switch (topics you edited,
    // imported or created keep the language they were written in).
    const builtIn = topics.find(x => x.id === SAMPLE_ID);
    if (builtIn) topics = topics.map(x => (x === builtIn ? refreshBuiltIn(x) : x));
    if (topic.id === SAMPLE_ID) {
      loadTopic(SAMPLE_ID);
    } else {
      sidebar.refresh();
      const selected = graph.selectedId();
      if (selected && detail.isOpen()) detail.show(selected);
    }
  });

  // First render: on a cold start never wait for fonts (the system font is shown, the graph re-measures when the
  // web font arrives); once they are cached, wait a moment so the nodes are measured once with the final font.
  const first = loadActiveId();
  const firstTopic = topics.find(x => x.id === first) ?? topics[0];
  void loadFonts(`${firstTopic ? treeText(firstTopic.tree) : ""}${document.body.textContent ?? ""}`, firstPaintFontWait()).then(() => loadTopic(first));
}
