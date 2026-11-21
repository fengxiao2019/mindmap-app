/** Which nodes are expanded in each topic, remembered across page refreshes (separate from the topic content). */
const KEY = "mindmap.expanded.v1";

type Store = Record<string, string[]>;

function read(): Store {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
    const store: Store = {};
    for (const [topicId, ids] of Object.entries(raw)) {
      if (Array.isArray(ids)) store[topicId] = ids.filter((id): id is string => typeof id === "string");
    }
    return store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable: the view simply starts collapsed next time */
  }
}

export const loadExpanded = (topicId: string): string[] => read()[topicId] ?? [];

export function saveExpanded(topicId: string, ids: string[]): void {
  const store = read();
  store[topicId] = ids;
  write(store);
}

export function forgetExpanded(topicId: string): void {
  const store = read();
  if (topicId in store) {
    delete store[topicId];
    write(store);
  }
}

/** The canvas camera: zoom, plus the world point at the centre of the window (stays right if the window is resized). */
export interface SavedView {
  scale: number;
  cx: number;
  cy: number;
}

const VIEW_KEY = "mindmap.view.v1";

function readViews(): Record<string, SavedView> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
    const views: Record<string, SavedView> = {};
    for (const [topicId, value] of Object.entries(raw)) {
      const v = value as Partial<SavedView> | null;
      if (v && Number.isFinite(v.scale) && Number.isFinite(v.cx) && Number.isFinite(v.cy)) {
        views[topicId] = { scale: v.scale as number, cx: v.cx as number, cy: v.cy as number };
      }
    }
    return views;
  } catch {
    return {};
  }
}

export const loadView = (topicId: string): SavedView | null => readViews()[topicId] ?? null;

/** `null` forgets the view, so the topic opens fitted to the window again. */
export function saveView(topicId: string, view: SavedView | null): void {
  const views = readViews();
  if (view) views[topicId] = view;
  else delete views[topicId];
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(views));
  } catch {
    /* storage unavailable: the view simply starts fitted next time */
  }
}
