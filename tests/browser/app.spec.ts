import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("semua rute terbuka, termasuk not-found dan ID hilang", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const routes = [
    "/",
    "/login",
    "/register",
    "/admin/login",
    "/app",
    "/app/warranties",
    "/app/warranties/w1",
    "/app/warranties/w1/edit",
    "/app/warranties/new",
    "/app/scan",
    "/app/notifications",
    "/app/profile",
    "/admin",
    "/admin/catalog",
    "/admin/reviews",
    "/admin/reviews/w1",
    "/admin/notifications",
    "/admin/profile",
    "/app/warranties/missing",
    "/admin/reviews/missing",
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  }
  const response = await page.goto("/not-a-route");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("CRUD pembeli, validasi, URL filter, persistensi dan hapus", async ({
  page,
}) => {
  await page.goto("/app/warranties/new");
  await expect(page.getByLabel("Nama produk", { exact: false })).toBeVisible();
  await page
    .getByRole("button", { name: "Simpan garansi", exact: true })
    .click();
  await expect(page.getByRole("alert").first()).toContainText(
    "Periksa kembali",
  );
  const fields = [
    ["Nama produk", "Test Headphone"],
    ["Merek", "Test Brand"],
    ["Model", "Model A"],
    ["Nomor seri", "DEMO-TEST-100"],
    ["Toko pembelian", "Toko Demo"],
    ["Tanggal pembelian", "2026-01-01"],
    ["Tanggal berakhir", "2028-01-01"],
  ] as const;
  for (const [label, value] of fields)
    await page.getByLabel(label, { exact: false }).fill(value);
  await page
    .getByRole("button", { name: "Simpan garansi", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/warranties\/[^/]+$/);
  await expect(
    page.getByRole("heading", { name: "Test Headphone", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Test Headphone", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Nama produk", { exact: false })
    .fill("Test Headphone Updated");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(
    page.getByRole("heading", { name: "Test Headphone Updated", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke daftar garansi" }).click();
  await page
    .getByLabel("Cari produk, merek, model, serial, atau toko")
    .fill("Test Headphone");
  await expect(page).toHaveURL(/q=Test/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByLabel("Status garansi", { exact: true })
    .selectOption("active");
  await expect(page).toHaveURL(/status=active/);
  await page
    .getByRole("link", { name: /Test Headphone Updated/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Batal", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Hapus garansi", exact: true })
    .click();
  await expect(page).toHaveURL("/app/warranties");
  await page
    .getByLabel("Cari produk, merek, model, serial, atau toko")
    .fill("Test Headphone");
  await expect(
    page.getByRole("heading", { name: "Tidak ada garansi yang cocok" }),
  ).toBeVisible();
});

test("admin review memperbarui buyer dan notifikasi, katalog CRUD", async ({
  page,
}) => {
  await page.goto("/admin/reviews/w1");
  await page.getByRole("button", { name: "Setujui", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Setujui", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tinjau ulang" }),
  ).toBeVisible();
  await page.goto("/app/warranties/w1");
  await expect(page.locator(".detail-badges")).toContainText("Disetujui");
  await page.goto("/app/notifications");
  await expect(
    page.getByRole("heading", { name: "Tinjauan demo disetujui" }),
  ).toBeVisible();
  await page.goto("/admin/catalog");
  await page
    .getByRole("button", { name: "Tambah produk", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama produk").fill("Test Catalog");
  await dialog.getByLabel("Merek", { exact: false }).fill("Demo Brand");
  await dialog.getByLabel("Model", { exact: false }).fill("Test-100");
  await dialog.getByRole("button", { name: "Simpan produk" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByLabel("Cari nama, merek, atau model katalog")
    .fill("Test Catalog");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Edit Test Catalog" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Model", { exact: false })
    .fill("Test-200");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Simpan produk" })
    .click();
  await expect(page.locator("tbody")).toContainText("Test-200");
  await page
    .locator("tbody")
    .getByRole("button", { name: "Nonaktifkan", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Nonaktifkan", exact: true })
    .click();
  await expect(page.locator("tbody")).toContainText("Nonaktif");
});

test("scan simulasi dan preview nota hanya lokal, draft tidak auto-save", async ({
  page,
}) => {
  await page.goto("/app/scan");
  await expect(page.getByRole("status").first()).toContainText("Simulasi scan");
  await page.getByRole("tab", { name: "Barcode", exact: true }).click();
  await page.getByRole("button", { name: "Simulasikan hasil Barcode" }).click();
  await expect(
    page.getByRole("heading", { name: "Data contoh siap dilengkapi." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Barcode", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "QR code" })).toBeFocused();
  await page.locator("input[type=file]").setInputFiles({
    name: "nota.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByAltText("Preview lokal nota yang dipilih"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Simulasikan pembacaan nota" })
    .click();
  await expect(
    page.getByText("Data contoh, bukan hasil pembacaan gambar.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gunakan data contoh" }).click();
  await expect(page.getByLabel("Nama produk", { exact: false })).toHaveValue(
    "Headphone wireless",
  );
  await expect(
    page.getByAltText("Preview lokal nota yang dipilih"),
  ).toBeVisible();
  const raw = await page.evaluate(() =>
    localStorage.getItem("warrantyidea:demo:v1"),
  );
  expect(raw).not.toContain("blob:");
  expect(raw).not.toContain("base64");
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Tinggalkan perubahan?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("storage rusak, diblokir, dan reset pulih tanpa hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("warrantyidea:demo:v1")),
    )
    .not.toBeNull();
  await page.evaluate(() =>
    localStorage.setItem("warrantyidea:demo:v1", "{bad"),
  );
  await page.goto("/app");
  await expect(
    page.getByText(
      "Penyimpanan demo tidak tersedia atau datanya tidak valid.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Halo, Alex." }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("unrelated", "keep"));
  await page.goto("/app/profile");
  await page.getByLabel("Nama tampilan demo").fill("Test User");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.getByRole("heading", { name: "Test User" })).toBeVisible();
  await page.getByRole("button", { name: "Reset data demo" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset data demo" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Alex Morgan" }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("unrelated"))).toBe(
    "keep",
  );
  expect(errors).toEqual([]);
});

test("layout responsif, screenshot, reduced motion dan aksesibilitas utama", async ({
  page,
}) => {
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/app",
      "/app/warranties",
      "/app/warranties/new",
      "/app/scan",
      "/admin",
      "/admin/catalog",
      "/admin/reviews/w1",
      "/login",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} @ ${width}`,
      ).toBe(true);
      const slug =
        route === "/"
          ? "landing"
          : route === "/app"
            ? "buyer"
            : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: `test-results/${slug}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/app");
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of [
    "/",
    "/app",
    "/app/warranties",
    "/app/warranties/w1",
    "/app/warranties/new",
    "/app/scan",
    "/app/profile",
    "/app/notifications",
    "/login",
    "/register",
    "/admin/login",
    "/admin",
    "/admin/catalog",
    "/admin/reviews",
    "/admin/reviews/w1",
    "/admin/notifications",
    "/admin/profile",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});

test("keyboard, fokus dialog, navigasi mobile, dan filter melalui history", async ({
  page,
}) => {
  await page.goto("/app/warranties");
  await page
    .getByLabel("Cari produk, merek, model, serial, atau toko")
    .fill("Sonic");
  await expect(page).toHaveURL(/q=Sonic/);
  await page
    .getByLabel("Status garansi", { exact: true })
    .selectOption("expired");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.goBack();
  await expect(page).not.toHaveURL(/status=expired/);
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Aksi untuk Headphone wireless" })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Aksi untuk Headphone wireless" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel("Buka filter dan urutan").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Buka filter dan urutan")).toBeFocused();
  await page.getByLabel("Buka menu", { exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Admin", exact: false })
    .click();
  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Buka menu", { exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Katalog produk" })
    .click();
  await expect(page).toHaveURL("/admin/catalog");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("registrasi demo memvalidasi field dan tidak menyimpan kredensial", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Buat profil demo" }).click();
  await expect(
    page.getByText("Nama tampilan harus 2–60 karakter."),
  ).toBeVisible();
  await page
    .getByLabel("Nama tampilan demo", { exact: false })
    .fill("Rani Demo");
  await page
    .getByLabel("Email demo", { exact: false })
    .fill("rani@example.test");
  await page.getByLabel(/^Password demo/).fill("fake-password-2026");
  await page
    .getByLabel("Konfirmasi password", { exact: false })
    .fill("fake-password-2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Buat profil demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Halo, Rani." }),
  ).toBeVisible();
  const raw = await page.evaluate(() =>
    localStorage.getItem("warrantyidea:demo:v1"),
  );
  expect(raw).not.toContain("fake-password");
  expect(raw).not.toContain("rani@example.test");
  await page.goto("/admin/login");
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await page
    .getByLabel("Email demo", { exact: false })
    .fill("admin@example.test");
  await page.getByLabel(/^Password demo/).fill("fake-admin");
  await page
    .getByRole("button", { name: "Masuk demo admin", exact: true })
    .click();
  await expect(page).toHaveURL("/admin");
});

test("storage diblokir tetap memungkinkan CRUD dalam memori", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app/profile");
  await expect(
    page.getByText(
      "Penyimpanan tidak tersedia. Perubahan hanya bertahan di sesi ini.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByLabel("Nama tampilan demo").fill("Memory Demo");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(
    page.getByRole("heading", { name: "Memory Demo" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Navigasi pembeli" })
    .first()
    .getByRole("link", { name: "Ringkasan" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Halo, Memory." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("preview valid tidak diganti file invalid, lalu hilang setelah refresh", async ({
  page,
}) => {
  await page.goto("/app/warranties/w1/edit");
  const file = page.locator("input[type=file]");
  await file.setInputFiles({
    name: "nota.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByAltText("Preview lokal nota yang dipilih"),
  ).toBeVisible();
  await file.setInputFiles({
    name: "nota.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("dummy"),
  });
  await expect(
    page.getByText("Pilih gambar JPG, PNG, atau WebP.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByAltText("Preview lokal nota yang dipilih"),
  ).toBeVisible();
  await file.setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByText("Ukuran gambar maksimal 5 MB.")).toBeVisible();
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(
    page.getByAltText("Preview nota lokal", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Preview lokal tidak tersedia lagi setelah refresh.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByAltText("Preview nota lokal", { exact: true }),
  ).toHaveCount(0);
});

test("penolakan memerlukan alasan, tinjau ulang dan status notifikasi berfungsi", async ({
  page,
}) => {
  await page.goto("/admin/reviews/w2");
  await page.getByRole("button", { name: "Tolak", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tolak", exact: true })
    .click();
  await expect(page.getByText("Alasan harus 10–500 karakter.")).toBeVisible();
  await page
    .getByLabel("Alasan penolakan", { exact: false })
    .fill("Nomor seri contoh perlu dilengkapi.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tolak", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tinjau ulang" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tinjau ulang" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Kembalikan ke antrean" })
    .click();
  await expect(
    page.getByRole("button", { name: "Setujui", exact: true }),
  ).toBeVisible();
  await page.goto("/app/notifications");
  await expect(
    page.getByRole("heading", { name: "Tinjauan demo ditolak" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
  await page.getByRole("tab", { name: /Belum dibaca/ }).click();
  await expect(
    page.getByRole("heading", { name: "Semua sudah terbaca" }),
  ).toBeVisible();
});

test("reflow setara zoom 200 persen dan audit aksesibilitas mobile", async ({
  page,
}) => {
  // A 1440px desktop viewport at 200% zoom has a 720px CSS layout viewport.
  await page.setViewportSize({ width: 720, height: 500 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/app",
    "/app/warranties/new",
    "/app/scan",
    "/admin/catalog",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/app", "/app/warranties", "/app/scan", "/admin"]) {
    await page.goto(route);
    await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});
