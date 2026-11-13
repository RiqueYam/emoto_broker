/**
 * Type tabs + Ver mais (spec §4). Plain TypeScript: the CLAUDE.md fallback for Alpine,
 * chosen to keep mobile main-thread time inside the Lighthouse budget.
 */
import { track } from './track';

const MOBILE = '(max-width: 767px)';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.getElementById('listings');
const grid = document.getElementById('listing-grid');
const moreBox = document.getElementById('listings-more');

if (root && grid && moreBox) {
  const counts: Record<string, number> = JSON.parse(root.dataset.counts ?? '{}');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.type-tab'));
  const counter = moreBox.querySelector<HTMLElement>('.more__count')!;
  const button = moreBox.querySelector<HTMLButtonElement>('.more__btn')!;
  const cols = Array.from(grid.querySelectorAll<HTMLElement>('.card-col')).map((el) => ({
    el,
    tipo: el.dataset.tipo!,
    i: Number(el.dataset.i),
    ti: Number(el.dataset.ti),
  }));

  const pageSize = window.matchMedia(MOBILE).matches ? 6 : 9;

  // Restore ?tipo=…&mostrar=… from a shared link
  const params = new URLSearchParams(location.search);
  const tipoParam = params.get('tipo');
  const mostrar = Number(params.get('mostrar'));
  let tab = tipoParam && tipoParam in counts ? tipoParam : 'todos';
  let shown = Number.isInteger(mostrar) && mostrar > pageSize ? mostrar : pageSize;

  const total = () => counts[tab] ?? 0;
  const shownCount = () => Math.min(shown, total());
  const inTab = () => cols.filter((c) => tab === 'todos' || c.tipo === tab);

  function render() {
    const visible = new Set(
      inTab()
        .slice(0, shown)
        .map((c) => c.el),
    );
    for (const c of cols) c.el.hidden = !visible.has(c.el);
    for (const t of tabs) t.setAttribute('aria-pressed', String(t.dataset.tab === tab));
    counter.textContent = `Mostrando ${shownCount()} de ${total()}`;
    button.hidden = shown >= total();
  }

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('tipo');
    url.searchParams.delete('mostrar');
    if (tab !== 'todos') url.searchParams.set('tipo', tab);
    if (shown > pageSize) url.searchParams.set('mostrar', String(shownCount()));
    history.replaceState(history.state, '', url);
  }

  for (const t of tabs) {
    t.addEventListener('click', () => {
      const next = t.dataset.tab!;
      if (next === tab) return;
      tab = next;
      shown = pageSize; // changing tab resets the batch
      render();
      syncUrl();
      track('tab_change', { tab });
    });
  }

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

  render();
  moreBox.hidden = false;
  // Hand visibility over from the pre-hide CSS
  document.documentElement.classList.add('listings-ready');
}
