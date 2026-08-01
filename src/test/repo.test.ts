import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(__dirname, "..", "..");
const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

describe("README", () => {
  it("links only to images that exist", () => {
    const targets = [...readme.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)]
      .map((m) => m[1])
      .filter((target) => !target.startsWith("http"));

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(existsSync(path.join(repoRoot, target)), `missing image: ${target}`).toBe(true);
    }
  });

  it("keeps binary assets out of the repo root", () => {
    expect(existsSync(path.join(repoRoot, "screenshot.png"))).toBe(false);
    expect(existsSync(path.join(repoRoot, "docs", "screenshot.png"))).toBe(true);
  });
});
