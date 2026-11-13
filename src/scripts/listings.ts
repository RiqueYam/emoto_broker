/**
 * Filters (type, bairro, quartos, vagas, área) + Ver mais (spec §4). Plain TypeScript: the CLAUDE.md fallback for Alpine,
 * chosen to keep mobile main-thread time inside the Lighthouse budget.
 */
import { track } from './track';
import { AREA_RANGES, EMPTY_FILTERS, MIN_OPTIONS, matches, type FilterState } from '../lib/filters';

const MOBILE = '(max-width: 767px)';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.getElementById('listings');
const grid = document.getElementById('listing-grid');
const moreBox = document.getElementById('listings-more');

if (root && grid && moreBox) {
  const counter = moreBox.querySelector<HTMLElement>('.more__count')!;
  const button = moreBox.querySelector<HTMLButtonElement>('.more__btn')!;
  const cols = Array.from(grid.querySelectorAll<HTMLElement>('.card-col')).map((el) => ({
    el,
    tipo: el.dataset.tipo!,
    bairro: el.dataset.bairro!,
    quartos: Number(el.dataset.quartos),
    vagas: Number(el.dataset.vagas),
    area: Number(el.dataset.area),
  }));

  // --- Filter controls
  const box = document.getElementById('filters')!;
  const bar = document.getElementById('filters-bar')!;
  const form = document.getElementById('filters-form') as HTMLFormElement;
  const tipoInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="tipo"]'));
  const tabSlugs = new Set(tipoInputs.map((i) => i.value));
  const details = Array.from(form.querySelectorAll<HTMLDetailsElement>('details.filter'));
  const clearButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.filters__clear'));
  const empty = document.getElementById('filters-empty')!;
  const openBtn = box.querySelector<HTMLButtonElement>('.filters__open')!;
  const badge = box.querySelector<HTMLElement>('.filters__badge')!;
  const sheet = document.getElementById('filters-sheet') as HTMLDialogElement;
  const sheetBody = sheet.querySelector<HTMLElement>('.filters-sheet__body')!;
  const applyBtn = sheet.querySelector<HTMLButtonElement>('.filters-sheet__apply')!;

  const mobile = window.matchMedia(MOBILE);
  const pageSize = mobile.matches ? 6 : 9;

  // --- State, restored from a shared link: ?tipo=…&bairro=a,b&quartos=3&vagas=4&area=250-500&mostrar=…
  const params = new URLSearchParams(location.search);
  const tipoParam = params.get('tipo');
  const mostrar = Number(params.get('mostrar'));
  let tab = tipoParam && tabSlugs.has(tipoParam) ? tipoParam : 'todos';
  let shown = Number.isInteger(mostrar) && mostrar > pageSize ? mostrar : pageSize;

  const validBairros = new Set(cols.map((c) => c.bairro));
  const minParam = (k: string) => {
    const n = Number(params.get(k));
    return (MIN_OPTIONS as readonly number[]).includes(n) ? n : 0;
  };
  const areaParam = params.get('area') ?? '';
  let filters: FilterState = {
    bairro: (params.get('bairro') ?? '').split(',').filter((b) => validBairros.has(b)),
    quartos: minParam('quartos'),
    vagas: minParam('vagas'),
    area: AREA_RANGES.some((r) => r.value === areaParam) ? areaParam : '',
  };

  /** Push the state into the form controls (after restoring from the URL or clearing). */
  function writeForm() {
    for (const input of form.querySelectorAll<HTMLInputElement>('input')) {
      const v = input.value;
      if (input.name === 'tipo') input.checked = tab === v;
      else if (input.name === 'bairro') input.checked = filters.bairro.includes(v);
      else if (input.name === 'area') input.checked = filters.area === v;
      else input.checked = String(filters[input.name as 'quartos' | 'vagas'] || '') === v;
    }
  }

  function readForm(): FilterState {
    const data = new FormData(form);
    return {
      bairro: data.getAll('bairro') as string[],
      quartos: Number(data.get('quartos')) || 0,
      vagas: Number(data.get('vagas')) || 0,
      area: String(data.get('area') ?? ''),
    };
  }

  const activeCount = () =>
    (tab !== 'todos' ? 1 : 0) +
    (filters.bairro.length ? 1 : 0) +
    (filters.quartos ? 1 : 0) +
    (filters.vagas ? 1 : 0) +
    (filters.area ? 1 : 0);

  let matching = cols;
  const recompute = () => {
    matching = cols.filter((c) => matches(c, filters));
  };
  const inTab = () => matching.filter((c) => tab === 'todos' || c.tipo === tab);
  const total = () => inTab().length;
  const shownCount = () => Math.min(shown, total());

  /** Text shown inside a closed dropdown, e.g. "Cobertura", "3+", "Itaim Bibi" or "2 bairros". */
  function summaryValue(name: string): string {
    const checked = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`),
    ).filter((i) => i.value !== '' && i.value !== 'todos');
    if (!checked.length) return '';
    if (checked.length === 1) return checked[0].dataset.label!;
    return `${checked.length} bairros`;
  }

  function render() {
    const list = inTab();
    const visible = new Set(list.slice(0, shown).map((c) => c.el));
    for (const c of cols) c.el.hidden = !visible.has(c.el);

    // Type counts follow the other filters
    for (const i of tipoInputs) {
      const n = i.value === 'todos' ? matching.length : matching.filter((c) => c.tipo === i.value).length;
      i.nextElementSibling!.querySelector('.filter__n')!.textContent = `(${n})`;
    }

    const n = total();
    counter.textContent = `Mostrando ${shownCount()} de ${n}`;
    counter.hidden = n === 0;
    button.hidden = shown >= n;
    empty.hidden = n !== 0;

    const active = activeCount();
    badge.textContent = active ? ` (${active})` : '';
    openBtn.classList.toggle('is-active', active > 0);
    for (const b of clearButtons) if (b.closest('#filters-form')) b.hidden = active === 0;
    for (const d of details) {
      const value = summaryValue(d.dataset.filter!);
      d.querySelector('.filter__value')!.textContent = value;
      d.classList.toggle('is-active', value !== '');
    }
    applyBtn.textContent = n === 1 ? 'Ver 1 imóvel' : `Ver ${n} imóveis`;
  }

  function syncUrl() {
    const url = new URL(location.href);
    for (const k of ['tipo', 'bairro', 'quartos', 'vagas', 'area', 'mostrar']) url.searchParams.delete(k);
    if (tab !== 'todos') url.searchParams.set('tipo', tab);
    if (filters.bairro.length) url.searchParams.set('bairro', filters.bairro.join(','));
    if (filters.quartos) url.searchParams.set('quartos', String(filters.quartos));
    if (filters.vagas) url.searchParams.set('vagas', String(filters.vagas));
    if (filters.area) url.searchParams.set('area', filters.area);
    if (shown > pageSize) url.searchParams.set('mostrar', String(shownCount()));
    history.replaceState(history.state, '', url);
  }

  // Any filter change applies at once (behind the sheet on mobile) and resets the batch
  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'tipo') tab = input.value;
    else filters = readForm();
    shown = pageSize;
    recompute();
    render();
    syncUrl();
    if (input.name === 'tipo') track('tab_change', { tab });
    else
      track('filter_change', { filter: input.name, value: String(filters[input.name as keyof FilterState]) });
  });

  for (const b of clearButtons) {
    b.addEventListener('click', () => {
      tab = 'todos';
      filters = { ...EMPTY_FILTERS, bairro: [] };
      shown = pageSize;
      writeForm();
      recompute();
      render();
      syncUrl();
      track('filter_clear');
    });
  }

  // --- Desktop dropdowns: one open at a time, close on outside click or Escape
  for (const d of details) {
    d.addEventListener('toggle', () => {
      if (d.open && !mobile.matches) for (const o of details) if (o !== d) o.open = false;
    });
  }
  document.addEventListener('click', (e) => {
    if (mobile.matches) return;
    for (const d of details) if (d.open && !d.contains(e.target as Node)) d.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || mobile.matches) return;
    const open = details.find((d) => d.open);
    if (open) {
      open.open = false;
      open.querySelector('summary')!.focus();
    }
  });

  // --- Mobile sheet. The form lives in the sheet on phones and in the bar on desktop; it moves
  // only when the screen crosses the breakpoint, so opening and closing the sheet stay cheap.
  function placeForm() {
    const inSheet = mobile.matches;
    if (inSheet && sheet.open) return;
    (inSheet ? sheetBody : bar).append(form);
    for (const d of details) d.open = inSheet;
  }
  openBtn.addEventListener('click', () => {
    sheet.showModal();
    document.documentElement.classList.add('filters-sheet-open');
  });
  sheet.addEventListener('close', () => {
    document.documentElement.classList.remove('filters-sheet-open');
    openBtn.focus();
  });
  sheet.querySelector('.filters-sheet__close')!.addEventListener('click', () => sheet.close());
  applyBtn.addEventListener('click', () => {
    sheet.close();
    document
      .getElementById('lista-imoveis')!
      .scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  });
  // A tap on the backdrop closes the sheet
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });
  mobile.addEventListener('change', () => {
    if (!mobile.matches && sheet.open) sheet.close();
    placeForm();
  });

  button.addEventListener('click', () => {
    const firstNew = shownCount();
    shown = Math.min(shown + pageSize, total());
    render();
    syncUrl();
    track('load_more', { tab, shown: shownCount() });

    const fresh = inTab()
      .slice(firstNew, shownCount())
      .map((c) => c.el);
    if (!reduceMotion()) {
      for (const c of fresh) {
        c.classList.add('is-new');
        c.addEventListener('animationend', () => c.classList.remove('is-new'), { once: true });
      }
    }
    // Focus the first new card's link without jumping past it
    const link = fresh[0]?.querySelector<HTMLElement>('.card-link');
    if (link) {
      link.focus({ preventScroll: true });
      link.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  });

  placeForm();
  writeForm();
  recompute();
  render();
  moreBox.hidden = false;
  box.hidden = false;
  // Hand visibility over from the pre-hide CSS
  document.documentElement.classList.add('listings-ready');
}
