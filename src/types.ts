export type Side = "left" | "right";

export interface Fact {
  label: string;
  value: string;
}

export interface MindNode {
  id: string;
  title: string;
  kicker?: string;
  detail?: string;
  /** Key/value pairs shown in the detail panel (use, algorithm, pitfall, ...). */
  facts?: Fact[];
  color?: string;
  /** Only meaningful on first-level branches: which side of the root they sit on. */
  side?: Side;
  children?: MindNode[];
}

export interface Source {
  title: string;
  /** Empty string means "plain text, no link". */
  url: string;
}

/** A learning topic as held in memory. */
export interface Topic {
  id: string;
  title: string;
  intro: string;
  sources: Source[];
  tree: MindNode;
}

/** The JSON file format that is imported and exported. */
export interface TopicDocument {
  format: "mindmap";
  version: 1;
  title: string;
  intro: string;
  sources: Source[];
  tree: MindNode;
}

export interface Size { w: number; h: number }
export interface Pos { x: number; y: number }
