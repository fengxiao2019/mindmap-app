import { en } from "./locales/en";
import { type MessageKey, zh } from "./locales/zh";

export type Lang = "zh" | "en";
export const LANGS: readonly Lang[] = ["zh", "en"];

const KEY = "mindmap.lang.v1";
const messages: Record<Lang, Record<MessageKey, string>> = { zh, en };
const isLang = (value: unknown): value is Lang => value === "zh" || value === "en";

/**
 * Saved choice, else Chinese if Chinese appears anywhere in the browser's language list (the app began as
 * a Chinese one, and many Chinese users list English first), else English. Non-browser code gets Chinese.
 */
function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage unavailable or not in a browser */
  }
  if (typeof navigator === "undefined") return "zh";
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language ?? ""];
  return preferred.length === 0 || preferred.some(tag => /^zh\b/i.test(tag)) ? "zh" : "en";
}

let current: Lang | null = null;
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  current ??= detect();
  return current;
}

/** Switch language, remember it, update the document and tell the listeners. */
export function setLang(lang: Lang): void {
  if (lang === getLang()) return;
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* the choice just won't persist */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  for (const listener of listeners) listener(lang);
}

export function onLangChange(listener: (lang: Lang) => void): void {
  listeners.add(listener);
}

/** Translate `key`; `{name}` placeholders are filled from `vars`. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const text = messages[getLang()][key] ?? zh[key];
  return vars ? text.replace(/\{(\w+)\}/g, (whole, name: string) => String(vars[name] ?? whole)) : text;
}

/**
 * Fill the static markup of index.html:
 *   data-i18n="key"                       → textContent
 *   data-i18n-attr="aria-label:key;title:key" → attributes
 */
export function applyStaticTranslations(root: ParentNode = document): void {
  document.documentElement.lang = getLang() === "zh" ? "zh-CN" : "en";
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) el.textContent = t(el.dataset.i18n as MessageKey);
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-attr]")) {
    for (const pair of (el.dataset.i18nAttr ?? "").split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim() as MessageKey));
    }
  }
}
