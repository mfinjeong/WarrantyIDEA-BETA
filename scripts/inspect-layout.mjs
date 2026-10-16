import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3000/app/warranties/new");
await page.locator("h1").waitFor();
console.log(
  JSON.stringify(
    await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
        .map((el) => ({
          tag: el.tagName,
          cls: el.className,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width,
        }))
        .slice(0, 20),
    })),
    null,
    2,
  ),
);
await page.screenshot({
  path: "test-results/form-overflow.png",
  fullPage: true,
});
await browser.close();
