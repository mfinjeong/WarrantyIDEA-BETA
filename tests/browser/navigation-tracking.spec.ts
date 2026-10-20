import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    __navigationIntersection?: (entries: { id: string; visible: boolean; top: number }[]) => void;
  }
}

test("current-section tracking retains targets omitted from observer delta callbacks", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      private callback: IntersectionObserverCallback;
      private navigationObserver: boolean;
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        this.callback = callback;
        this.navigationObserver = options?.rootMargin === "-12% 0px -45% 0px";
      }
      observe(target: Element) {
        if (this.navigationObserver && ["contoh-arsip", "fitur", "cara-kerja"].includes(target.id)) {
          window.__navigationIntersection = (changes) => {
            const entries = changes.map(({ id, visible, top }) => {
              const element = document.getElementById(id)!;
              const rect = new DOMRect(0, top, 400, 200);
              element.getBoundingClientRect = () => rect;
              return { target: element, isIntersecting: visible, boundingClientRect: rect,
                intersectionRect: visible ? rect : new DOMRect(), intersectionRatio: visible ? 1 : 0,
                rootBounds: null, time: performance.now() };
            });
            this.callback(entries, this);
          };
        } else super.observe(target);
      }
    };
  });
  await page.goto("/");
  await page.waitForFunction(() => !!window.__navigationIntersection);
  const nav = page.locator("#marketing-navigation");
  await page.evaluate(() => window.__navigationIntersection!([{ id: "contoh-arsip", visible: true, top: 100 }]));
  await expect(nav.locator('[href="#contoh-arsip"]')).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => window.__navigationIntersection!([{ id: "fitur", visible: true, top: 200 }]));
  await expect(nav.locator('[href="#contoh-arsip"]')).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => window.__navigationIntersection!([{ id: "contoh-arsip", visible: false, top: -300 }]));
  await expect(nav.locator('[href="#fitur"]')).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => window.__navigationIntersection!([{ id: "contoh-arsip", visible: true, top: 80 }]));
  await expect(nav.locator('[href="#contoh-arsip"]')).toHaveAttribute("aria-current", "location");
});

test("scroll-only tracking, outside dismissal and breakpoint focus remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const nav = page.locator("#marketing-navigation");
  for (const id of ["fitur", "cara-kerja", "contoh-arsip"]) {
    await page.evaluate((id) => document.getElementById(id)!.scrollIntoView(), id);
    await expect(nav.locator(`[href="#${id}"]`)).toHaveAttribute("aria-current", "location");
  }
  await nav.locator('a[href="#contoh-arsip"]').focus();
  await page.setViewportSize({ width: 390, height: 1000 });
  const menu = page.locator(".marketing-menu-toggle");
  await expect(nav).toHaveAttribute("inert", "");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.mouse.click(4, 900);
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(nav).not.toBeVisible();
});
