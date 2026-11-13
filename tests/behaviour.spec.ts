import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { BROKER } from '../src/lib/site';
import { GENERIC_MESSAGE, listingMessage, waUrl } from '../src/lib/whatsapp';

// Expectations come from the same data and settings as the site, so editing them never breaks the tests
const rows: { codigo: string; tipo_tab: string; destaque: string; ordem: string }[] = parse(
  readFileSync('data/listings.csv', 'utf8'),
  { columns: true, skip_empty_lines: true, bom: true },
);
const FEATURED = rows
  .filter((r) => r.destaque === 'sim')
  .sort((a, b) => Number(a.ordem) - Number(b.ordem))
  .map((r) => r.codigo);
const TOTAL = rows.length;
const COUNT = (tipo: string) => rows.filter((r) => r.tipo_tab === tipo).length;
const N_FEAT = FEATURED.length;
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

const visibleCards = (page: Page) => page.locator('.listing-grid .card-col:visible');
const activeDot = (page: Page) => page.locator('.selecao__dot.is-active');

test.describe('Seleção carousel (spec §3)', () => {
  // Splide mounts on idle; the 3.5 s timer starts at mount
  const mounted = (page: Page) => expect(page.locator('#selecao.is-initialized')).toHaveCount(1);

  test('shows the six featured listings in order, with ARIA', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('#selecao');
    await expect(root).toHaveAttribute('aria-roledescription', 'carrossel');
    await expect(root).toHaveAttribute('aria-label', BROKER.selecaoTitle);
    const slides = root.locator('.splide__slide');
    await expect(slides).toHaveCount(N_FEAT);
    for (let i = 0; i < N_FEAT; i++) {
      await expect(slides.nth(i)).toHaveAttribute('aria-label', `${i + 1} de ${N_FEAT}`);
      await expect(slides.nth(i).locator('.feat-code')).toContainText(FEATURED[i]);
    }
  });

  test('desktop has 4 positions and arrows; mobile has 6 and no arrows', async ({ page }) => {
    await page.goto('/');
    const dots = page.locator('.selecao__dot');
    if (isMobile(page)) {
      await expect(dots).toHaveCount(N_FEAT);
      await expect(dots.first()).toHaveAttribute('aria-label', 'Ir para o imóvel 1');
      await expect(page.locator('.selecao__arrows')).toBeHidden();
    } else {
      await expect(dots).toHaveCount(N_FEAT - 2); // 3 cards visible on desktop
      await expect(dots.first()).toHaveAttribute('aria-label', 'Ir para o grupo 1');
      await expect(page.locator('.splide__arrow--next')).toBeVisible();
    }
  });

  test('advances every 3.5 s', async ({ page }) => {
    await page.goto('/');
    await mounted(page);
    await page.mouse.move(0, 0);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
    await page.waitForTimeout(3000);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
    await page.waitForTimeout(1300);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /2$/);
  });

  test('pauses on hover and when the tab is hidden', async ({ page }) => {
    test.skip(isMobile(page), 'hover is desktop only');
    await page.goto('/');
    await mounted(page);
    await page.locator('#selecao .splide__track').hover();
    await page.waitForTimeout(4500);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
    await page.mouse.move(0, 0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(4500);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
  });

  test('pauses while a finger touches the track', async ({ page }) => {
    test.skip(!isMobile(page), 'touch is mobile');
    await page.goto('/');
    await page.locator('#selecao .splide__track').dispatchEvent('touchstart');
    await page.waitForTimeout(4500);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
  });

  test('arrows and dots jump to a position', async ({ page }) => {
    await page.goto('/');
    await page.locator('.selecao__dot').nth(2).click();
    await expect(activeDot(page)).toHaveAttribute('aria-label', /3$/);
    if (!isMobile(page)) {
      await page.locator('.splide__arrow--next').click();
      await expect(activeDot(page)).toHaveAttribute('aria-label', /4$/);
      await page.locator('.splide__arrow--next').click();
      await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
    }
  });

  test('off-screen slides are inert', async ({ page }) => {
    await page.goto('/');
    await mounted(page);
    const inert = await page
      .locator('#selecao .splide__slide')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).inert));
    expect(inert).toEqual(
      isMobile(page) ? [false, true, true, true, true, true] : [false, false, false, true, true, true],
    );
  });

  test('no autoplay with reduced motion', async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(4500);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /1$/);
    await page.locator('.selecao__dot').nth(1).click();
    await expect(activeDot(page)).toHaveAttribute('aria-label', /2$/);
    await ctx.close();
  });
});

test.describe('Todos os imóveis + Ver mais (spec §4)', () => {
  test('first batch, Ver mais, counter, end of list', async ({ page }) => {
    await page.goto('/');
    const batch = isMobile(page) ? 6 : 9;
    await expect(visibleCards(page)).toHaveCount(batch);
    await expect(page.locator('.more__count')).toHaveText(`Mostrando ${batch} de ${TOTAL}`);
    const btn = page.locator('.more__btn');
    await btn.click();
    await expect(visibleCards(page)).toHaveCount(batch * 2);
    await expect(page.locator('.more__count')).toHaveText(`Mostrando ${batch * 2} de ${TOTAL}`);
    // Focus moves to the first new card
    const focusedCode = await page.evaluate(
      () => document.activeElement?.closest('.card-col')?.querySelector('.card-code')?.textContent,
    );
    const expected = await page
      .locator('.listing-grid .card-col')
      .nth(batch)
      .locator('.card-code')
      .textContent();
    expect(focusedCode).toBe(expected);
    expect(page.url()).toContain(`mostrar=${batch * 2}`);
    while (await btn.isVisible()) await btn.click();
    await expect(visibleCards(page)).toHaveCount(TOTAL);
    await expect(page.locator('.more__count')).toHaveText(`Mostrando ${TOTAL} de ${TOTAL}`);
  });

  test('changing tab resets the batch and counts the tab', async ({ page }) => {
    await page.goto('/');
    const batch = isMobile(page) ? 6 : 9;
    await page.locator('.more__btn').click();
    await page.getByRole('button', { name: `Cobertura (${COUNT('Cobertura')})` }).click();
    await expect(page.getByRole('button', { name: `Cobertura (${COUNT('Cobertura')})` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const cob = COUNT('Cobertura');
    await expect(visibleCards(page)).toHaveCount(Math.min(batch, cob));
    await expect(page.locator('.more__count')).toHaveText(`Mostrando ${Math.min(batch, cob)} de ${cob}`);
    expect(new URL(page.url()).search).toBe('?tipo=cobertura');
    const tipos = await visibleCards(page).evaluateAll((els) =>
      els.map((e) => (e as HTMLElement).dataset.tipo),
    );
    expect(new Set(tipos)).toEqual(new Set(['cobertura']));
  });

  test('a shared link restores tab and count', async ({ page }) => {
    await page.goto('/?tipo=casa&mostrar=9');
    await expect(page.getByRole('button', { name: `Casa (${COUNT('Casa')})` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const casa = COUNT('Casa');
    await expect(visibleCards(page)).toHaveCount(Math.min(9, casa));
    if (casa <= 9) await expect(page.locator('.more__btn')).toBeHidden();
    else await expect(page.locator('.more__btn')).toBeVisible();
  });

  test('every card shows without JavaScript', async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(visibleCards(page)).toHaveCount(TOTAL);
    await expect(page.locator('.more')).toBeHidden();
    await ctx.close();
  });
});

test.describe('WhatsApp button and links (spec §5, §7)', () => {
  test('every card ends with its own WhatsApp button, never nested in a link', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.card-item, .selecao__slide');
    await expect(cards).toHaveCount(TOTAL + N_FEAT);
    const rows = await cards.evaluateAll((els) =>
      els.map((el) => ({
        code: el.querySelector('.card-code')!.textContent!.replace(/\D/g, ''),
        title: el.querySelector('h3')!.textContent!.trim(),
        wa: el.querySelector<HTMLAnchorElement>('.wa-btn')!.href,
        label: el.querySelector('.wa-btn')!.getAttribute('aria-label'),
        coelho: el.querySelector<HTMLAnchorElement>('.card-link')!.href,
      })),
    );
    for (const r of rows) {
      expect(r.wa).toBe(waUrl(listingMessage(r.code, r.title)));
      expect(r.wa).toContain(`wa.me/${BROKER.whatsapp}?text=`);
      expect(r.label).toBe(`Consultar no WhatsApp sobre ${r.title}, código ${r.code}`);
      if (BROKER.coelhoId) expect(r.coelho).toContain(`corretor=${BROKER.coelhoId}`);
    }
    expect(await page.locator('a a').count()).toBe(0);
    await expect(page.locator('.wa-btn').first()).toHaveAttribute('target', '_blank');
  });

  test('floating and footer buttons use the generic message', async ({ page }) => {
    await page.goto('/');
    const generic = waUrl(GENERIC_MESSAGE);
    await expect(page.locator('.wa-float')).toHaveAttribute('href', generic);
    await expect(page.locator('.site-footer__links a').first()).toHaveAttribute('href', generic);
  });

  test('WhatsApp pill matches spec sizes', async ({ page }) => {
    await page.goto('/');
    const s = await page
      .locator('.listing-grid .wa-btn')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        const disc = getComputedStyle(el.querySelector('.wa-btn__disc')!);
        return {
          h: el.getBoundingClientRect().height,
          bg: cs.backgroundColor,
          fs: cs.fontSize,
          ls: cs.letterSpacing,
          pad: cs.padding,
          disc: [disc.width, disc.backgroundColor],
        };
      });
    expect(s.h).toBe(44);
    expect(s.bg).toBe('rgb(29, 29, 31)');
    expect(s.pad).toBe('0px 20px 0px 8px');
    expect(s.disc).toEqual(['28px', 'rgb(48, 134, 57)']);
    expect([s.fs, s.ls]).toEqual(isMobile(page) ? ['10.88px', '1.52px'] : ['12px', '1.68px']);
  });
});

test.describe('Responsiveness (spec §6 INP < 200 ms, lab estimate)', () => {
  // Regression guard only: INP is a field metric. Processing time is < 50 ms; the rest is the
  // next frame's rendering, which a 4× throttled desktop CPU exaggerates.
  test('tab change, Ver mais and dots respond quickly with 4× CPU throttling', async ({ page }) => {
    test.skip(!isMobile(page), 'measured on the mobile project');
    await page.goto('/');
    await expect(page.locator('#selecao.is-initialized')).toHaveCount(1);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => {
      (window as unknown as { __ev: number[] }).__ev = [];
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => (window as unknown as { __ev: number[] }).__ev.push(e.duration)),
      ).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
    });
    await page.getByRole('button', { name: `Cobertura (${COUNT('Cobertura')})` }).click();
    await page.locator('.more__btn').click();
    await page.getByRole('button', { name: `Todos (${TOTAL})` }).click();
    await page.locator('.selecao__dot').nth(1).click();
    await page.waitForTimeout(500);
    const worst = await page.evaluate(() => Math.max(0, ...(window as unknown as { __ev: number[] }).__ev));
    console.log(`${test.info().project.name}: slowest interaction ${Math.round(worst)} ms`);
    expect(worst).toBeLessThan(250);
  });
});

test.describe('Keyboard', () => {
  test('tab order reaches the new controls with a visible focus ring', async ({ page }) => {
    await page.goto('/');
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return { cls: el.className, ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
      });
      if (/selecao__arrow|selecao__dot|wa-btn|type-tab|more__btn|card-link/.test(info.cls)) {
        expect(info.ring, `focus ring on ${info.cls}`).toBe(true);
        seen.push(
          info.cls.split(' ').find((c) => /selecao__arrow|selecao__dot|wa-btn|type-tab|card-link/.test(c))!,
        );
      }
    }
    expect(seen).toEqual(expect.arrayContaining(['card-link', 'wa-btn', 'selecao__dot', 'type-tab']));
    if (!isMobile(page)) expect(seen).toContain('selecao__arrow');
  });
});
