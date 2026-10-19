import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 768, 1440]) {
  test(`public archive fits ${width}px and has no automated accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".sample-photo img")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    await expect(page.locator('.archive-hero-copy a[href="/register"]')).toHaveText(/Catat garansi/);
    await page.locator('.archive-hero-copy a[href="#contoh-arsip"]').click();
    await expect(page).toHaveURL(/#contoh-arsip$/);
  });
}

test("sample selection, replay, interruption and reduced motion keep the record usable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const camera = page.getByRole("button", { name: "Kamera", exact: true });
  await camera.focus();
  await page.keyboard.press("Enter");
  await expect(camera).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".sample-details")).toContainText("DEMO-CAM-0147");
  const play = page.getByRole("button", { name: "Putar alur pencatatan" });
  await play.click();
  await expect(page.getByRole("button", { name: "Sedang memperagakan…" })).toBeDisabled();
  await expect(play).toBeEnabled({ timeout: 10000 });
  await expect(page.locator(".sample-replay [role=status]")).toContainText("Simulasi selesai");
  await play.click();
  await page.getByRole("button", { name: "Headphone", exact: true }).click();
  await expect(page.locator(".sample-details")).toContainText("DEMO-HP-0082");
  await expect(play).toBeEnabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await play.click();
  await expect(play).toBeEnabled();
  await expect(page.locator(".sample-replay [role=status]")).toContainText("Simulasi selesai");
  expect(await page.locator(".sample-stage").evaluate((node) => node.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length)).toBe(0);
  expect(errors).toEqual([]);
});
