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

/** Share of pixels whose max channel difference exceeds `tol`, ignoring rows in `skip` ([top, bottom) pairs). */
async function diffRatio(
  a: Buffer,
  b: Buffer,
  w: number,
  h: number,
  skip: [number, number][] = [],
  tol = 24,
) {
  const crop = (img: Buffer) =>
    sharp(img).extract({ left: 0, top: 0, width: w, height: h }).raw().ensureAlpha().toBuffer();
  const [x, y] = await Promise.all([crop(a), crop(b)]);
  let n = 0;
  let counted = 0;
  for (let row = 0; row < h; row++) {
    if (skip.some(([t, btm]) => row >= t && row < btm)) continue;
    for (let col = 0; col < w; col++) {
      const i = (row * w + col) * 4;
      const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
      if (d > tol) n++;
      counted++;
    }
  }
  return n / counted;
}

test.use({ reducedMotion: 'reduce' });

test('full-page screenshots for review', async ({ page }, info) => {
  await mkdir(OUT, { recursive: true });
  await page.goto('/');
  await settle(page);
  await page.screenshot({ path: `${OUT}/new-${info.project.name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/new-${info.project.name}-fold.png` });
});

test('header text block is identical to the live page (below the image, above the moved helper line)', async ({
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
  // The name (Edu Soares → Eliane Emoto) and the pill wording (corretor → corretora) differ from
  // the live page on purpose; skip those lines
  const rows = (sel: string) =>
    page.locator(sel).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [Math.floor(r.top) - 2, Math.ceil(r.bottom) + 2] as [number, number];
    });
  const name = await rows('.hero__name');
  const pill = await rows('.coelho-pill');
  // The top image is switchable (HERO in src/lib/site.ts) and no longer Edu's portrait; skip it too
  const figureBottom = await page
    .locator('.hero__figure')
    .evaluate((el) => Math.ceil(el.getBoundingClientRect().bottom));
  const ratio = await diffRatio(a, b, width, bottom, [[0, figureBottom], name, pill]);
  console.log(`${info.project.name}: ${(ratio * 100).toFixed(3)}% of header pixels differ`);
  expect(ratio).toBeLessThan(0.002);
  await live.close();
});
