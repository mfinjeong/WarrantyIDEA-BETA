import { expect, test } from "@playwright/test";

test("ilustrasi arsip menampilkan footer tanpa tertutup label pada semua breakpoint", async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const scene = page.locator(".archive-scene:visible");
    await expect(scene.getByText("12 bulan garansi")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const rects = await scene.evaluate((element) => {
      const scene = element.getBoundingClientRect();
      const footer = element
        .querySelector(".archive-footer")!
        .getBoundingClientRect();
      const label = element
        .querySelector(".floating-label")!
        .getBoundingClientRect();
      return {
        bottom: scene.bottom,
        left: scene.left,
        right: scene.right,
        footerBottom: footer.bottom,
        footerLeft: footer.left,
        footerRight: footer.right,
        labelTop: label.top,
        labelBottom: label.bottom,
      };
    });
    expect(rects.footerBottom, `footer/label @ ${width}`).toBeLessThanOrEqual(
      rects.labelTop,
    );
    expect(rects.footerLeft).toBeGreaterThanOrEqual(rects.left);
    expect(rects.footerRight).toBeLessThanOrEqual(rects.right);
    expect(rects.labelBottom).toBeLessThanOrEqual(rects.bottom);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("menu landing dengan keyboard dan pencarian dashboard tetap berfungsi", async ({
  page,
}) => {
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Buka menu", exact: true });
    await toggle.click();
    await expect(
      page.getByRole("link", { name: "Manfaat", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await page
      .getByRole("navigation", { name: "Navigasi beranda" })
      .getByRole("link", { name: "Fitur", exact: true })
      .click();
    await expect(page).toHaveURL(/#fitur$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }
  // Authenticated dashboard search is covered by generated-user integration tests.
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});
