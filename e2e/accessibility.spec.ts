import { test, expect, type Locator } from "@playwright/test";
import { findRoutes, gotoApp, selectStop, stubPlanningData } from "./helpers";

/**
 * Visual requirements that a class name can only stand in for.
 *
 * Touch-target size and colour contrast are properties of what actually
 * renders, so they are measured here rather than asserted as Tailwind classes
 * in jsdom — which would pass even if the class produced nothing.
 *
 * Fixture-backed: this is about rendering, not the backend.
 */

test.beforeEach(async ({ page }) => {
  await stubPlanningData(page);
  await gotoApp(page);
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await findRoutes(page);
});

/** Contrast ratio between an element's text colour and its effective background. */
async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    const luminance = (css: string) => {
      const [r, g, b] = (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
      const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };

    // Walk up for the first ancestor that actually paints a background
    let node: HTMLElement | null = el as HTMLElement;
    let background = getComputedStyle(document.body).backgroundColor;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && !bg.startsWith("rgba(0, 0, 0, 0)") && bg !== "transparent") {
        background = bg;
        break;
      }
      node = node.parentElement;
    }

    const a = luminance(getComputedStyle(el).color);
    const b = luminance(background);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  });
}

test("both route card controls meet the 44px touch target minimum", async ({ page }) => {
  const summary = page.getByRole("button", { name: /#1/ });
  const details = page.getByRole("button", { name: "Show route details" }).first();

  const summaryBox = (await summary.boundingBox())!;
  const detailsBox = (await details.boundingBox())!;

  expect(summaryBox.height).toBeGreaterThanOrEqual(44);
  expect(detailsBox.height).toBeGreaterThanOrEqual(44);
  expect(detailsBox.width).toBeGreaterThanOrEqual(44);
});

test("the expand chevron clears the 3:1 contrast minimum for a control", async ({ page }) => {
  const details = page.getByRole("button", { name: "Show route details" }).first();
  // WCAG 1.4.11 non-text contrast
  expect(await contrastRatio(details)).toBeGreaterThanOrEqual(3);
});

test("body text clears the 4.5:1 contrast minimum", async ({ page }) => {
  const heading = page.getByText(/route(s)? found/i).first();
  expect(await contrastRatio(heading)).toBeGreaterThanOrEqual(4.5);
});
