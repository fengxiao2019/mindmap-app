import { applyStaticTranslations, t } from "../i18n";
import { $ } from "../util";

export interface ExportPreview {
  blob: Blob;
  /** Suggested file name, shown on the card and used for the download. */
  filename: string;
  /** What is being exported (the node that became the root). */
  title: string;
  /** Called when the user chooses "save". */
  onSave(): void;
}

const ICON_DOWNLOAD = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5v7m0 0L5 6.8m3 2.7 3-2.7M3 11.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_COPY = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 3.5v-.2A1.3 1.3 0 0 0 9.2 2H3.8A1.3 1.3 0 0 0 2.5 3.3v5.4A1.3 1.3 0 0 0 3.8 10H4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const formatBytes = (bytes: number): string => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

let dialog: HTMLDialogElement | null = null;
let objectUrl = "";

function build(): HTMLDialogElement {
  const el = document.createElement("dialog");
  el.className = "export-dialog";
  el.setAttribute("aria-labelledby", "export-title");
  el.innerHTML =
    `<header class="export-head"><div><p class="eyebrow" data-i18n="export.preview"></p><h2 id="export-title" class="export-title"></h2></div>` +
    `<button type="button" class="mb-icon" data-export="close" data-i18n-attr="aria-label:export.close;title:export.closeTip">${ICON_CLOSE}</button></header>` +
    `<div class="export-stage"><figure class="export-sheet"><img class="export-img" alt=""><span class="export-badge">PNG</span></figure></div>` +
    `<footer class="export-foot"><div class="export-file"><strong class="export-name"></strong><span class="export-meta"></span></div>` +
    `<div class="export-actions"><button type="button" data-export="copy">${ICON_COPY}<span data-i18n="export.copy"></span></button>` +
    `<button type="button" class="btn-primary" data-export="save" autofocus>${ICON_DOWNLOAD}<span data-i18n="export.save"></span></button></div></footer>`;
  document.body.append(el);

  el.addEventListener("close", () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
    $<HTMLImageElement>(".export-img", el).removeAttribute("src");
  });
  return el;
}

/** Show the rendered picture in a modal, with an obvious "save" action. */
export function showExportPreview(preview: ExportPreview): void {
  dialog ??= build();
  const el = dialog;
  applyStaticTranslations(el); // the dialog is built once, but the language may have changed since
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(preview.blob);

  const img = $<HTMLImageElement>(".export-img", el);
  img.alt = t("export.alt", { title: preview.title });
  img.src = objectUrl;
  $(".export-title", el).textContent = preview.title;
  $(".export-name", el).textContent = preview.filename;
  const meta = $(".export-meta", el);
  meta.textContent = `PNG · ${formatBytes(preview.blob.size)}`;
  img.onload = () => { meta.textContent = `PNG · ${img.naturalWidth} × ${img.naturalHeight} · ${formatBytes(preview.blob.size)}`; };

  const copyBtn = $("[data-export=copy]", el);
  const label = $("span", copyBtn);
  copyBtn.hidden = !("ClipboardItem" in window && navigator.clipboard?.write);

  el.onclick = event => {
    if (event.target === el) return el.close(); // the dimmed backdrop closes, like Esc
    const action = (event.target instanceof Element ? event.target.closest<HTMLElement>("[data-export]") : null)?.dataset.export;
    if (action === "close") el.close();
    else if (action === "save") { preview.onSave(); el.close(); }
    else if (action === "copy") {
      navigator.clipboard.write([new ClipboardItem({ "image/png": preview.blob })]).then(
        () => { label.textContent = t("export.copied"); },
        () => { label.textContent = t("export.copyFailed"); }
      );
    }
  };
  el.showModal();
}
