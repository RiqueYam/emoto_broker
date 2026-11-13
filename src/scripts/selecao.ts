import Splide from '@splidejs/splide';
import '@splidejs/splide/css/core';
import { track } from './track';

const root = document.querySelector<HTMLElement>('#selecao');

if (root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const splide = new Splide(root, {
    type: 'slide',
    perMove: 1,
    rewind: true,
    autoplay: true,
    interval: 3500,
    speed: 700,
    easing: 'cubic-bezier(0.22,0.61,0.36,1)',
    fixedWidth: '365px',
    gap: '32px',
    pauseOnHover: true,
    pauseOnFocus: true,
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
      play: 'Iniciar rotação automática',
      pause: 'Pausar rotação automática',
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

  const autoplay = () => splide.Components.Autoplay;

  // Off-screen slides are inert so keyboard focus never lands on a hidden card
  const syncInert = () => {
    splide.Components.Slides.forEach(({ slide }) => {
      slide.inert = !slide.classList.contains('is-visible');
    });
  };
  splide.on('mounted moved updated resized', syncInert);

  // Arrow and dot use (not autoplay) for analytics
  root.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.splide__arrow, .selecao__dot'))
      requestAnimationFrame(() => track('carousel_nav', { position: splide.index }));
  });

  // Pause while a finger touches the track
  const track_ = root.querySelector('.splide__track')!;
  let touching = false;
  track_.addEventListener('touchstart', () => {
    touching = true;
    autoplay().pause();
  }, { passive: true });
  const endTouch = () => {
    if (!touching) return;
    touching = false;
    if (!reduce.matches && !document.hidden) autoplay().play();
  };
  track_.addEventListener('touchend', endTouch, { passive: true });
  track_.addEventListener('touchcancel', endTouch, { passive: true });

  // Pause while the browser tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoplay().pause();
    else if (!reduce.matches && !touching) autoplay().play();
  });

  splide.mount();
}
