import type { MindNode } from "../types";

/** Keep in sync with --font-ui / --font-mono in styles.css. */
export const FONT =
  '"Inter Variable", "Noto Sans SC Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
export const MONO = '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace';

/** Every piece of text a tree puts on screen (used to fetch exactly the font slices it needs). */
export function treeText(root: MindNode): string {
  const parts: string[] = [];
  const walk = (node: MindNode): void => {
    parts.push(node.title, node.detail ?? "", node.kicker ?? "");
    node.children?.forEach(walk);
  };
  walk(root);
  return parts.join("");
}

/*
 * The Chinese font (Noto Sans SC, ~1 MB in ~100 slices) comes from a stylesheet that index.html loads without
 * blocking rendering. Until it arrives the system CJK font is on screen; when it lands the graph re-measures
 * itself (graph.ts listens for "loadingdone"). Latin fonts are small and self-hosted.
 */

const WARM_KEY = "mindmap.fonts.v1";

/** True once the web fonts have loaded on this browser at least once, i.e. they now come from the local cache. */
function isWarm(): boolean {
  try {
    return localStorage.getItem(WARM_KEY) === "1";
  } catch {
    return false;
  }
}

function markWarm(): void {
  try {
    localStorage.setItem(WARM_KEY, "1");
  } catch {
    /* storage unavailable: every visit just behaves like the first one */
  }
}

/** How long the very first render may wait for fonts: never on a cold start, a moment when they are cached. */
export const firstPaintFontWait = (): number => (isWarm() ? 800 : 0);

/** Resolves when the (async) CJK stylesheet is usable, or when it failed; never rejects. */
function cjkStylesheetReady(): Promise<void> {
  const link = document.getElementById("cjk-font") as HTMLLinkElement | null;
  if (!link || link.sheet) return Promise.resolve();
  return new Promise<void>(resolve => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });
}

/**
 * Wait (at most `timeoutMs`) until the web fonts can render `text`, so it is measured/drawn with its final
 * font. The CJK font comes in unicode-range slices: `document.fonts.load` with the real text fetches only the
 * slices that contain those characters. Never rejects; on timeout the caller carries on with the fallback
 * fonts and a later "loadingdone" re-layouts.
 */
export function loadFonts(text: string, timeoutMs = 1500): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const sample = `${text}Aa0`;
  const load = cjkStylesheetReady()
    .then(() =>
      Promise.all([
        document.fonts.load(`400 14px "Inter Variable"`, sample),
        document.fonts.load(`800 14px "Inter Variable"`, sample),
        document.fonts.load(`400 14px "Noto Sans SC Variable"`, sample),
        document.fonts.load(`700 10px "JetBrains Mono Variable"`, "ABC")
      ])
    )
    .then(() => {
      // index.html flips media print → all only when the stylesheet really loaded (it stays "print" if the CDN failed).
      const cjk = document.getElementById("cjk-font") as HTMLLinkElement | null;
      if (cjk && cjk.media !== "print") markWarm(); // so next time the cache can answer quickly
    })
    .catch(() => undefined);
  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  return Promise.race([load, timeout]);
}
