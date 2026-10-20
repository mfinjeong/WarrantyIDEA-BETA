import { test, expect } from "@playwright/test";

test("public copy targets aftersales teams and labels the collaboration prototype", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tangani laporan kerusakan",
    { timeout: 3000 },
  );
  await expect(page.locator(".b2b-scope")).toContainText("belum aktif");
  await expect(page.locator(".b2b-scope")).toContainText("arsip pribadi");
  await expect(page.locator("#fitur")).toContainText("Pemberi garansi");
  await expect(page.locator("#fitur")).toContainText("Mitra servis");
  await expect(page.locator("#cara-kerja")).toContainText("uji coba");
  await expect(page.locator('.archive-close a[href="/register"]')).toHaveText(
    /arsip pribadi/,
  );
});

test("buyer registration does not pretend to create an organization workspace", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(page.locator(".auth-account-scope")).toContainText(
    "arsip pribadi",
    { timeout: 3000 },
  );
  await expect(page.locator(".auth-account-scope")).toContainText(
    "belum tersedia",
  );
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
});
