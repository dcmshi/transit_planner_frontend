import { test, expect, type Locator, type Page } from "@playwright/test";
import { findRoutes, gotoApp, selectStop, stubPlanningData } from "./helpers";

/**
 * Visual requirements that a class name can only stand in for.
 *
 * Touch-target size and colour contrast are properties of what actually
 * renders, so they are measured here rather than asserted as Tailwind classes
 * in jsdom — which would pass even if the class produced nothing. Contrast is
 * checked in both colour schemes: the palette flips on prefers-color-scheme,
 * and dark mode is where muted greys that read fine on white stop being
 * legible.
 *
 * Fixture-backed: this is about rendering, not the backend.
 */

/** Plan a route and open the first card, so every tier of text is on screen. */
async function showRouteDetail(page: Page) {
  await stubPlanningData(page);
  await gotoApp(page);
  await selectStop(page, "Origin", "Guelph Central", "Guelph Central GO");
  await selectStop(page, "Destination", "Union Station", "Union Station GO");
  await findRoutes(page);
  await page.getByRole("button", { name: "Show route details" }).first().click();
}

/** Contrast ratio between an element's text colour and its effective background. */
async function contrastRatio(locator: Locator): Promise<number> {
  await locator.waitFor({ state: "visible" });
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
  await showRouteDetail(page);

  const summaryBox = (await page.getByRole("button", { name: /#1/ }).boundingBox())!;
  const detailsBox = (await page
    .getByRole("button", { name: /route details/i })
    .first()
    .boundingBox())!;

  expect(summaryBox.height).toBeGreaterThanOrEqual(44);
  expect(detailsBox.height).toBeGreaterThanOrEqual(44);
  expect(detailsBox.width).toBeGreaterThanOrEqual(44);
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test("keeps every text tier above its contrast minimum", async ({ page }) => {
      await showRouteDetail(page);

      // 4.5:1 for text (WCAG 1.4.3); 3:1 for a control's own affordance (1.4.11)
      const cases: Array<[string, Locator, number]> = [
        ["route count", page.getByText(/route(s)? found/i).first(), 4.5],
        ["form label", page.getByText("Destination").first(), 4.5],
        ["summary times", page.getByText(/^\d{2}:\d{2} → \d{2}:\d{2}$/).first(), 4.5],
        ["risk disclosure", page.getByRole("button", { name: /why .* risk\?/i }).first(), 4.5],
        ["expand chevron", page.getByRole("button", { name: /route details/i }).first(), 3],
      ];

      for (const [name, locator, minimum] of cases) {
        const ratio = await contrastRatio(locator);
        expect(ratio, `${name} in ${colorScheme} scheme`).toBeGreaterThanOrEqual(minimum);
      }
    });

    test("paints a surface matching the scheme", async ({ page }) => {
      await stubPlanningData(page);
      await gotoApp(page);

      const bodyIsDark = await page.evaluate(() => {
        const [r, g, b] = (getComputedStyle(document.body).backgroundColor.match(/\d+/g) ?? [])
          .slice(0, 3)
          .map(Number);
        return (r + g + b) / 3 < 128;
      });
      expect(bodyIsDark).toBe(colorScheme === "dark");
    });
  });
}
