import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 768, 1440]) {
  test(`aftersales landing fits ${width}px and has no automated accessibility violations`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#contoh-arsip")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.locator('.archive-hero-copy a[href="#contoh-arsip"]').click();
    await expect(page).toHaveURL(/#contoh-arsip$/);
    expect(errors).toEqual([]);
  });
}
