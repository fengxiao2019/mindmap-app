const KEY = "mindmap.settings.v1";

export interface Settings {
  /** Open the detail panel when a node is clicked. When off, the panel only follows the selection if already open. */
  autoDetail: boolean;
}

const DEFAULTS: Settings = { autoDetail: true };

export function loadSettings(): Settings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const autoDetail = typeof stored === "object" && stored !== null && "autoDetail" in stored ? (stored as Record<string, unknown>).autoDetail : undefined;
    return { autoDetail: typeof autoDetail === "boolean" ? autoDetail : DEFAULTS.autoDetail };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable: the setting just won't persist */
  }
}
