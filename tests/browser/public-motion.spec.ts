import { test, expect } from "@playwright/test";

test("walkthrough selection interrupts replay without a stale completion", async ({
  page,
}) => {
  await page.goto("/");
  const flow = page.locator(".warranty-flow");
  await flow.scrollIntoViewIfNeeded();
  await expect(
    flow.getByRole("button", { name: "Hentikan peragaan" }),
  ).toBeVisible();
  await flow.getByRole("button", { name: /Cek tanggal di nota/ }).click();
  await expect(
    flow.getByRole("button", { name: "Putar peragaan" }),
  ).toBeVisible();
  await page.waitForTimeout(3400);
  await expect(flow.locator(".flow-record")).toHaveAttribute("data-step", "1");
  await expect(flow.locator(".flow-status")).toContainText("Langkah 2");
});

test("reduced motion keeps every walkthrough step usable without autoplay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flow = page.locator(".warranty-flow");
  await flow.scrollIntoViewIfNeeded();
  await expect(
    flow.getByRole("button", { name: "Putar peragaan" }),
  ).toBeVisible();
  await expect(flow.locator(".flow-record")).toHaveAttribute("data-step", "0");
  await flow.getByRole("button", { name: "Putar peragaan" }).click();
  await expect(flow.locator(".flow-status")).toContainText("tanpa gerakan");
  await expect(flow.locator(".flow-record")).toHaveAttribute("data-step", "2");
  expect(
    await flow.evaluate(
      (node) =>
        node
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running").length,
    ),
  ).toBe(0);
  await flow.getByRole("button", { name: /Cek tanggal di nota/ }).click();
  await expect(flow.locator(".flow-record")).toContainText("tidak disimpan");
});

test("walkthrough pauses offscreen and resumes only when visible", async ({
  page,
}) => {
  await page.goto("/");
  const flow = page.locator(".warranty-flow");
  await flow.scrollIntoViewIfNeeded();
  await expect(
    flow.getByRole("button", { name: "Hentikan peragaan" }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await expect
    .poll(() =>
      flow
        .locator(".flow-record")
        .evaluate((node) =>
          node.getAnimations().some((a) => a.playState === "paused"),
        ),
    )
    .toBe(true);
  const step = await flow.locator(".flow-record").getAttribute("data-step");
  await page.waitForTimeout(1400);
  await expect(flow.locator(".flow-record")).toHaveAttribute(
    "data-step",
    step!,
  );
  await flow.scrollIntoViewIfNeeded();
  await expect(flow.locator(".flow-status")).toContainText("Peragaan selesai");
});

test("public walkthrough selects a real recording step with the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const flow = page.locator(".warranty-flow");
  await expect(flow).toBeVisible({ timeout: 3000 });
  const purchase = flow.getByRole("button", { name: /Cek tanggal di nota/ });
  await purchase.focus();
  await page.keyboard.press("Enter");
  await expect(purchase).toHaveAttribute("aria-pressed", "true");
  await expect(flow.locator(".flow-record")).toContainText("12 September 2026");
  await expect(flow.locator(".flow-record")).toContainText("tidak disimpan");
  await flow.getByRole("button", { name: /Lihat saat dibutuhkan/ }).click();
  await expect(flow.locator(".flow-record")).toContainText("DEMO-HP-0082");
  await expect(flow.locator(".flow-status")).toContainText("Langkah 3");
});

test("walkthrough plays once on entry and can replay to the final record", async ({
  page,
}) => {
  await page.goto("/");
  const flow = page.locator(".warranty-flow");
  await flow.scrollIntoViewIfNeeded();
  await expect(
    flow.getByRole("button", { name: "Hentikan peragaan" }),
  ).toBeVisible({ timeout: 3000 });
  await expect(flow.locator(".flow-status")).toContainText("Peragaan selesai", {
    timeout: 10000,
  });
  await expect(flow.locator(".flow-record")).toHaveAttribute("data-step", "2");
  await flow.getByRole("button", { name: "Putar peragaan" }).click();
  await expect(
    flow.getByRole("button", { name: "Hentikan peragaan" }),
  ).toBeVisible();
  await expect(flow.locator(".flow-status")).toContainText("Peragaan selesai", {
    timeout: 10000,
  });
});

test("sample warranty range follows the selected fictional product", async ({
  page,
}) => {
  await page.goto("/");
  const range = page.locator(".sample-range");
  await expect(range).toContainText("12 September 2026");
  await expect(range).toContainText("12 September 2027");
  await page.getByRole("button", { name: "Kamera", exact: true }).click();
  await expect(range).toContainText("24 Agustus 2026");
  await expect(range).toContainText("24 Oktober 2028");
  await expect(range).toContainText("Contoh");
});

test("public action palette is green, including login and registration", async ({
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
