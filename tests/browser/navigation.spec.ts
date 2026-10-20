import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 768]) {
  test(`mobile navigation is animated, keyboard-safe and unclipped at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const menu = page.locator(".marketing-menu-toggle");
    const nav = page.locator("#marketing-navigation");
    await expect(nav).toHaveAttribute("inert", "");
    await expect(nav).not.toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(nav).not.toHaveAttribute("inert", "");
    await expect(nav.locator("a").first()).toBeFocused();
    await expect(nav.locator(".nav-preview")).toBeVisible();
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
    await expect(nav).toHaveAttribute("inert", "");
    await menu.click();
    await nav.getByRole("link", { name: /^Peran pengguna/ }).click();
    await expect(page).toHaveURL(/#fitur$/);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: /^Peran pengguna/, includeHidden: true })).toHaveAttribute("aria-current", "location");
  });
}

test("desktop navigation survives resize and follows the active section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigasi beranda" });
  await expect(nav).not.toHaveAttribute("inert", "");
  await nav.getByRole("link", { name: /^Rencana uji coba/ }).click();
  await expect(page).toHaveURL(/#cara-kerja$/);
  await expect(nav.getByRole("link", { name: /^Rencana uji coba/ })).toHaveAttribute("aria-current", "location");
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(nav).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(nav).not.toHaveAttribute("inert", "");
  await expect(nav.getByRole("link", { name: /^Demo kasus/ })).toBeVisible();
});

test("reduced-motion navigation retains static state and visible focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/");
  const menu = page.locator(".marketing-menu-toggle");
  await menu.click();
  await expect(page.locator("#marketing-navigation a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.locator("#marketing-navigation")).not.toBeVisible();
});
