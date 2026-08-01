import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const srcDir = path.join(__dirname, "..");
const css = readFileSync(path.join(__dirname, "globals.css"), "utf8");

const componentSources = (readdirSync(srcDir, { recursive: true }) as string[])
  .filter((file) => file.endsWith(".tsx") && !file.includes(".test."))
  .map((file) => ({ file, text: readFileSync(path.join(srcDir, file), "utf8") }));

describe("globals.css", () => {
  it("uses the loaded font variables on body rather than hardcoding a system stack", () => {
    const body = css.match(/body\s*{([^}]*)}/)?.[1] ?? "";
    expect(body).toMatch(/font-family:\s*var\(--font-sans\)/);
  });

  it("maps the font variables set by next/font in layout.tsx", () => {
    expect(css).toContain("--font-sans: var(--font-geist-sans)");
    expect(css).toContain("--font-mono: var(--font-geist-mono)");
  });

  it("defines one keyboard focus treatment for every interactive element", () => {
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline:\s*2px solid var\(--focus-ring\)/);
    expect(css).toMatch(/--focus-ring:/);
  });

  it("moves the focus ring onto the label when the input itself is hidden", () => {
    // The segmented control clips its radios; without this the ring lands on
    // a 1px box the user can't see
    expect(css).toMatch(/:where\(label\):has\(> input:focus-visible\)\s*{[^}]*outline:\s*2px solid var\(--focus-ring\)/);
  });
});

describe("focus styling", () => {
  it("is not overridden or suppressed per component", () => {
    // The global rule uses :where(), so any component-level focus utility
    // would silently win and reintroduce the inconsistency
    const offenders = componentSources
      .filter(({ text }) => /focus:(outline-none|ring)/.test(text))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
