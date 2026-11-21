import { afterEach, describe, expect, it } from "vitest";
import { SAMPLE } from "./data/sample";
import { SAMPLE_EN } from "./data/sample.en";
import { setLang, t } from "./i18n";
import { en } from "./locales/en";
import { zh } from "./locales/zh";
import { toMarkdown } from "./model/markdown";
import { countNodes, normalizeTopic, templateDocument } from "./model/topic";
import type { MindNode } from "./types";

afterEach(() => setLang("zh"));

const shape = (node: MindNode): unknown => ({ id: node.id, side: node.side, color: node.color, facts: node.facts?.length ?? 0, children: node.children?.map(shape) });

describe("i18n", () => {
  it("has the same keys in every locale and no empty strings", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const text of [...Object.values(zh), ...Object.values(en)]) expect(text.trim()).not.toBe("");
  });

  it("uses the same {placeholders} in every locale", () => {
    const names = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1] ?? "").sort();
    for (const key of Object.keys(zh) as (keyof typeof zh)[]) expect(names(en[key]), key).toEqual(names(zh[key]));
  });

  it("translates, interpolates and switches", () => {
    expect(t("sidebar.nodesN", { n: 3 })).toBe("3 个节点");
    setLang("en");
    expect(t("sidebar.nodesN", { n: 3 })).toBe("3 nodes");
    expect(() => normalizeTopic(null)).toThrow("not a JSON object");
  });

  it("localises the template and the Markdown export", () => {
    setLang("en");
    expect(templateDocument().tree.title).toBe("Topic name");
    const md = toMarkdown(normalizeTopic({ title: "T", sources: [{ title: "S" }], tree: { title: "R", children: [{ title: "A", facts: [{ label: "x", value: "1" }] }] } }));
    expect(md).toContain("- **x**: 1");
    expect(md).toContain("References:");
  });

  it("ships the built-in topic in English with exactly the same structure", () => {
    const zhTopic = normalizeTopic(SAMPLE, "cyber-security");
    const enTopic = normalizeTopic(SAMPLE_EN, "cyber-security");
    expect(countNodes(enTopic.tree)).toBe(countNodes(zhTopic.tree));
    expect(shape(enTopic.tree)).toEqual(shape(zhTopic.tree));
    expect(enTopic.title).not.toBe(zhTopic.title);
  });
});
