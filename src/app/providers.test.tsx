import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Providers } from "./providers";

const pkg = JSON.parse(
  readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"),
) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };

describe("Providers", () => {
  it("renders its children", () => {
    render(<Providers><p>child</p></Providers>);
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders no devtools outside development", () => {
    // NODE_ENV is "test" here, which takes the same branch production does
    expect(process.env.NODE_ENV).not.toBe("development");
    const { container } = render(<Providers><p>child</p></Providers>);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("keeps the devtools package out of production dependencies", () => {
    expect(pkg.dependencies).not.toHaveProperty("@tanstack/react-query-devtools");
    expect(pkg.devDependencies).toHaveProperty("@tanstack/react-query-devtools");
  });
});
