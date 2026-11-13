import Splide from '@splidejs/splide';
import '@splidejs/splide/css/core';
import { track } from './track';

const INTERVAL = 3500;
const root = document.querySelector<HTMLElement>('#selecao');

/*
 * Splide handles the slides, arrows, dots, ARIA, breakpoints and reduced motion.
 * Autoplay is a small timer here instead of Splide's Autoplay component: Splide's
 * version runs a requestAnimationFrame loop every frame while playing, which keeps the
 * page from ever going idle (Lighthouse could not finish a run with it on).
 */
function mount(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const splide = new Splide(root, {
    type: 'slide',
    perMove: 1,
    rewind: true,
    autoplay: false,
    speed: 700,
    easing: 'cubic-bezier(0.22,0.61,0.36,1)',
    fixedWidth: '365px',
    gap: '32px',
    pagination: true,
    arrows: true,
    // One dot per reachable position: desktop 0–3, mobile 0–5 (spec §3)
    focus: 0,
    omitEnd: true,
    label: 'Seleção do Edu',
    classes: {
      pagination: 'splide__pagination selecao__dots',
      page: 'splide__pagination__page selecao__dot',
    },
    i18n: {
      prev: 'Anterior',
      next: 'Próximo',
      first: 'Ir para o primeiro',
      last: 'Ir para o último',
      slideX: 'Ir para o grupo %s',
      pageX: 'Ir para o grupo %s',
      carousel: 'carrossel',
      select: 'Escolha o grupo de imóveis',
      slide: 'imóvel',
      slideLabel: '%s de %s',
    },
    breakpoints: {
      767: {
        fixedWidth: '290px',
        gap: '16px',
        speed: 600,
        arrows: false,
        padding: { right: '20px' },
        i18n: { slideX: 'Ir para o imóvel %s', pageX: 'Ir para o imóvel %s', select: 'Escolha o imóvel' },
      },
    },
  });

  // --- Autoplay: every 3.5 s, paused on hover, touch, focus inside, hidden tab, reduced motion
  const paused = new Set<string>();
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = undefined;
    if (reduce.matches || paused.size) return;
    timer = window.setTimeout(() => splide.go('>'), INTERVAL);
  };
  const pause = (why: string) => {
    paused.add(why);
    schedule();
  };
  const resume = (why: string) => {
    paused.delete(why);
    schedule();
  };

  // Any move (autoplay, arrows, dots, drag) restarts the 3.5 s timer
  splide.on('moved', schedule);

  const trackEl = root.querySelector<HTMLElement>('.splide__track')!;
  trackEl.addEventListener('mouseenter', () => pause('hover'));
  trackEl.addEventListener('mouseleave', () => resume('hover'));
  trackEl.addEventListener('touchstart', () => pause('touch'), { passive: true });
  trackEl.addEventListener('touchend', () => resume('touch'), { passive: true });
  trackEl.addEventListener('touchcancel', () => resume('touch'), { passive: true });
  root.addEventListener('focusin', () => pause('focus'));
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) resume('focus');
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause('hidden') : resume('hidden')));
  reduce.addEventListener('change', schedule);

  // --- Off-screen slides are inert so keyboard focus never lands on a hidden card
  root.querySelectorAll<HTMLElement>('.splide__slide').forEach((s) => (s.inert = true));
  splide.on('visible', ({ slide }) => (slide.inert = false));
  splide.on('hidden', ({ slide }) => (slide.inert = true));

  // --- Analytics: arrow and dot use only
  root.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.splide__arrow, .selecao__dot'))
      requestAnimationFrame(() => track('carousel_nav', { position: splide.index }));
  });

  splide.mount();
  if (document.hidden) paused.add('hidden');
  schedule();
}

if (root) {
  // Mount off the critical path; the slides are already laid out by CSS
  const run = () => mount(root);
  // Safari has no requestIdleCallback
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 1200 });
  else setTimeout(run, 200);
}
