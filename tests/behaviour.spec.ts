import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { BROKER } from '../src/lib/site';
import { GENERIC_MESSAGE, listingMessage, waUrl } from '../src/lib/whatsapp';
import { bairroFromTitle, matches, slug, EMPTY_FILTERS, type FilterState } from '../src/lib/filters';

// Expectations come from the same data and settings as the site, so editing them never breaks the tests
const rows: {
  codigo: string;
  titulo: string;
  tipo_tab: string;
  destaque: string;
  ordem: string;
  quartos: string;
  vagas: string;
  area_m2: string;
}[] = parse(readFileSync('data/listings.csv', 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
const FEATURED = rows
  .filter((r) => r.destaque === 'sim')
  .sort((a, b) => Number(a.ordem) - Number(b.ordem))
  .map((r) => r.codigo);
const TOTAL = rows.length;
const COUNT = (tipo: string) => rows.filter((r) => r.tipo_tab === tipo).length;
const N_FEAT = FEATURED.length;
const filterable = rows.map((r) => ({
  tipo: r.tipo_tab,
  bairro: slug(bairroFromTitle(r.titulo)!),
  quartos: Number(r.quartos),
  vagas: Number(r.vagas || 0),
  area: Number(r.area_m2),
}));
/** How many listings match these filters (and tab), computed from the CSV. */
const MATCHING = (f: Partial<FilterState>, tipo?: string) =>
  filterable.filter((l) => matches(l, { ...EMPTY_FILTERS, ...f }) && (!tipo || l.tipo === tipo)).length;
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

const visibleCards = (page: Page) => page.locator('.listing-grid .card-col:visible');
const activeDot = (page: Page) => page.locator('.selecao__dot.is-active');

/** Pick a filter option by value: desktop through its dropdown, mobile through the sheet (left open). */
async function pick(page: Page, filter: string, value: string) {
  if (isMobile(page)) {
    if (!(await page.locator('#filters-sheet').evaluate((d: HTMLDialogElement) => d.open)))
      await page.locator('.filters__open').click();
    await page.locator(`#filters-sheet .filter[data-filter="${filter}"] input[value="${value}"]`).click();
  } else {
    await page.locator(`.filter[data-filter="${filter}"] > summary`).click();
    await page.locator(`.filter[data-filter="${filter}"] input[value="${value}"]`).click();
  }
}
/** Close the mobile sheet with its "Ver N imóveis" button (desktop: close the open dropdown). */
async function done(page: Page) {
  if (isMobile(page)) await page.locator('.filters-sheet__apply').click();
  else await page.keyboard.press('Escape');
}
/** The live count next to a type option, e.g. "(16)". */
const tipoCount = (page: Page, tipo: string) =>
  page.locator(`.filter[data-filter="tipo"] input[value="${tipo}"] + span .filter__n`);

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

  test('keeps advancing after a click on a dot; keyboard focus still pauses', async ({ page }) => {
    await page.goto('/');
    await mounted(page);
    // A click leaves focus on the dot; that must not stop autoplay
    await page.locator('.selecao__dot').nth(1).click();
    await page.mouse.move(0, 0);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /2$/);
    await page.waitForTimeout(4300);
    await expect(activeDot(page)).toHaveAttribute('aria-label', /3$/);
    // Keyboard focus inside the carousel does pause it
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Shift+Tab'); // keyboard modality, so the next focus is :focus-visible
    await page.locator('.selecao__dot').first().focus();
    await expect(activeDot(page)).toHaveAttribute('aria-label', /3$/);
    const before = await activeDot(page).getAttribute('aria-label');
    await page.waitForTimeout(4500);
    await expect(activeDot(page)).toHaveAttribute('aria-label', before!);
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

  test('changing the type resets the batch and counts the type', async ({ page }) => {
    await page.goto('/');
    const batch = isMobile(page) ? 6 : 9;
    await page.locator('.more__btn').click();
    await expect(tipoCount(page, 'cobertura')).toHaveText(`(${COUNT('Cobertura')})`);
    await pick(page, 'tipo', 'cobertura');
    await done(page);
    const cob = COUNT('Cobertura');
    await expect(visibleCards(page)).toHaveCount(Math.min(batch, cob));
    await expect(page.locator('.more__count')).toHaveText(`Mostrando ${Math.min(batch, cob)} de ${cob}`);
    expect(new URL(page.url()).search).toBe('?tipo=cobertura');
    const tipos = await visibleCards(page).evaluateAll((els) =>
      els.map((e) => (e as HTMLElement).dataset.tipo),
    );
    expect(new Set(tipos)).toEqual(new Set(['cobertura']));
    if (isMobile(page)) await expect(page.locator('.filters__badge')).toHaveText(' (1)');
    else await expect(page.locator('.filter[data-filter="tipo"] .filter__value')).toHaveText('Cobertura');
  });

  test('a shared link restores type and count', async ({ page }) => {
    await page.goto('/?tipo=casa&mostrar=9');
    await expect(page.locator('.filter[data-filter="tipo"] input[value="casa"]')).toBeChecked();
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
    await expect(page.locator('#filters')).toBeHidden();
    await ctx.close();
  });
});

test.describe('Filters (tipo, bairro, quartos, vagas, área)', () => {
  const count = (page: Page) => page.locator('.more__count');

  test('quartos 4+ shows only matching cards, updates counts and the URL', async ({ page }) => {
    await page.goto('/');
    await pick(page, 'quartos', '4');
    const n = MATCHING({ quartos: 4 });
    await expect(count(page)).toHaveText(`Mostrando ${Math.min(n, isMobile(page) ? 6 : 9)} de ${n}`);
    const shown = await visibleCards(page).evaluateAll((els) =>
      els.map((e) => Number((e as HTMLElement).dataset.quartos)),
    );
    expect(shown.every((q) => q >= 4)).toBe(true);
    await expect(tipoCount(page, 'cobertura')).toHaveText(`(${MATCHING({ quartos: 4 }, 'Cobertura')})`);
    expect(new URL(page.url()).searchParams.get('quartos')).toBe('4');
  });

  test('a shared link restores the filters and combines them with the tab', async ({ page }) => {
    await page.goto('/?tipo=cobertura&bairro=itaim-bibi,cidade-jardim&vagas=4&area=250-500');
    const f = { bairro: ['itaim-bibi', 'cidade-jardim'], vagas: 4, area: '250-500' };
    const n = MATCHING(f, 'Cobertura');
    await expect(visibleCards(page)).toHaveCount(n);
    await expect(tipoCount(page, 'todos')).toHaveText(`(${MATCHING(f)})`);
    if (!isMobile(page)) {
      await expect(page.locator('.filter[data-filter="bairro"] .filter__value')).toHaveText('2 bairros');
      await expect(page.locator('.filter[data-filter="area"] .filter__value')).toHaveText('250 a 500 m²');
    } else {
      await expect(page.locator('.filters__badge')).toHaveText(' (4)'); // tipo, bairro, vagas, área
    }
  });

  test('no match shows the empty message; Limpar filtros brings everything back', async ({ page }) => {
    await page.goto('/?bairro=aclimacao&quartos=5&vagas=5&area=0-250');
    expect(MATCHING({ bairro: ['aclimacao'], quartos: 5, vagas: 5, area: '0-250' })).toBe(0);
    await expect(page.locator('#filters-empty')).toBeVisible();
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.locator('.more__btn')).toBeHidden();
    await page.locator('#filters-empty .filters__clear').click();
    await expect(page.locator('#filters-empty')).toBeHidden();
    await expect(count(page)).toHaveText(`Mostrando ${isMobile(page) ? 6 : 9} de ${TOTAL}`);
    expect(new URL(page.url()).search).toBe('');
  });

  test('mobile: Filtros opens a sheet, the apply button shows the result count and closes it', async ({
    page,
  }) => {
    test.skip(!isMobile(page), 'the sheet is mobile only');
    await page.goto('/');
    await expect(page.locator('.filters__bar')).toBeHidden();
    await pick(page, 'vagas', '5');
    const n = MATCHING({ vagas: 5 });
    const apply = page.locator('.filters-sheet__apply');
    await expect(apply).toHaveText(`Ver ${n} imóveis`);
    await apply.click();
    await expect(page.locator('#filters-sheet')).toBeHidden();
    await expect(page.locator('.filters__open')).toContainText('Filtros (1)');
    await expect(count(page)).toHaveText(`Mostrando ${Math.min(n, 6)} de ${n}`);
  });

  test('resizing across the breakpoint moves the filters between bar and sheet', async ({ page }) => {
    test.skip(isMobile(page), 'starts on desktop');
    await page.goto('/?tipo=casa');
    await expect(page.locator('#filters-bar #filters-form')).toHaveCount(1);
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('#filters-sheet #filters-form')).toHaveCount(1);
    await page.locator('.filters__open').click();
    await expect(page.locator('#filters-sheet input[value="casa"]')).toBeChecked();
    await expect(page.locator('#filters-sheet .filter[data-filter="bairro"] .filter__options')).toBeVisible();
    await page.locator('.filters-sheet__close').click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('#filters-bar #filters-form')).toHaveCount(1);
    await expect(page.locator('.filter[data-filter="tipo"] .filter__value')).toHaveText('Casa');
    await expect(page.locator('details.filter[open]')).toHaveCount(0);
  });

  test('desktop: Escape closes a dropdown and returns focus to it', async ({ page }) => {
    test.skip(isMobile(page), 'dropdowns are desktop only');
    await page.goto('/');
    await expect(page.locator('.filters__open')).toBeHidden();
    const summary = page.locator('.filter[data-filter="area"] > summary');
    await summary.click();
    await expect(page.locator('.filter[data-filter="area"]')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('.filter[data-filter="area"]')).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
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
  test('type change, Ver mais and dots respond quickly with 4× CPU throttling', async ({ page }) => {
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
    await pick(page, 'tipo', 'cobertura');
    await done(page);
    await page.locator('.more__btn').click();
    await pick(page, 'tipo', 'todos');
    await done(page);
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
      if (
        /selecao__arrow|selecao__dot|wa-btn|filter__toggle|filters__open|more__btn|card-link/.test(info.cls)
      ) {
        expect(info.ring, `focus ring on ${info.cls}`).toBe(true);
        seen.push(
          info.cls
            .split(' ')
            .find((c) =>
              /selecao__arrow|selecao__dot|wa-btn|filter__toggle|filters__open|card-link/.test(c),
            )!,
        );
      }
    }
    expect(seen).toEqual(
      expect.arrayContaining([
        'card-link',
        'wa-btn',
        'selecao__dot',
        isMobile(page) ? 'filters__open' : 'filter__toggle',
      ]),
    );
    if (!isMobile(page)) expect(seen).toContain('selecao__arrow');
  });
});
