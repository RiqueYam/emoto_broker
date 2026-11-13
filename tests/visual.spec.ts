import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const LIVE = 'https://edusoaresbroker.com.br/imoveis';
const OUT = 'test-results/screens';

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Scroll through once so lazy images load, then return to the top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

/** Share of pixels whose max channel difference exceeds `tol`. */
async function diffRatio(a: Buffer, b: Buffer, w: number, h: number, tol = 24) {
  const crop = (img: Buffer) =>
    sharp(img).extract({ left: 0, top: 0, width: w, height: h }).raw().ensureAlpha().toBuffer();
  const [x, y] = await Promise.all([crop(a), crop(b)]);
  let n = 0;
  for (let i = 0; i < x.length; i += 4) {
    const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
    if (d > tol) n++;
  }
  return n / (w * h);
}

test.use({ reducedMotion: 'reduce' });

test('full-page screenshots for review', async ({ page }, info) => {
  await mkdir(OUT, { recursive: true });
  await page.goto('/');
  await settle(page);
  await page.screenshot({ path: `${OUT}/new-${info.project.name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/new-${info.project.name}-fold.png` });
});

test('header block is identical to the live page (above the moved helper line)', async ({
  page,
  browser,
}, info) => {
  const live = await browser.newPage({
    viewport: page.viewportSize()!,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  try {
    await live.goto(LIVE, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    test.skip(true, 'live page not reachable');
  }
  await page.goto('/');
  await Promise.all([settle(page), settle(live)]);
  // Compare from the top of the page to the bottom of the intro paragraph, minus the floating button column
  const bottom = await page
    .locator('.hero__intro')
    .evaluate((el) => Math.floor(el.getBoundingClientRect().bottom));
  const width = page.viewportSize()!.width - 90;
  const [a, b] = await Promise.all([live.screenshot(), page.screenshot()]);
  await mkdir(OUT, { recursive: true });
  await sharp(a).toFile(`${OUT}/live-${info.project.name}-fold.png`);
  const ratio = await diffRatio(a, b, width, bottom);
  console.log(`${info.project.name}: ${(ratio * 100).toFixed(3)}% of header pixels differ`);
  expect(ratio).toBeLessThan(0.002);
  await live.close();
});
