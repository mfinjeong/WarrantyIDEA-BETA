import { test, expect, type Page } from "@playwright/test";

const password = `Browser-${crypto.randomUUID()}-${crypto.randomUUID()}`;
test.beforeEach(() => {
  const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
  if (process.env.WARRANTYIDEA_E2E_ALLOW_WRITES !== "1" || !["127.0.0.1", "localhost"].includes(url.hostname) || !url.pathname.includes("test")) {
    throw new Error("Browser writes require WARRANTYIDEA_E2E_ALLOW_WRITES=1 and an isolated loopback test DATABASE_URL.");
  }
});
async function register(page: Page, name = "Browser User") {
  const email = `browser-${crypto.randomUUID()}@example.test`;
  await page.goto("/register");
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirm").fill(password);
  await page.getByRole("checkbox").check();
  for (let attempt = 0; attempt < 2; attempt++) {
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/sign-up/email" && r.request().method() === "POST");
    await page.getByRole("button", { name: "Buat akun", exact: true }).click();
    const response = await pending;
    if (response.status() !== 429) break;
    if (attempt === 1) throw new Error("Registration remained rate-limited after Retry-After");
    const seconds = Number(response.headers()["retry-after"] || 60);
    await page.waitForTimeout((Math.min(60, Math.max(1, seconds)) + 1) * 1000);
  }
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: `Halo, ${name.split(" ")[0]}.` })).toBeVisible();
  return email;
}

test("protected routes require authentication without direct bypass", async ({ page }) => {
  await page.goto("/app/warranties");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Jelajahi tanpa mengisi form")).toHaveCount(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("real registration, persisted CRUD, server search, logout and isolation", async ({ page, browser }) => {
  const email = await register(page);
  await expect(page.locator(".mode-switch")).toHaveCount(0);
  await page.goto("/app/warranties/new");
  await page.getByRole("button", { name: "Simpan garansi", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText("Periksa kembali");
  for (const [id, value] of Object.entries({ productName: "Private Browser Headphone", brand: "Test", model: "A1", serialNumber: `SERIAL-${crypto.randomUUID()}`, store: "Browser Store", purchaseDate: "2026-01-01", expiryDate: "2030-01-01" })) await page.locator(`#${id}`).fill(value);
  await page.getByRole("button", { name: "Simpan garansi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Private Browser Headphone", exact: true })).toBeVisible();
  const detail = new URL(page.url()).pathname;
  await page.reload();
  await expect(page.getByRole("heading", { name: "Private Browser Headphone", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.locator("#productName").fill("Private Updated Headphone");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByRole("heading", { name: "Private Updated Headphone", exact: true })).toBeVisible();
  await page.goto("/app/warranties");
  const queryRequest = page.waitForRequest(r => r.url().includes("/api/warranties?") && r.url().includes("q=Private"));
  await page.getByLabel("Cari produk, merek, model, serial, atau toko").fill("Private");
  await queryRequest;
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const other = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const second = await other.newPage();
  await register(second, "Other Buyer");
  const denied = await second.request.get(`/api/warranties/${detail.split("/").pop()}`);
  expect(denied.status()).toBe(404);
  await second.goto(detail);
  await expect(second.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  await other.close();
  await page.goto("/app/profile");
  await expect(page.locator("#profile-email")).toHaveValue(email);
  await page.locator("#profile-name").fill("Updated Buyer");
  await page.getByRole("button", { name: "Simpan profil", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Updated Buyer", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("#profile-name")).toHaveValue("Updated Buyer");
  await expect(page.getByRole("button", { name: "Reset data demo" })).toHaveCount(0);
  await page.locator(".sidebar").getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto(detail);
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hapus garansi", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/warranties$/);
  expect(await page.evaluate(() => localStorage.getItem("warrantyidea:demo:v1"))).toBeNull();
});

test("failed workspace has retry instead of fake records or endless skeleton", async ({ page }) => {
  await register(page);
  await page.route("**/api/workspace?*", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "Server unavailable" } }) }));
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Server unavailable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();
  await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  await page.unroute("**/api/workspace?*");
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByRole("heading", { name: "Halo, Browser." })).toBeVisible();
});

test("scan stays nonpersistent simulation", async ({ page }) => {
  await register(page);
  await page.goto("/app/scan");
  await expect(page.getByRole("status").first()).toContainText("Simulasi scan");
  await page.getByRole("button", { name: "Simulasikan hasil QR" }).click();
  await expect(page.getByRole("heading", { name: "Data contoh siap dilengkapi." })).toBeVisible();
  expect((await (await page.request.get("/api/warranties")).json()).data.total).toBe(0);
});


test("account switch in another tab clears private form state", async ({ page }) => {
  await register(page, "Shared Display");
  await page.goto("/app/profile");
  await page.locator("#profile-name").fill("Private draft from prior account");
  const nextEmail = `switched-${crypto.randomUUID()}@example.test`;
  // The request context shares cookies with this browser, like signing in in another tab.
  const switched = await page.request.post("/api/auth/sign-up/email", {
    headers: { Origin: new URL(page.url()).origin },
    data: { name: "Shared Display", email: nextEmail, password },
  });
  expect(switched.status()).toBe(200);
  const revalidated = page.waitForResponse(r => r.url().includes("/api/workspace?scope=buyer") && r.status() === 200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await revalidated;
  await expect(page.locator("#profile-email")).toHaveValue(nextEmail);
  await expect(page.locator("#profile-name")).toHaveValue("Shared Display");
});

test("identity revalidation hides private content without losing same-user drafts", async ({ page }) => {
  await register(page);
  await page.goto("/app/profile");
  await page.locator("#profile-name").fill("Unsaved same-user draft");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/workspace?scope=buyer", async route => { await gate; await route.continue(); });
  try {
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("status").filter({ hasText: "Memeriksa sesi akun" })).toBeVisible();
    await expect(page.locator("#profile-name")).not.toBeVisible();
  } finally { release(); }
  await expect(page.locator("#profile-name")).toBeVisible();
  await expect(page.locator("#profile-name")).toHaveValue("Unsaved same-user draft");
  await page.unroute("**/api/workspace?scope=buyer");
});

test("stale form mutation is rejected when the session changes before focus", async ({ page }) => {
  await register(page, "Original Owner");
  await page.goto("/app/profile");
  await page.locator("#profile-name").fill("Old account private draft");
  const nextEmail = `new-session-${crypto.randomUUID()}@example.test`;
  const switched = await page.request.post("/api/auth/sign-up/email", {
    headers: { Origin: new URL(page.url()).origin },
    data: { name: "New Owner", email: nextEmail, password },
  });
  expect(switched.status()).toBe(200);
  const rejected = page.waitForResponse(r => new URL(r.url()).pathname === "/api/profile" && r.request().method() === "PATCH");
  await page.evaluate(() => document.querySelector("form")?.requestSubmit());
  expect((await rejected).status()).toBe(409);
  await expect(page.locator("#profile-email")).toHaveValue(nextEmail);
  await expect(page.locator("#profile-name")).toHaveValue("New Owner");
});

test("server pagination, category and sort retain query state", async ({ page }) => {
  await register(page);
  for (let index = 0; index < 7; index++) {
    const response = await page.request.post("/api/warranties", { headers: { Origin: new URL(page.url()).origin }, data: {
      productName: `Pagination ${index}`, brand: "Test", model: "A1", category: "home",
      serialNumber: `PAGE-${crypto.randomUUID()}`, store: "Test Store", purchaseDate: "2026-01-01", expiryDate: "2030-01-01", notes: "",
    } });
    expect(response.status()).toBe(201);
  }
  await page.goto("/app/warranties?category=home&sort=name");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await expect(page.getByText("7 garansi ditemukan", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Pagination 6");
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.locator("#category").selectOption("electronics");
  await expect(page.getByRole("heading", { name: "Tidak ada garansi yang cocok" })).toBeVisible();
  await expect(page).not.toHaveURL(/page=2/);
});
