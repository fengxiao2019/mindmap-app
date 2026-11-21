import { t } from "../i18n";
import type { Fact, MindNode, Side, Source, Topic, TopicDocument } from "../types";

export const LIMITS = { nodes: 2000, depth: 8, facts: 20, fileBytes: 5 * 1024 * 1024 } as const;
export const ROOT_COLOR = "#148fa0";
export const PALETTE = ["#2f8b68", "#148fa0", "#b86a2c", "#7a5aa6", "#c0495a", "#4a78b5", "#8a8a2e"];
const SAFE_ID = /^[\w-]{1,64}$/;

export const countNodes = (node: MindNode): number =>
  1 + (node.children ?? []).reduce((sum, child) => sum + countNodes(child), 0);

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Validate and normalise an imported document. Accepts `{ title, intro, sources, tree }` or a bare tree
 * (`{ title, children }`). Throws a readable Error when the document is unusable; otherwise returns a clean
 * topic where every node has a unique, safe id, first-level branches have a side and a colour, and unknown
 * fields are dropped.
 */
export function normalizeTopic(raw: unknown, forcedId?: string): Topic {
  if (!isObject(raw)) throw new Error(t("topic.notObject"));
  const rawTree = raw.tree ?? (Array.isArray(raw.children) ? raw : null);
  if (!isObject(rawTree)) throw new Error(t("topic.noTree"));

  const used = new Set<string>(["root"]);
  let count = 0;
  let seq = 0;

  const clean = (input: unknown, depth: number): MindNode => {
    if (!isObject(input)) throw new Error(t("topic.nodeNotObject"));
    if (depth > LIMITS.depth) throw new Error(t("topic.tooDeep", { n: LIMITS.depth }));
    if (++count > LIMITS.nodes) throw new Error(t("topic.tooMany", { n: LIMITS.nodes }));
    const title = text(input.title);
    if (!title) throw new Error(t("topic.noTitle"));
    if (input.children !== undefined && !Array.isArray(input.children)) {
      throw new Error(t("topic.childrenNotArray", { title }));
    }

    if (input.facts !== undefined && !Array.isArray(input.facts)) {
      throw new Error(t("topic.factsNotArray", { title }));
    }

    let id = depth === 0 ? "root" : typeof input.id === "string" && SAFE_ID.test(input.id) ? input.id : "";
    while (!id || (depth > 0 && used.has(id))) id = `n${++seq}`;
    used.add(id);

    const node: MindNode = { id, title };
    if (text(input.kicker)) node.kicker = text(input.kicker);
    if (text(input.detail)) node.detail = text(input.detail);
    const facts = cleanFacts(input.facts as unknown[] | undefined);
    if (facts.length) node.facts = facts;
    if (typeof input.color === "string" && /^#[0-9a-f]{3,8}$/i.test(input.color)) node.color = input.color;
    if (depth === 1 && (input.side === "left" || input.side === "right")) node.side = input.side;
    const children = input.children as unknown[] | undefined;
    if (children?.length) node.children = children.map(child => clean(child, depth + 1));
    return node;
  };

  const root = clean(rawTree, 0);
  root.color ??= ROOT_COLOR;
  assignBranchSidesAndColors(root);

  const sources: Source[] = (Array.isArray(raw.sources) ? (raw.sources as unknown[]) : [])
    .map((entry): Source => {
      const src = isObject(entry) ? entry : {};
      const title = text(src.title);
      const url = text(src.url);
      return { title: title || url, url: /^https?:\/\//i.test(url) ? url : "" };
    })
    .filter(src => src.title);

  const id = forcedId && SAFE_ID.test(forcedId) ? forcedId : newTopicId();
  return { id, title: text(raw.title) || root.title, intro: text(raw.intro), sources, tree: root };
}

/** Keeps entries that have both a label and a value; extra entries beyond the limit are dropped. */
function cleanFacts(raw: unknown[] | undefined): Fact[] {
  const facts: Fact[] = [];
  for (const entry of raw ?? []) {
    if (!isObject(entry)) continue;
    const label = text(entry.label), value = text(entry.value);
    if (label && value) facts.push({ label, value });
  }
  return facts.slice(0, LIMITS.facts);
}

/** Branches without a side go to whichever side currently carries fewer nodes. */
function assignBranchSidesAndColors(root: MindNode): void {
  const branches = root.children ?? [];
  const load: Record<Side, number> = { left: 0, right: 0 };
  for (const branch of branches) if (branch.side) load[branch.side] += countNodes(branch);
  branches.forEach((branch, i) => {
    if (!branch.side) {
      branch.side = load.left <= load.right ? "left" : "right";
      load[branch.side] += countNodes(branch);
    }
    branch.color ??= PALETTE[i % PALETTE.length];
  });
}

export const newTopicId = (): string => `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const topicToDocument = (topic: Topic): TopicDocument => ({
  format: "mindmap",
  version: 1,
  title: topic.title,
  intro: topic.intro,
  sources: topic.sources,
  tree: topic.tree
});

/** What "download JSON template" hands out: the smallest document that shows every supported field. */
export const templateDocument = () => ({
  title: t("tpl.title"),
  intro: t("tpl.intro"),
  sources: [{ title: t("tpl.source"), url: "https://example.com" }],
  tree: {
    title: t("tpl.root"),
    detail: t("tpl.rootDetail"),
    children: [
      {
        title: t("tpl.part1"),
        detail: t("tpl.part1Detail"),
        children: [{ title: t("tpl.pointA") }, { title: t("tpl.pointB"), detail: t("tpl.pointBDetail"), facts: [{ label: t("tpl.factLabel"), value: t("tpl.factValue") }] }]
      },
      { title: t("tpl.part2"), children: [{ title: t("tpl.pointC") }] }
    ]
  }
});
