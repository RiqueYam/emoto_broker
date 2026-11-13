import Alpine from 'alpinejs';
import { track } from './track';

const MOBILE = '(max-width: 767px)';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

Alpine.data('listings', () => ({
  tab: 'todos',
  shown: 9,
  pageSize: 9,
  counts: {} as Record<string, number>,

  init() {
    this.counts = JSON.parse((this.$el as HTMLElement).dataset.counts ?? '{}');
    this.pageSize = window.matchMedia(MOBILE).matches ? 6 : 9;

    // Restore ?tipo=…&mostrar=… from a shared link
    const params = new URLSearchParams(location.search);
    const tipo = params.get('tipo');
    if (tipo && tipo in this.counts) this.tab = tipo;
    const mostrar = Number(params.get('mostrar'));
    this.shown = Number.isInteger(mostrar) && mostrar > this.pageSize ? mostrar : this.pageSize;

    // Hand visibility over from the pre-hide CSS to Alpine
    document.documentElement.classList.add('listings-ready');
  },

  get total(): number {
    return this.counts[this.tab] ?? 0;
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

  visible(tipo: string, index: number, tabIndex: number): boolean {
    return this.tab === 'todos' ? index < this.shown : tipo === this.tab && tabIndex < this.shown;
  },

  select(tipo: string) {
    if (tipo === this.tab) return;
    this.tab = tipo;
    this.shown = this.pageSize;
    this.syncUrl();
    track('tab_change', { tab: tipo });
  },

  more() {
    const firstNew = this.shownCount;
    this.shown = Math.min(this.shown + this.pageSize, this.total);
    this.syncUrl();
    track('load_more', { tab: this.tab, shown: this.shownCount });

    this.$nextTick(() => {
      const grid = this.$refs.grid as HTMLElement;
      const selector = this.tab === 'todos' ? '.card-col' : `.card-col[data-tipo="${this.tab}"]`;
      const cols = Array.from(grid.querySelectorAll<HTMLElement>(selector)).slice(firstNew, this.shownCount);
      if (!reduceMotion()) {
        cols.forEach((c) => {
          c.classList.add('is-new');
          c.addEventListener('animationend', () => c.classList.remove('is-new'), { once: true });
        });
      }
      // Focus the first new card's link without jumping past it
      const link = cols[0]?.querySelector<HTMLElement>('.card-link');
      if (link) {
        link.focus({ preventScroll: true });
        link.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
    });
  },

  syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('tipo');
    url.searchParams.delete('mostrar');
    if (this.tab !== 'todos') url.searchParams.set('tipo', this.tab);
    if (this.shown > this.pageSize) url.searchParams.set('mostrar', String(this.shownCount));
    history.replaceState(history.state, '', url);
  },
}));

window.Alpine = Alpine;
Alpine.start();
