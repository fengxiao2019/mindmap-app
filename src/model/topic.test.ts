import { describe, expect, it } from "vitest";
import { SAMPLE } from "../data/sample";
import { toMarkdown } from "./markdown";
import { LIMITS, countNodes, normalizeTopic } from "./topic";

describe("normalizeTopic", () => {
  it("accepts a full document and a bare tree", () => {
    const full = normalizeTopic({ title: "A", tree: { title: "Root", children: [{ title: "x" }] } });
    expect(full.title).toBe("A");
    const bare = normalizeTopic({ title: "Root", children: [{ title: "x" }] });
    expect(bare.title).toBe("Root");
    expect(bare.tree.id).toBe("root");
  });

  it("rejects unusable input with readable errors", () => {
    expect(() => normalizeTopic(null)).toThrow("JSON 对象");
    expect(() => normalizeTopic({ nothing: true })).toThrow("tree");
    expect(() => normalizeTopic({ tree: { title: "r", children: [{}] } })).toThrow("title");
    expect(() => normalizeTopic({ tree: { title: "r", children: "oops" } })).toThrow("children");
  });

  it("enforces depth and node limits", () => {
    let deep: Record<string, unknown> = { title: "leaf" };
    for (let i = 0; i <= LIMITS.depth; i++) deep = { title: `n${i}`, children: [deep] };
    expect(() => normalizeTopic({ tree: deep })).toThrow("层级");

    const wide = { title: "r", children: Array.from({ length: LIMITS.nodes }, (_, i) => ({ title: `n${i}` })) };
    expect(() => normalizeTopic({ tree: wide })).toThrow("节点数");
  });

  it("makes ids unique and safe", () => {
    const topic = normalizeTopic({
      tree: { title: "r", children: [{ title: "a", id: "dup" }, { title: "b", id: "dup" }, { title: "c", id: 'x"y' }, { title: "d", id: "root" }] }
    });
    const ids = topic.tree.children!.map(c => c.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids.every(id => /^[\w-]+$/.test(id) && id !== "root")).toBe(true);
  });

  it("balances unplaced branches across the two sides and keeps explicit sides", () => {
    const topic = normalizeTopic({
      tree: { title: "r", children: [{ title: "fixed", side: "right", children: [{ title: "1" }, { title: "2" }] }, { title: "b" }, { title: "c" }] }
    });
    const sides = topic.tree.children!.map(c => c.side);
    expect(sides[0]).toBe("right");
    expect(sides[1]).toBe("left");
    expect(sides.every(side => side === "left" || side === "right")).toBe(true);
    expect(topic.tree.children!.every(c => c.color)).toBe(true);
  });

  it("drops non-http links but keeps their text", () => {
    const topic = normalizeTopic({ tree: { title: "r" }, sources: [{ title: "bad", url: "javascript:alert(1)" }, { title: "ok", url: "https://a.b" }] });
    expect(topic.sources).toEqual([{ title: "bad", url: "" }, { title: "ok", url: "https://a.b" }]);
  });

  it("is idempotent on the built-in sample", () => {
    const once = normalizeTopic(SAMPLE, "cyber-security");
    const twice = normalizeTopic(once, "cyber-security");
    expect(twice.tree).toEqual(once.tree);
    expect(countNodes(once.tree)).toBe(116);
  });
});

describe("facts", () => {
  it("keeps complete label/value pairs, drops the rest, and caps the count", () => {
    const many = Array.from({ length: LIMITS.facts + 5 }, (_, i) => ({ label: `l${i}`, value: `v${i}` }));
    const topic = normalizeTopic({
      tree: { title: "r", children: [
        { title: "a", facts: [{ label: " k ", value: " v " }, { label: "only label" }, { value: "only value" }, "junk", null] },
        { title: "b", facts: many }
      ] }
    });
    const [a, b] = topic.tree.children!;
    expect(a!.facts).toEqual([{ label: "k", value: "v" }]);
    expect(b!.facts).toHaveLength(LIMITS.facts);
  });

  it("rejects facts that are not an array", () => {
    expect(() => normalizeTopic({ tree: { title: "r", children: [{ title: "a", facts: "nope" }] } })).toThrow("facts");
  });
});

describe("toMarkdown", () => {
  it("includes facts under headings and nested under bullets", () => {
    const topic = normalizeTopic({
      tree: { title: "T", children: [{ title: "A", facts: [{ label: "x", value: "1" }], children: [{ title: "A1", children: [{ title: "leaf", facts: [{ label: "y", value: "2" }] }] }] }] }
    });
    const md = toMarkdown(topic);
    expect(md).toContain("## A\n\n- **x**：1");
    expect(md).toContain("- **leaf**\n  - **y**：2");
  });

  it("renders headings, bullets and sources", () => {
    const topic = normalizeTopic({
      title: "T", intro: "intro",
      sources: [{ title: "Docs", url: "https://d.io" }],
      tree: { title: "T", children: [{ title: "A", detail: "d", children: [{ title: "A1", children: [{ title: "leaf", detail: "x" }] }] }] }
    });
    const md = toMarkdown(topic);
    expect(md).toContain("# T\n");
    expect(md).toContain("> intro");
    expect(md).toContain("## A\n\n*d*");
    expect(md).toContain("### A1");
    expect(md).toContain("- **leaf**：x");
    expect(md).toContain("- [Docs](https://d.io)");
  });
});
