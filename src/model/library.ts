import { SAMPLE } from "../data/sample";
import { SAMPLE_EN } from "../data/sample.en";
import { getLang } from "../i18n";
import type { Topic } from "../types";
import { normalizeTopic, topicToDocument } from "./topic";

const STORE_KEY = "mindmap.topics.v1";
const ACTIVE_KEY = "mindmap.active.v1";
export const SAMPLE_ID = "cyber-security";

/** Topics live in localStorage as an array of documents (plus their ids). */
export function loadLibrary(): Topic[] {
  let stored: unknown = [];
  try {
    stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch {
    /* corrupted store: start fresh */
  }
  const topics: Topic[] = [];
  for (const doc of Array.isArray(stored) ? stored : []) {
    try {
      const topic = normalizeTopic(doc, typeof doc?.id === "string" ? doc.id : undefined);
      topics.push(topic.id === SAMPLE_ID ? refreshBuiltIn(topic) : topic);
    } catch {
      /* skip unusable entry */
    }
  }
  return topics.length ? topics : [defaultLibraryTopic()];
}

/** The built-in topic always follows the code (new nodes, facts, fixes, current language) but keeps the sides the user chose. */
export function refreshBuiltIn(stored: Topic): Topic {
  const fresh = defaultLibraryTopic();
  const sides = new Map((stored.tree.children ?? []).map(branch => [branch.id, branch.side]));
  for (const branch of fresh.tree.children ?? []) branch.side = sides.get(branch.id) ?? branch.side;
  return fresh;
}

export const defaultLibraryTopic = (): Topic => normalizeTopic(getLang() === "en" ? SAMPLE_EN : SAMPLE, SAMPLE_ID);

/** Returns false when the browser refuses to store the data (quota, private mode, ...). */
export function saveLibrary(topics: Topic[]): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(topics.map(topic => ({ ...topicToDocument(topic), id: topic.id }))));
    return true;
  } catch {
    return false;
  }
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* storage unavailable */
  }
}
