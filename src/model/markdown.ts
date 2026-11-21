import { t } from "../i18n";
import type { MindNode, Topic } from "../types";

const factLines = (node: MindNode, indent: string): string[] =>
  (node.facts ?? []).map(fact => `${indent}- **${fact.label}**${t("md.sep")}${fact.value}`);

/** Levels 1-2 become headings, deeper levels become nested bullets. */
export function toMarkdown(topic: Topic): string {
  const { tree } = topic;
  const lines: string[] = [`# ${topic.title}`, ""];
  if (topic.intro) lines.push(`> ${topic.intro}`, "");
  const rootLine = [tree.title, tree.detail].filter(Boolean).join(t("md.sep"));
  if (rootLine && rootLine !== topic.title) lines.push(`*${rootLine}*`, "");

  const walk = (node: MindNode, depth: number): void => {
    if (depth <= 2) {
      lines.push(`${"#".repeat(depth + 1)} ${node.title}`, "");
      if (node.detail) lines.push(`*${node.detail}*`, "");
      if (node.facts?.length) lines.push(...factLines(node, ""), "");
    } else {
      lines.push(`${"  ".repeat(depth - 3)}- **${node.title}**${node.detail ? `${t("md.sep")}${node.detail}` : ""}`);
      lines.push(...factLines(node, "  ".repeat(depth - 2)));
    }
    node.children?.forEach(child => walk(child, depth + 1));
    if (depth === 2 && node.children?.length) lines.push("");
  };
  tree.children?.forEach(branch => walk(branch, 1));

  if (topic.sources.length) {
    lines.push("---", "", t("md.refs"));
    for (const src of topic.sources) lines.push(`- ${src.url ? `[${src.title}](${src.url})` : src.title}`);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
