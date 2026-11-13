import Alpine from 'alpinejs';
import { track } from './track';

const MOBILE = '(max-width: 767px)';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.getElementById('listings');
const grid = document.getElementById('listing-grid');

if (root && grid) {
  const counts: Record<string, number> = JSON.parse(root.dataset.counts ?? '{}');
  const cols = Array.from(grid.querySelectorAll<HTMLElement>('.card-col')).map((el) => ({
    el,
    tipo: el.dataset.tipo!,
    i: Number(el.dataset.i),
    ti: Number(el.dataset.ti),
  }));

  const pageSize = window.matchMedia(MOBILE).matches ? 6 : 9;
  const params = new URLSearchParams(location.search);
  const tipoParam = params.get('tipo');
  const mostrar = Number(params.get('mostrar'));

  const store = {
    tab: tipoParam && tipoParam in counts ? tipoParam : 'todos',
    shown: Number.isInteger(mostrar) && mostrar > pageSize ? mostrar : pageSize,
    pageSize,

    get total(): number {
      return counts[this.tab] ?? 0;
    },
    get shownCount(): number {
      return Math.min(this.shown, this.total);
    },
    get hasMore(): boolean {
      return this.shown < this.total;
    },
    get label(): string {
      return `Mostrando ${this.shownCount} de ${this.total}`;
    },

    visibleCols() {
      return cols.filter((c) =>
        this.tab === 'todos' ? c.i < this.shown : c.tipo === this.tab && c.ti < this.shown,
      );
    },

    select(tipo: string) {
      if (tipo === this.tab) return;
      this.tab = tipo;
      this.shown = this.pageSize;
      syncUrl();
      track('tab_change', { tab: tipo });
    },

    more() {
      const firstNew = this.shownCount;
      this.shown = Math.min(this.shown + this.pageSize, this.total);
      syncUrl();
      track('load_more', { tab: this.tab, shown: this.shownCount });

      Alpine.nextTick(() => {
        const fresh = this.visibleCols()
          .slice(firstNew)
          .map((c) => c.el);
        if (!reduceMotion()) {
          fresh.forEach((c) => {
            c.classList.add('is-new');
            c.addEventListener('animationend', () => c.classList.remove('is-new'), { once: true });
          });
        }
        // Focus the first new card's link without jumping past it
        const link = fresh[0]?.querySelector<HTMLElement>('.card-link');
        if (link) {
          link.focus({ preventScroll: true });
          link.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
        }
      });
    },
  };

  Alpine.store('listings', store);
  const s = Alpine.store('listings') as typeof store;

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('tipo');
    url.searchParams.delete('mostrar');
    if (s.tab !== 'todos') url.searchParams.set('tipo', s.tab);
    if (s.shown > s.pageSize) url.searchParams.set('mostrar', String(s.shownCount));
    history.replaceState(history.state, '', url);
  }

  // One effect drives every card's visibility
  Alpine.effect(() => {
    const visible = new Set(s.visibleCols().map((c) => c.el));
    for (const c of cols) c.el.hidden = !visible.has(c.el);
  });

  // Hand visibility over from the pre-hide CSS
  document.documentElement.classList.add('listings-ready');

  window.Alpine = Alpine;
  Alpine.start();
}
