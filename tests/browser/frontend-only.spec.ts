import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 768, 1440]) {
  test(`halaman foto ringan, terbaca, dan aksesibel pada ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Informasi jangan ikut hilang",
    );
    await expect(page.locator("header")).not.toContainText(
      /demo|masuk|daftar|dashboard/i,
    );
    await expect(page.locator(".hero-photo img")).toBeVisible();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>("main img")].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    expect(await page.locator("main img").count()).toBeGreaterThanOrEqual(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("semua tautan bagian menuju konten yang tersedia", async ({ page }) => {
  await page.goto("/");
  const targets = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const href of targets) {
    expect(href).not.toBe("#");
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await page.getByRole("link", { name: "Lihat alurnya", exact: true }).click();
  await expect(page).toHaveURL(/#alur$/);
});

test("menu mobile menutup saat Escape, klik luar, memilih tautan, dan resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator(".mobile-menu");
  const toggle = menu.locator("summary");
  await toggle.click();
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".hero-photo").click();
  await expect(menu).not.toHaveAttribute("open", "");
  await toggle.click();
  await menu.getByRole("link", { name: "Alur penanganan" }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).not.toHaveAttribute("open", "");
});

for (const width of [390, 1440]) {
  test(`konten, navigasi, dan FAQ berfungsi tanpa JavaScript pada ${width}px`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 1000 },
    });
    const page = await context.newPage();
    try {
      expect((await page.goto(baseURL!))?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (width < 768) {
        await page.locator(".mobile-menu summary").click();
        await expect(page.locator(".mobile-menu nav")).toBeVisible();
      }
      const question = page.locator(".faq-list details").first();
      await question.locator("summary").click();
      await expect(question.locator("p")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
}

test("tidak memanggil API, menyimpan data, atau menawarkan akun palsu", async ({
  page,
  context,
}) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType()))
      calls.push(request.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  for (const summary of await page.locator(".faq-list summary").all())
    await summary.click();
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(
    page.locator(
      'a[href^="/login"], a[href^="/register"], a[href^="/app"], a[href^="/admin"], form, input',
    ),
  ).toHaveCount(0);
  await expect(page.locator(".site-scope")).toContainText(
    /tidak menerima klaim/i,
  );
  expect(calls).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("rute aplikasi dan API lama benar-benar tidak tersedia", async ({
  request,
}) => {
  for (const path of [
    "/login",
    "/register",
    "/app",
    "/app/warranties",
    "/admin",
    "/admin/login",
    "/api/auth/get-session",
    "/api/workspace",
    "/api/catalog",
    "/api/warranties",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("keyboard dapat melewati navigasi menuju konten utama", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Lewati ke konten utama" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("reduced motion mematikan animasi tanpa menyembunyikan informasi", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-photo")).toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
});
