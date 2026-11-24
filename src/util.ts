export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
export const esc = (text: unknown): string => String(text ?? "").replace(/[&<>"']/g, ch => ESCAPES[ch] ?? ch);

/**
 * The href when `text` is, as a whole, a single http(s) URL; otherwise null. Only whole-value URLs become links,
 * so example URLs quoted inside a sentence (phishing demos, query strings) stay plain text.
 */
export function linkOnly(text: string): string | null {
  const value = text.trim();
  if (!/^https?:\/\/[^\s<>"']+$/i.test(value)) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** `event.target.closest(selector)` with a sane type. */
export function closest<T extends Element = HTMLElement>(event: Event, selector: string): T | null {
  return event.target instanceof Element ? event.target.closest<T>(selector) : null;
}

export const isNarrow = (): boolean => matchMedia("(max-width: 700px)").matches;
