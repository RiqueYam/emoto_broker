/**
 * Analytics hook (spec §6). No analytics is installed yet, so events only go to
 * window.dataLayer when one exists (e.g. after a consented tag manager is added).
 */
type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: Params = {}) {
  window.dataLayer?.push({ event, ...params });
}

// Link clicks marked with data-track
document.addEventListener('click', (e) => {
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-track]');
  if (!el) return;
  track(el.dataset.track!, { source: el.dataset.source, codigo: el.dataset.codigo });
});
