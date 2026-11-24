import { describe, expect, it } from "vitest";
import { linkOnly } from "./util";

describe("linkOnly", () => {
  it("accepts a value that is a single http(s) URL", () => {
    expect(linkOnly("https://www.youtube.com/watch?v=iX8g4LqF8p8")).toBe("https://www.youtube.com/watch?v=iX8g4LqF8p8");
    expect(linkOnly("  http://example.com/a?b=1&c=2  ")).toBe("http://example.com/a?b=1&c=2");
  });

  it("leaves URLs quoted inside a sentence as plain text", () => {
    expect(linkOnly("显示 https://harvard.edu，点击后实际跳到 yale.edu")).toBeNull();
    expect(linkOnly("Referer: https://www.google.com/search?q=cats")).toBeNull();
    expect(linkOnly("https://a.example and https://b.example")).toBeNull();
  });

  it("rejects other schemes and markup characters", () => {
    expect(linkOnly("javascript:alert(1)")).toBeNull();
    expect(linkOnly("ftp://example.com/file")).toBeNull();
    expect(linkOnly('https://example.com/"onmouseover="x')).toBeNull();
    expect(linkOnly("https://")).toBeNull();
    expect(linkOnly("")).toBeNull();
  });
});
