import { expect, test } from "@playwright/test";

test("demo purnajual tetap berada dalam viewport pada semua breakpoint", async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const scene = page.locator("#contoh-arsip");
    await expect(scene).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const rects = await scene.evaluate((element) => {
      const scene = element.getBoundingClientRect();
      return {
        left: scene.left,
        right: scene.right,
        height: scene.height,
        viewport: innerWidth,
      };
    });
    expect(rects.left, `left edge @ ${width}`).toBeGreaterThanOrEqual(0);
    expect(rects.right, `right edge @ ${width}`).toBeLessThanOrEqual(rects.viewport);
    expect(rects.height).toBeGreaterThan(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("menu landing dengan keyboard dan batas autentikasi tetap berfungsi", async ({
  page,
}) => {
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const toggle = page.locator(".marketing-menu-toggle");
    await toggle.click();
    await expect(
      page.locator('#marketing-navigation a[href="#contoh-arsip"]'),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await page
      .getByRole("navigation", { name: "Navigasi beranda" })
      .getByRole("link", { name: /^Peran pengguna/ })
      .click();
    await expect(page).toHaveURL(/#fitur$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }
  // Authenticated dashboard search is covered by generated-user integration tests.
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});
