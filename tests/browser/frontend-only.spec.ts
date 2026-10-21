import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("bukti, pemeriksaan, dan tanggapan tersambung dalam grafis layanan", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Nota ada.",
  );
  await expect(page.locator(".handoff-scene")).toBeVisible();
  for (const name of [
    "Bukti pembelian",
    "Catatan pemeriksaan",
    "Tanggapan garansi",
  ]) {
    await expect(
      page.locator(".handoff-scene").getByRole("heading", { name }),
    ).toBeVisible();
  }
  await expect(page.locator(".brand-mark").first()).toBeVisible();
  await expect(page.locator("svg.lucide")).toHaveCount(0);
});

test("motion selesai sekali, replay dan stop membatalkan pekerjaan lama", async ({
  page,
}) => {
  await page.goto("/");
  const scene = page.locator(".handoff");
  await expect(scene).toHaveAttribute("data-playback", "running");
  await expect(scene).toHaveAttribute("data-playback", "complete", {
    timeout: 6500,
  });
  await page.getByRole("button", { name: "Putar ulang" }).click();
  await expect(scene).toHaveAttribute("data-playback", "running");
  await page.getByRole("button", { name: "Hentikan" }).click();
  await expect(scene).toHaveAttribute("data-playback", "stopped");
  await page.waitForTimeout(5000);
  await expect(scene).toHaveAttribute("data-playback", "stopped");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("motion menjeda di luar viewport dan tidak mengulang saat kembali", async ({
  page,
}) => {
  await page.goto("/");
  const graphic = page.locator(".handoff");
  await expect(graphic).toHaveAttribute("data-playback", "running");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.body.scrollHeight);
  });
  await expect(graphic).toHaveAttribute("data-playback", "paused");
  const time = await page.evaluate(async () => {
    const animations = document.getAnimations();
    // pause() commits on the animation timeline; wait for that commit before sampling.
    await Promise.all(animations.map((animation) => animation.ready));
    return animations.map((animation) => animation.currentTime);
  });
  expect(time.length).toBeGreaterThan(0);
  await page.waitForTimeout(350);
  expect(
    await page.evaluate(() =>
      document.getAnimations().map((animation) => animation.currentTime),
    ),
  ).toEqual(time);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(graphic).toHaveAttribute("data-playback", "complete", {
    timeout: 6500,
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(graphic).toHaveAttribute("data-playback", "complete");
});

test("perubahan reduced motion membatalkan replay tanpa status kedaluwarsa", async ({
  page,
}) => {
  await page.goto("/");
  const graphic = page.locator(".handoff");
  await expect(graphic).toHaveAttribute("data-playback", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(graphic).toHaveAttribute("data-playback", "reduced");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.getByRole("button", { name: "Putar ulang" }).click();
  await expect(graphic).toHaveAttribute("data-playback", "reduced");
  await page.waitForTimeout(4500);
  await expect(graphic).toHaveAttribute("data-playback", "reduced");
  await expect(
    graphic.getByRole("heading", { name: "Tanggapan garansi" }),
  ).toBeVisible();
});

test("visibilitychange menjeda animasi dan resize menghentikan jalur lama", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".handoff")).toHaveAttribute(
    "data-playback",
    "running",
  );
  // Listener-level visibility test; not evidence of a genuine OS background-tab transition.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".handoff")).toHaveAttribute(
    "data-playback",
    "paused",
  );
  expect(
    await page.evaluate(() =>
      document.getAnimations().every((a) => a.playState === "paused"),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".handoff")).toHaveAttribute(
    "data-playback",
    "running",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".handoff")).toHaveAttribute(
    "data-playback",
    "stopped",
  );
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("menu native mendukung Enter, Space dan fokus yang aman setelah resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator(".mobile-menu summary");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator(".mobile-menu nav a").first()).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".desktop-nav a").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#manfaat$/);
});

test("kontrol motion tidak menggeser grafis saat hidrasi", async ({
  browser,
  baseURL,
}) => {
  for (const width of [390, 1440]) {
    const withoutJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 1000 },
    });
    const withJS = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width, height: 1000 },
    });
    try {
      const staticPage = await withoutJS.newPage();
      const activePage = await withJS.newPage();
      await staticPage.goto(baseURL!);
      await activePage.goto(baseURL!);
      await expect(
        activePage.getByRole("button", { name: "Putar ulang" }),
      ).toBeVisible();
      const staticBox = await staticPage
        .locator(".handoff-caption")
        .boundingBox();
      const activeBox = await activePage
        .locator(".handoff-caption")
        .boundingBox();
      expect(
        Math.abs(staticBox!.height - activeBox!.height),
      ).toBeLessThanOrEqual(2);
    } finally {
      await withoutJS.close();
      await withJS.close();
    }
  }
});

test("barcode nota tidak menimpa keluhan pada layar sempit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const bars = await page.locator(".receipt-bars").boundingBox();
  const complaint = await page
    .locator(".evidence-object > strong")
    .boundingBox();
  const overlapX =
    bars!.x < complaint!.x + complaint!.width &&
    bars!.x + bars!.width > complaint!.x;
  const overlapY =
    bars!.y < complaint!.y + complaint!.height &&
    bars!.y + bars!.height > complaint!.y;
  expect(overlapX && overlapY).toBe(false);
});

test("cap tanggapan tidak menimpa rincian selama handoff", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Putar ulang" }).click();
  const stamp = await page.locator(".response-stamp").boundingBox();
  const details = await page.locator(".response-object dl").boundingBox();
  expect(stamp!.y + stamp!.height).toBeLessThanOrEqual(details!.y);
});

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
      "Setelah itu, apa?",
    );
    await expect(page.locator("header")).not.toContainText(
      /demo|masuk|daftar|dashboard/i,
    );
    await expect(page.locator(".inspection-photo img")).toBeVisible();
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
  await page.locator(".inspection-photo").click();
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
      for (const name of [
        "Bukti pembelian",
        "Catatan pemeriksaan",
        "Tanggapan garansi",
      ]) {
        await expect(
          page.locator(".handoff-scene").getByRole("heading", { name }),
        ).toBeVisible();
      }
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
  await expect(page.locator(".handoff-scene")).toBeVisible();
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
