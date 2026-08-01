import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(path.join(__dirname, "globals.css"), "utf8");

describe("globals.css", () => {
  it("uses the loaded font variables on body rather than hardcoding a system stack", () => {
    const body = css.match(/body\s*{([^}]*)}/)?.[1] ?? "";
    expect(body).toMatch(/font-family:\s*var\(--font-sans\)/);
  });

  it("maps the font variables set by next/font in layout.tsx", () => {
    expect(css).toContain("--font-sans: var(--font-geist-sans)");
    expect(css).toContain("--font-mono: var(--font-geist-mono)");
  });
});
