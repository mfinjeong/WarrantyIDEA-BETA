import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("demo has no automated accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#contoh-arsip").scrollIntoViewIfNeeded();
  const audit = await new AxeBuilder({ page })
    .include("#contoh-arsip")
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("routing follows the actual next actor", async ({ page }) => {
  await page.goto("/");
  const demo = page.locator("#contoh-arsip");
  await demo.getByRole("button", { name: "Laporan", exact: true }).click();
  await expect(demo.locator(".af-route-line")).toHaveAttribute(
    "d",
    "M65 39H260",
  );
  await demo.getByRole("button", { name: "Kelengkapan", exact: true }).click();
  await expect(demo.locator(".af-route-line")).toHaveAttribute(
    "d",
    "M260 39H455",
  );
});

test("replay stops and selection cancels stale progression", async ({
  page,
}) => {
  await page.goto("/");
  const demo = page.locator("#contoh-arsip");
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await expect(demo).toHaveAttribute("data-playing", "true");
  await demo.getByRole("button", { name: "Hentikan" }).click();
  await expect(demo).toHaveAttribute("data-playing", "false");
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await demo.getByRole("button", { name: "Keputusan", exact: true }).click();
  await page.waitForTimeout(1000);
  await expect(
    demo.getByRole("button", { name: "Keputusan", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(demo).toHaveAttribute("data-playing", "false");
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await expect(demo).toHaveAttribute("data-playing", "false", {
    timeout: 6500,
  });
  await expect(
    demo.getByRole("button", { name: "Pengembalian", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("reduced motion retains controls and interrupts active playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const demo = page.locator("#contoh-arsip");
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await expect(demo).toHaveAttribute("data-playing", "false");
  await expect(
    demo.getByRole("button", { name: "Pengembalian", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(demo).toHaveAttribute("data-playing", "false");
  expect(
    await demo.evaluate(
      (el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running").length,
    ),
  ).toBe(0);
});

test("playback pauses offscreen and on document visibility change", async ({
  page,
}) => {
  await page.goto("/");
  const demo = page.locator("#contoh-arsip");
  await demo.getByRole("button", { name: "Putar ulang alur" }).click();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await expect
    .poll(() =>
      demo.evaluate(
        (el) =>
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "paused").length,
      ),
    )
    .toBeGreaterThan(0);
  await demo.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() =>
      demo.evaluate(
        (el) =>
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "paused").length,
      ),
    )
    .toBeGreaterThan(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`demo fits ${width}px with stable phase height`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const demo = page.locator("#contoh-arsip");
    await demo.scrollIntoViewIfNeeded();
    const heights: number[] = [];
    for (const name of [
      "Laporan",
      "Kelengkapan",
      "Pemeriksaan",
      "Keputusan",
      "Pengembalian",
    ]) {
      await demo.getByRole("button", { name, exact: true }).click();
      heights.push((await demo.boundingBox())!.height);
    }
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2);
    const box = (await demo.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    for (const button of await demo.getByRole("button").all())
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: `test-results/aftersales-${width}.png`,
      fullPage: true,
    });
  });
}

test("one fictional case exposes role-specific handoffs and all five stages", async ({
  page,
}) => {
  await page.goto("/");
  const demo = page.locator("#contoh-arsip");
  await demo.scrollIntoViewIfNeeded();
  await expect(
    demo.getByText("Simulasi interaktif · data fiktif"),
  ).toBeVisible();
  await expect(demo.getByText("Belum terhubung ke sistem klaim")).toBeVisible();
  await demo
    .getByRole("button", { name: "Petugas garansi", exact: true })
    .click();
  await expect(
    demo.getByRole("button", { name: "Petugas garansi", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await demo.getByRole("button", { name: "Keputusan", exact: true }).click();
  await expect(
    demo.getByText("Menunggu keputusan pihak berwenang", { exact: true }),
  ).toBeVisible();
  await demo.getByRole("button", { name: "Mitra servis", exact: true }).click();
  await expect(demo.getByTestId("role-detail")).toContainText("pemeriksaan");
  await demo.getByRole("button", { name: "Pengembalian", exact: true }).click();
  await expect(demo.getByTestId("case-trace").locator("li")).toHaveCount(5);
  await expect(
    demo.getByText("DEMO-WI-2048", { exact: true }).first(),
  ).toBeVisible();
});
