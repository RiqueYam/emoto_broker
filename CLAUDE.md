# CLAUDE.md — Private Broker landing page

> **The broker is now Eliane Emoto (changed 2026-11-13).** This file and `docs/spec-current-style.md` were written for Edu Soares. Wherever they name Edu, read Eliane. Every name, contact and identity detail lives in `BROKER` and `HERO` in `src/lib/site.ts`. Change it there, never hard-code it. Fields marked TODO in that file still hold Edu's details and are waiting for Eliane's. The ordered to-do list is `docs/next-steps.md`.

## What this project is
A new one-page site, built from scratch, for Carlos Eduardo (Edu) Soares, private broker associated with Coelho da Fonseca (CRECI 310960). It replaces the current Lovable page at edusoaresbroker.com.br/imoveis. Visitors mostly arrive from Instagram on a phone; the page's job is to get them into a WhatsApp conversation about a specific property.

## What to build
1. **Recreate the current page exactly**: hero portrait with fade, name block, Coelho da Fonseca pill, intro, type tabs with counts, 3-column card grid, footer, floating green WhatsApp button.
2. **Add Seleção do Edu**: auto-advancing carousel of 6 featured listings (every 3.5 s).
3. **Add Todos os imóveis + Ver mais**: 9 cards on desktop / 6 on mobile, the button adds the same number again.
4. **Add a WhatsApp button under every card**: ink pill with a green WhatsApp icon disc and a pre-filled message naming the property.

Source of truth: `docs/spec-current-style.md`. Visual reference: `design/mockups/*.png` and `design/reference/*.reference.html`. The reference files are design-canvas mockups: read them for exact values, copy and behaviour, but never copy their markup in (they use a canvas-only template format).

## Fidelity rule (overrides everything below)
The page must match the live site and the current-style mockups **exactly**: the spec §2 values and boards 0 and 0b. Libraries are there to keep the code readable, never to change the look. Configure each one to hit the measured values. If a library can't reach a value without hacks, switch that piece to the listed fallback and note it in `docs/open-items.md`.

## Stack (pre-approved dependencies)
| Area | Library | Configure it so | Fallback |
|---|---|---|---|
| Site builder | Astro + TypeScript, static output | plain HTML/CSS output | — |
| CSS | **Bootstrap 5.3.8** via Sass (not 6, it is alpha) | Sass variables carry the §2 values: `$body-bg #FFFDF9`, `$body-color #1D1D1F`, `$font-family-sans-serif` Inter, `$headings-font-family` Playfair Display, `$headings-font-weight 400`, base 16/24, `$border-radius-pill`, `$primary #1D1D1F`. Import only reboot, grid, utilities, buttons and nav. Site pieces (Coelho pill, divider, card, uppercase tracked tabs) are small custom classes in `src/styles/` | Custom class in place of any Bootstrap component that can't match |
| Carousel | **Splide 4** (`@splidejs/splide`) | `perMove: 1, rewind: true, autoplay: true, interval: 3500, speed: 700, easing: 'cubic-bezier(0.22,0.61,0.36,1)', fixedWidth: '365px', gap: '32px', pauseOnHover: true, pauseOnFocus: true, pagination: true, arrows: true`. Breakpoint ≤ 767px: `fixedWidth: '290px', gap: '16px', speed: 600, arrows: false, padding: { right: '20px' }`. Default `reducedMotion` (autoplay paused, speed 0). `i18n` in Portuguese. Pause on `document.visibilitychange` (a few lines). Restyle arrows to the 44 px round buttons beside the title and dots to 24×2 / 12×2 px lines; don't use Splide's default theme CSS, only its core CSS | Embla Carousel + `embla-carousel-autoplay` |
| Tabs + Ver mais | ~~Alpine.js 3~~ → **using the fallback** (2026-11-13: Alpine's ~21 KB gz cost the mobile Lighthouse budget; see `docs/open-items.md`) | Tab, shown and page size (9 desktop / 6 mobile via `matchMedia`) in `src/scripts/listings.ts`; markup and classes as in the mockup | Small plain TS script |
| Data | Astro content collection + Zod schema loading `data/listings.csv` (parse with `papaparse` or `csv-parse`) | Invalid row → build fails with its row number | — |
| Fonts | **Fontsource**: `@fontsource/inter` (300–700), `@fontsource/playfair-display` (400–700) | Same families/weights as the live page | Google Fonts `<link>` as on the live page |
| Icons | Inline SVG **copied from the live page DOM** for spec icons, the link arrow and the floating WhatsApp button. Others via `astro-icon`: Lucide, plus Bootstrap Icons for brand marks | Same drawings as the live page | Hand-written inline SVG |
| Images | Astro `<Image>`/`<Picture>`, WebP/AVIF + `srcset` | Cards 3:2 with 6 px radius; portrait `object-position: 50% 28%` | — |
| Quality | Prettier + `prettier-plugin-astro`; Playwright (screenshots at 1440×900 and 375×812); Lighthouse CI (`@lhci/cli`) with budgets | Compare with `design/mockups/` and the live page | — |
| Hosting | Vercel or Netlify, preview deployments; `/imoveis` → 301 → `/` | — | — |

Ask before adding anything not in this table.

Suggested layout:
```
src/
  pages/index.astro
  content.config.ts            (listings collection + Zod schema)
  components/ Hero.astro, Intro.astro, Selecao.astro, Listings.astro, PropertyCard.astro,
              WhatsAppButton.astro, Footer.astro, FloatingWhatsApp.astro
  scripts/  selecao.ts (Splide setup), listings.ts (tabs + Ver mais, plain TS)
  lib/      whatsapp.ts (URL + message helper)
  styles/   _variables.scss (Bootstrap overrides), main.scss (imports + custom classes)
  assets/   portrait/banner-edu-soares.jpg, listings/<codigo>.<ext>
data/listings.csv
scripts/fetch-images.ts   (one-off: downloads foto_url → src/assets/listings/)
tests/visual.spec.ts      (Playwright)
lighthouserc.json         (Lighthouse CI + budgets)
```

## Performance budget (pass/fail, Lighthouse mobile on the preview, empty cache, first load)
| Budget | Mobile 375 px | Desktop 1440 px |
|---|---|---|
| Total transferred | < 1 MB | < 1.5 MB |
| JS compressed | < 80 KB | < 80 KB |
| CSS compressed | < 40 KB | < 40 KB |
| Fonts | < 150 KB (WOFF2, Latin subset, used weights only) | same |
| Portrait | < 200 KB (AVIF/WebP, sized per screen) | < 250 KB |
| Each listing photo | < 80 KB (AVIF/WebP, card size, 1×/2× srcset) | same |
| LCP / CLS / INP | < 2.5 s / < 0.1 / < 200 ms | < 2.0 s / < 0.1 / < 200 ms |
| Lighthouse Performance | ≥ 90 | ≥ 95 |

How: only the first visible photos load eagerly (mobile: portrait + first slide + first card; desktop: first 3 slides + first row), everything else lazy, cards behind Ver mais load only when shown; portrait preloaded with `fetchpriority="high"`; every image has width/height or aspect-ratio; preload only the two above-the-fold font faces; Bootstrap partial imports, Splide core CSS only; scripts `defer`/module; hashed assets cached 1 year immutable, HTML not cached. Lighthouse CI (`@lhci/cli`, budgets in `lighthouserc.json`) runs on every preview and fails the build when a budget is exceeded. Baseline for comparison: the current page loads ~1.7 MB (650 KB portrait, PNG photos ~145 KB each).

## Design values (measured on the live page)
| Token | Value |
|---|---|
| Background | #FFFDF9 |
| Ink (text, dark pills, WhatsApp button fill) | #1D1D1F |
| Muted text | #5F5748 |
| Bronze accent | #836731 |
| Hairline / inactive tab border | #E4DDCF |
| Photo placeholder | #F4ECDD |
| WhatsApp green (floating button, icon disc) | #308639 |
| Inactive carousel dot | #C9BFAC |

Sizes per element (desktop and mobile) are in spec §2–§5.

## Data
`data/listings.csv` holds the 48 listings. Columns:
- `codigo`, `titulo`, `tipo_tab` (Apartamento | Cobertura | Casa | Alphaville);
- `area_tipo` (uteis | construidos), `area_m2`, `terreno_m2`, `quartos`, `suites`, `vagas`;
- `destaque` (sim | nao), `ordem` (carousel order, featured rows only);
- `foto_url` (the current site's image, to download once), `coelho_url`.

Rules:
- Grid order is file order. The carousel shows `destaque=sim` rows sorted by `ordem`.
- Card specs: `uteis` → "237 m² úteis"; `construidos` → "700 m² construídos" and "904 m² de terreno". Then quartos, suítes, vagas, omitting vagas when empty. Thousands use a dot: 1.200 m².
- Validate at build time: a missing codigo, an unknown tipo_tab or a non-numeric area fails the build with the row number.

## Copy
`{Nome}`/`{nome}` come from `BROKER` in `src/lib/site.ts` (currently Eliane / Eliane Emoto).
- Card WhatsApp message: `Olá, {Nome}. Vi no seu site o imóvel cód. {codigo} ({titulo}) e gostaria de mais informações.`
- Floating button and footer: `Olá, {Nome}. Vim pelo site e gostaria de conversar sobre um imóvel.`
- Title: `Imóveis de alto padrão à venda em São Paulo — {nome completo} | Coelho da Fonseca`.

## Workflow
- Branch `main` for production; build features on branches with small commits.
- Verify visually with Playwright at 1440×900 and 375×812. Compare against `design/mockups/` and, if reachable, the live page. Run Lighthouse (mobile).
- Record the commands here once the project exists: dev, build, preview, check.

## Commands
Node 22.x (Astro 6; pinned in package.json `engines` so Vercel builds on 22). Install with `npm ci`.

| Task | Command |
|---|---|
| Dev server (http://localhost:4321) | `npm run dev` |
| Production build → `dist/` | `npm run build` |
| Serve the build | `npm run preview` |
| Type check + formatting check | `npm run check` |
| Format | `npm run format` |
| Download portrait + listing photos (one-off) | `npm run fetch-images` |
| Regenerate favicons + sharing image | `npx tsx scripts/make-brand-assets.ts` |
| Playwright (behaviour + visual vs live, 1440×900 and 375×812) | `npx playwright install chromium` once, then `npm run test:visual` (starts `preview` itself; `BASE_URL=… npm run test:visual` tests a deployed preview) |
| Lighthouse CI with budgets | `npm run lhci` (mobile, `lighthouserc.json`) and `npx lhci autorun --config=lighthouserc.desktop.json`. Set `CHROME_PATH` to an installed Chrome on Windows. |

Notes:
- Screenshots land in `test-results/screens/`, Lighthouse reports in `.lighthouseci/`.
- Decisions and deviations from this file are listed in `docs/open-items.md`.
