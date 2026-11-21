import { describe, expect, it } from "vitest";
import type { MindNode } from "../types";
import { toMarkdown } from "./markdown";
import { LIMITS, countNodes, normalizeTopic, topicToDocument } from "./topic";

/** The hand-made files in test-data/ are what you drag into the app; this checks the same code path they take. */
const files = import.meta.glob<string>("../../test-data/*.json", { query: "?raw", import: "default", eager: true });
const raw = (name: string): string => {
  const text = files[`../../test-data/${name}`];
  if (text === undefined) throw new Error(`missing test-data/${name}`);
  return text;
};
const read = (name: string): unknown => JSON.parse(raw(name));
const load = (name: string) => normalizeTopic(read(name));
const ids = (node: MindNode): string[] => [node.id, ...(node.children ?? []).flatMap(ids)];
const depthOf = (node: MindNode): number => 1 + Math.max(-1, ...(node.children ?? []).map(depthOf));

const okFiles = Object.keys(files).map(path => path.split("/").pop() ?? "").filter(name => name.includes("-ok-"));

describe("test-data: files that must import", () => {
  it.each<string>(okFiles)("%s imports, round-trips through export, and renders to Markdown", name => {
    const topic = load(name);
    expect(ids(topic.tree).length).toBe(new Set(ids(topic.tree)).size); // unique ids
    const exported = JSON.parse(JSON.stringify(topicToDocument(topic)));
    const again = normalizeTopic(exported);
    expect(again.tree).toEqual(topic.tree);
    expect(again.title).toBe(topic.title);
    expect(again.sources).toEqual(topic.sources);
    expect(toMarkdown(topic)).toContain(`# ${topic.title}`);
  });

  it("minimal / english / bare-tree shapes", () => {
    expect(countNodes(load("01-ok-minimal.json").tree)).toBe(5);
    expect(load("02-ok-english.json").sources[0]?.url).toContain("developer.mozilla.org");
    const bare = load("03-ok-bare-tree.json");
    expect(bare.title).toBe("没有外层包装的纯树格式");
    expect(countNodes(bare.tree)).toBe(7);
  });

  it("full-feature file: fields kept, junk cleaned", () => {
    const topic = load("04-ok-full-features.json");
    const [left, right, auto1, auto2] = topic.tree.children ?? [];
    expect(left).toMatchObject({ side: "left", color: "#c0495a", kicker: "LEFT" });
    expect(right?.side).toBe("right");
    expect(right?.facts).toEqual([{ label: "要点一", value: "值一" }, { label: "要点二", value: "值二" }]); // incomplete facts dropped
    expect(right?.children?.[0]).not.toHaveProperty("ignoredField");
    expect(auto1?.side && auto2?.side).toBeTruthy(); // auto-assigned
    expect(ids(topic.tree).filter(id => id === "dup")).toHaveLength(1); // duplicate id renamed
    expect(ids(topic.tree).every(id => /^[\w-]+$/.test(id))).toBe(true);
    expect(topic.sources).toEqual([
      { title: "带链接的参考", url: "https://example.com" },
      { title: "纯文字参考", url: "" },
      { title: "危险链接会被去掉链接", url: "" }, // javascript: is not a link
      { title: "https://only-url.example.com", url: "https://only-url.example.com" }
    ]);
  });

  it("large file stays within limits", () => {
    const topic = load("05-ok-large-295-nodes.json");
    expect(countNodes(topic.tree)).toBe(295);
  });

  it("edge-text file keeps markup as plain text and trims whitespace", () => {
    const topic = load("06-ok-edge-text.json");
    expect(topic.tree.title).toBe("根节点（首尾空白）");
    expect(topic.tree.children?.[0]?.title).toBe("<script>alert('xss')</script>");
  });

  it("depth limit is inclusive", () => {
    expect(depthOf(load("07-ok-depth-8-limit.json").tree)).toBe(LIMITS.depth);
  });
});

describe("test-data: files that must be rejected with a readable reason", () => {
  it("syntax error is not valid JSON", () => {
    expect(() => read("bad-01-syntax-error.json")).toThrow();
  });
  it.each([
    ["bad-02-not-an-object.json", "JSON 对象"],
    ["bad-03-no-tree.json", "tree"],
    ["bad-04-empty-title.json", "title"],
    ["bad-05-children-not-array.json", "坏节点"],
    ["bad-06-too-deep-9-levels.json", "层级"],
    ["bad-07-too-many-2001-nodes.json", "节点数"]
  ])("%s → message mentions %s", (name, fragment) => {
    expect(() => load(name)).toThrow(fragment);
  });
  // The 5 MB file is git-ignored (see .gitignore), so this only runs where it was generated.
  it.skipIf(!("../../test-data/bad-08-over-5MB.json" in files))("over-5MB file is larger than the import limit", () => {
    expect(new Blob([raw("bad-08-over-5MB.json")]).size).toBeGreaterThan(LIMITS.fileBytes);
  });
});
