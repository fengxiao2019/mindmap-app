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

/**
 * Make sure the web fonts can render `text` before it is measured or drawn, so the layout does not
 * shift afterwards. The CJK font comes in unicode-range slices: `document.fonts.load` with the real
 * text fetches only the slices that contain those characters. Never rejects; gives up after
 * `timeoutMs` (the fallback system fonts are used then, and a later "loadingdone" re-layouts).
 */
export function loadFonts(text: string, timeoutMs = 1500): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const sample = `${text}Aa0`;
  const load = Promise.all([
    document.fonts.load(`400 14px "Inter Variable"`, sample),
    document.fonts.load(`800 14px "Inter Variable"`, sample),
    document.fonts.load(`400 14px "Noto Sans SC Variable"`, sample),
    document.fonts.load(`700 10px "JetBrains Mono Variable"`, "ABC")
  ]).then(() => undefined, () => undefined);
  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  return Promise.race([load, timeout]);
}
