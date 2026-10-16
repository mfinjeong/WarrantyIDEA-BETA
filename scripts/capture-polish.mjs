import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const stage = process.argv[2] || "after";
const baseURL = process.env.PREVIEW_URL || "http://localhost:3000";
const directory = `artifacts/ui-polish/${stage}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "id-ID",
  timezoneId: "Asia/Jakarta",
});
const page = await context.newPage();
const measurements = [];
for (const width of [1440, 1024, 768, 375, 320]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of ["/", "/app"]) {
    await page.goto(`${baseURL}${route}`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const slug = route === "/" ? "landing" : "buyer";
    await page.screenshot({
      path: `${directory}/${slug}-${width}.png`,
      fullPage: true,
    });
    measurements.push(
      await page.evaluate(
        ({ route, width }) => {
          const bounds = (selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          };
          return {
            route,
            width,
            pageWidth: document.documentElement.scrollWidth,
            hero: bounds(".landing-hero"),
            illustration: bounds(".archive-scene"),
            summary: bounds(".summary-strip"),
            expiring: bounds(".expiry-panel"),
            scan: bounds(".scan-promo"),
          };
        },
        { route, width },
      ),
    );
  }
}
await writeFile(
  `${directory}/measurements.json`,
  JSON.stringify(measurements, null, 2),
);
console.log(`Captured ${measurements.length} layouts in ${directory}`);
await browser.close();
