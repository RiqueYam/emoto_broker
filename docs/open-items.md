# Open items

## Rename to Eliane Emoto (2026-11-13)

The name now comes from `BROKER` in `src/lib/site.ts`: hero, footer, title, meta, JSON-LD, the WhatsApp messages ("Olá, Eliane."), the Seleção title ("Seleção de Eliane"), the "EE" monogram and the sharing image. Still the previous broker's, and **must be replaced before anything goes public**:

- [ ] **Portrait.** `src/assets/portrait/banner-edu-soares.jpg` is Edu's photo. It appears in the hero and the sharing image, and the alt text now says "Eliane Emoto". To replace it, drop Eliane's photo at the same path (or update the import in `src/lib/portrait.ts`), adjust `object-position` in `.hero__img` if needed, then run `npx tsx scripts/make-brand-assets.ts`.
- [ ] **WhatsApp number** (`BROKER.whatsapp`). Every WhatsApp button would currently send leads to Edu.
- [ ] **CRECI** (`BROKER.creci`), shown in the footer and the metadata.
- [ ] **Instagram** (`BROKER.instagram`).
- [ ] **Domain** (`SITE_URL`, plus `public/robots.txt` and `site` in `astro.config.mjs`).
- [ ] **Coelho da Fonseca broker ID.** Every `coelho_url` in `data/listings.csv` carries `?corretor=18039` (Edu's), and `src/content.config.ts` line 30 requires it. See "Changing the card link" below.
- [ ] **Listings.** The 48 listings and photos are Edu's portfolio. Confirm whether Eliane's are the same.
- [ ] **Wording.** "Corretor associado à Coelho da Fonseca" (hero pill, footer, descriptions) uses the masculine "corretor". "Corretora associada" would be the feminine form. The copy is unchanged until you confirm which Eliane uses. Same for "Seleção de Eliane" (kept neutral instead of "da Eliane").
- [ ] **Live-page comparison.** `tests/visual.spec.ts` still compares against Edu's live page and skips the name line. Point `LIVE` elsewhere or drop that test once the old page is retired.

## Changing the card link ("Clique para mais informações")

The whole card (photo, specs, title, code and "Clique para mais informações") is one link, with the WhatsApp button as a separate link below it. That link is built from the `coelho_url` column:

1. **Different URL per listing:** edit `coelho_url` in `data/listings.csv`. If the new URLs don't contain `corretor=18039`, change or remove the check in `src/content.config.ts` line 30, or the build fails on purpose.
2. **One rule for every card** (e.g. a new site, or another broker ID): change where the URL is mapped, `coelhoUrl: l.coelho_url` in `src/lib/listings.ts` line 49. It feeds both list cards (`src/components/PropertyCard.astro` line 26) and Seleção cards (`src/components/Selecao.astro` line 41). Renaming `coelhoUrl` to something neutral is optional.
3. **Only the "Clique para mais informações" text should go elsewhere,** with the rest of the card still opening Coelho: the text sits inside the card link, and links can't be nested. Move `<span class="card-more">` (`PropertyCard.astro` lines 61–64) out of the card `<a>`, make it its own `<a href=…>`, and keep the `.card-more` styles. The hover underline rule `.card-link:hover .card-more` in `src/styles/_site.scss` would need to become `.card-more:hover`. The test "never nested in a link" in `tests/behaviour.spec.ts` guards this.

The link's accessible name ("Abrir … no site Coelho da Fonseca", `PropertyCard.astro` / `Selecao.astro`) and `data-track="coelho_click"` should follow the new destination.

## Waiting on a decision or an account

- [ ] **Featured listings.** Edu confirms the six listings for "Seleção do Edu" and their order. The placeholders are 549404, 649403, 72911, 689204, 265678 and 352080, set in the `destaque`/`ordem` columns of `data/listings.csv`.
- [x] **GitHub repo:** https://github.com/RiqueYam/emoto_broker (`main` = production, work on `feat/site-rebuild`).
- [ ] **Hosting: Vercel** (chosen 2026-11-13; Netlify can be revisited later). `vercel.json` carries the `/imoveis` → `/` 301 and the cache headers (hashed assets 1 year immutable, HTML not cached). Still to do: import the GitHub repo in Vercel so every branch push gets a preview URL.
- [ ] **Domain.** After the preview is approved, move edusoaresbroker.com.br from Lovable and check that old Instagram links to `/imoveis` still land on the page.
- [ ] **Analytics.** Add it now (which needs a consent banner) or later. The events from spec §6 are already emitted to `window.dataLayer` if one exists (`src/scripts/track.ts`). Nothing is sent today.
- [ ] **Listing updates.** For now, listings change by editing the CSV and redeploying.
- [ ] **Device testing (spec §7).** iOS Safari, Android Chrome, desktop Safari and the Instagram and WhatsApp in-app browsers need the preview URL. Only Chromium has been tested so far.

## Done

- [x] **Photos and portrait** downloaded from the current site into `src/assets/` and committed (originals: 1920 px WebP, served by the current site from URLs ending in `.png`).

## Decisions taken where the sources disagreed (please confirm)

The fidelity rule says to match the live page, and spec §1 says the spec wins over the boards. Where the live page, the spec and the 0/0b mockups disagree, I followed this order: the live page for anything that already exists, then the spec, then the boards.

1. **Card link underline.** Spec §2 and board 0 show a 1 px ink underline under "Clique para mais informações". On the live page the underline is transparent and turns bronze on hover, and the arrow is bronze. Kept as live.
2. **Mobile card specs.** Board 0b shows specs as one " · " line without icons. The live page and spec §2 ("same") use the icon list on mobile too. Kept as live. The Seleção cards do use the " · " line, as spec §3 asks.
3. **Mobile header.** Board 0b is left-aligned with no icon in the Coelho pill. On the live page the header is centred below 1024 px and the pill keeps its gold badge icon, wrapping to two lines at 375 px. Kept as live.
4. **Name and footer type.** Kept as live (Inter for "EDU SOARES" and the footer name; the "|" in the footer is muted, not bronze as on board 0).
5. **Footer spacing.** The live page uses 48 px vertical padding on mobile and 28 px above "CRECI". Spec §2 says 64 px ("same") and board 0 shows 32 px. Kept as live.
6. **Grid.** The live page has 1 / 2 / 3 columns at < 768 / 768–1023 / ≥ 1024 px. Spec §2 lists only 1 and 3. Kept as live (Bootstrap breakpoints set to sm 640, md 768, lg 1024 to match).
7. **Hairline widths.** The mockups list 0.67 px borders. That is a 1 px border measured at a 1.5× zoom, so 1 px is used, as on the live page.
8. **Playfair weight.** The live page loads Playfair Display 500 only and asks for 400, so browsers render the 500 face. The site ships only the 500 face (Fontsource) and declares 400, which renders identically. CLAUDE.md lists Playfair 400–700.
9. **Helper line.** "Selecione um imóvel…" moved under "Todos os imóveis" on desktop too (spec §4). Board 0 still shows it in the header.
10. **WhatsApp glyph.** The icon disc and the floating button use the live page's speech-bubble icon (Lucide `message-circle`, the same drawing as the mockups), not the WhatsApp brand mark.
11. **Meta description.** Spec §8 says "keep the current title and description" but quotes only the title, so the live page's longer description is kept.
12. **Sharing image and favicon.** New, as spec §8 asks: `public/og-image.jpg` (1200×630, portrait and name) and an "ES" monogram favicon. Both are generated by `scripts/make-brand-assets.ts`.

## Deviations from CLAUDE.md (please confirm)

- **Astro 6.4.8, not 7.** Astro 7 needs Node ≥ 22.23.4, and this machine has 22.14. Moving to 7 later is a version bump.
- **TypeScript 5.9.** `@astrojs/check` doesn't support TypeScript 7 yet.
- **Bootstrap.** reboot, containers, grid, buttons and visually-hidden are imported, plus the Sass variables. The utilities API (no utility classes are used; it would add ~10 KB of render-blocking CSS) and nav (the type filter is a group of `aria-pressed` buttons, as on the live page) are left out.
- **Splide autoplay.** Splide handles slides, arrows, dots, ARIA, breakpoints and reduced motion. The 3.5 s advance is a ~30-line timer in `src/scripts/selecao.ts` instead of Splide's Autoplay component. Splide's version runs a `requestAnimationFrame` loop every frame while playing, so Lighthouse never saw the page go idle and couldn't finish a run. Behaviour is unchanged: it pauses on hover, touch, focus inside and a hidden tab, restarts the timer after any move, and doesn't autoplay with reduced motion. The listed fallback (Embla + autoplay plugin) remains an option if you prefer a library for this.
- **Splide options added:** `focus: 0` + `omitEnd: true`, so desktop has 4 positions/dots (0–3) and mobile 6, as in spec §3.
- **Tabs + Ver mais use the plain-TS fallback, not Alpine.js** (approved 2026-11-13). `src/scripts/listings.ts` is ~1 KB gzipped against Alpine's ~21 KB. Behaviour is unchanged and covered by the same tests: counter, reset on tab change, button hides at the end, focus moves to the first new card, `?tipo=…&mostrar=…`, and every card shows without JavaScript. `alpinejs` has been uninstalled.
- **Eager images.** Spec §6 says to load the first list card eagerly. With Seleção now above the list, that card is below the fold on both sizes, so it is lazy. Only the portrait and the first Seleção photo are eager.

## Performance (local Lighthouse runs, see the report)

Local Lighthouse scores depend heavily on how fast this machine's CPU is at the moment (Lighthouse's `benchmarkIndex` varied from ~1,500 to ~3,500 during the session). The comparisons below were run back to back, so they are fair to each other. The real check is still the preview deployment.

- **Mobile, standard 4× CPU slowdown, plain-TS build (5 runs):** Performance 0.99–1.0, LCP 1.57–1.67 s, TBT 0–24 ms, CLS ≤ 0.003, 318 KB transferred, 17 KB JS. All budgets pass.
- **Mobile, 9× slowdown (simulates the slower host seen earlier, 6 runs each):** plain-TS 0.95–0.99, TBT 0–202 ms; the previous Alpine build 0.69–0.96, TBT 171–893 ms.
- **Desktop:** Performance 1.0, LCP ~0.48 s, TBT 0, CLS 0, 237 KB transferred.
- [x] **Confirmed on Vercel (https://emotobroker.vercel.app, 2026-11-13, 5 runs each, all budget assertions pass):**
  - Mobile: Performance 0.99–1.0, Accessibility / Best practices / SEO 1.0, LCP 1.68–1.80 s, TBT 0–33 ms, CLS ≤ 0.003, **313 KB** transferred (images 203, fonts 70, HTML with inline CSS 24, JS 16).
  - Desktop: Performance 1.0, LCP 0.37–0.45 s, TBT 0–19 ms, CLS 0, **234 KB** transferred.
  - The current page loads ~1.7 MB.
  - Playwright suite against the deployment: 35 passed, 3 skipped by design. The header differs from the live page in 0.008 % of pixels (desktop) / 0.042 % (mobile).

## Vercel setup

- `emotobroker.vercel.app` serves the deployment of `feat/site-rebuild` at commit `5d0b934`. Later pushes build as previews, which Vercel Authentication protects, so automated checks and Edu can't open them.
- [ ] **`/imoveis/` (trailing slash)** still answered 200 on `5d0b934`. The fix (commit `e9fe0ad`, explicit rules in `vercel.json`) built successfully but sits on a protected preview. To verify it, either turn off Vercel Authentication (Settings → Deployment Protection) or promote that deployment.
- `main` fails to build on Vercel because it holds only the pack (no `package.json`). That's expected until the site is merged into `main` after approval.
