import { test, expect } from "@playwright/test";

test("green public action palette remains consistent with the account entry", async ({
  page,
}) => {
  for (const route of ["/", "/login", "/register"]) {
    await page.goto(route);
    const channels = await page
      .locator(".btn")
      .first()
      .evaluate((node) =>
        getComputedStyle(node).backgroundColor.match(/\d+/g)!.map(Number),
      );
    expect(channels[1]).toBeGreaterThan(channels[0] * 1.5);
    expect(channels[1]).toBeGreaterThan(channels[2] * 1.1);
  }
});

test("reduced-motion auth illustration stays factual and static", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/register");
  await expect(page.locator(".auth-archive .sample-range")).toContainText(
    "12 September 2026",
  );
  await expect(page.locator(".auth-archive .sample-range")).toContainText(
    "12 September 2027",
  );
  expect(
    await page
      .locator(".auth-archive")
      .evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running").length,
      ),
  ).toBe(0);
});

test("public explanation and navigation remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tangani laporan kerusakan",
  );
  await expect(page.locator(".b2b-scope")).toContainText("belum aktif");
  await expect(
    page.locator('.archive-close a[href="/register"]'),
  ).toBeVisible();
  await context.close();
});
