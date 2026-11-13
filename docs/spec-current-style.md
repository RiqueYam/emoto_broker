# Edu Soares — Current Style Landing Page: Specification

Nov 12, 2026 · @Henrique

## 1. Scope

This spec defines a **new site, built from scratch**, that recreates Edu's current page (edusoaresbroker.com.br/imoveis) exactly and adds three things: a **Seleção do Edu** auto-advancing carousel, a **Ver mais** button on the listings, and a **WhatsApp button under every property card**. Nothing from the current Lovable project is reused except its content (text, listings, photos); the look must match it: colours, fonts, sizes, spacing, hero, tabs, card style and footer.

**Visual reference:** boards "0 · Current style, desktop" and "0b · Current style, mobile" on the [design canvas](https://claude.ai/artifact/4CNLHAU4VD2HMiMujoxt26). Use Play to see the carousel, Ver mais and the buttons working. Where this document and the boards differ, this document wins.

**Why these three changes**

- The Seleção puts six chosen properties in front of visitors before the long list, and the movement makes the page feel alive.
- Ver mais shortens the page: on a phone, 48 stacked cards take roughly 22,000 px; the new list starts at 6.
- The WhatsApp button turns interest in one property into a conversation that already names it, instead of sending every visitor away to Coelho da Fonseca's site.

**Recreated exactly from the current page:** the hero portrait and fade, the name block, the Coelho da Fonseca pill, the intro, the type tabs and their counts, the card design and its "Clique para mais informações" link to Coelho (with `?corretor=18039`), the footer and the floating green WhatsApp button. The page lives at `/` and `/imoveis` redirects to it, so existing Instagram links keep working.

## 2. Baseline (measured on the live page, 2026-11-12)

The rebuild must reproduce these values exactly, and the new elements reuse them. Measured at 1440 px (desktop) and 375 px (mobile).

**Colours**

| Role | Value |
| --- | --- |
| Page background | #FFFDF9 |
| Text and dark pills | #1D1D1F |
| Muted text | #5F5748 |
| Bronze accent (Private Broker, divider) | #836731 |
| Hairlines, inactive tab border | #E4DDCF |
| Photo placeholder | #F4ECDD |
| WhatsApp green (floating button) | #308639 |

**Type and spacing**

| Element | Desktop | Mobile |
| --- | --- | --- |
| Container | max 1200 px, padding 0 20 px | padding 0 20 px |
| Hero figure | 448 px tall, object-position 50% 28%, 112 px fade to background | 208 px tall, 80 px fade |
| Name "EDU SOARES" | Inter 30/36, +0.3 px | Inter 24/32, +0.24 px |
| "Private Broker" | Inter 500, 11.2 px, tracking 4.48 px, uppercase, bronze | 9.92 px, tracking 3.97 px |
| Coelho pill | Ink fill, Inter 500 10.88 px, tracking 1.52 px, uppercase, padding 8×16 | 9.92 px, tracking 1.39 px |
| Divider | 56×1 px bronze, 48 px above | Centred, 40 px above |
| H1 "Imóveis Selecionados" | Playfair Display 400, 60/75, −1.5 px | 32/40, −0.8 px |
| Intro | Inter 18/29.25, muted, max 672 px | 15.2/24.7 |
| Type tabs | Inter 500 12/16, tracking 1.68 px, uppercase, padding 8×16, pill, gap 12 px | 10.88/16.32, tracking 1.52 px, gap 8 px |
| Grid | 3 columns, gap 64 px rows × 32 px columns | 1 column, gap 48 px |
| Card photo | 365×244 (3:2), radius 6 px | 335×223 |
| Card specs | Inter 12/19.5, muted, bronze 14 px icons | same |
| Card title | Playfair Display 400, 22/30.25, −0.55 px | 20/27.5, −0.5 px |
| Card code | Inter 11.2/16.8, tracking 2.24 px, uppercase, muted | same |
| Card link | Inter 14/20, 1 px underline, arrow | same |
| Footer | Centred, padding 64×20 px | same |
| Floating WhatsApp | 56 px circle, #308639, 20 px from the corner | same |

Fonts: Inter 300–700 and Playfair Display 500–700 from Google Fonts (already loaded).

## 3. Change 1 — Seleção do Edu carousel

A new section between the intro block and the type tabs shows six featured properties, advancing on its own every 3.5 seconds.

**Layout**

|  | Desktop | Mobile |
| --- | --- | --- |
| Position | After the header block, separated by a 1 px #E4DDCF line | same |
| Padding | 64 px top, 72 px bottom, inside the 1200 px container | 40 px top, 48 px bottom, 20 px left; the track bleeds off the right edge |
| Eyebrow | "CURADORIA", same style as "Private Broker" | same (mobile size) |
| Title | "Seleção do Edu", Playfair 400, 44/54, −1 px | 28/34, −0.6 px |
| Controls | Two 44 px round buttons at right of the title: previous (outline #E4DDCF) and next (ink fill) | None; dots only |
| Visible cards | 3 × 365 px, gap 32 px | 1 × 290 px with the next one peeking, gap 16 px |
| Dots | Under the track: active 24×2 px ink, others 12×2 px #C9BFAC, 28 px hit area | same |

**Featured card:** same as a list card, with a dark "DESTAQUE" pill (ink, Inter 500 10.88 px, tracking 1.52 px) at the photo's top left. Specs show as one line separated by " · ". The card ends with the WhatsApp button (section 5).

**Motion**

- Advances by one card every 3.5 s. The slide takes 700 ms on desktop and 600 ms on mobile, easing `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Positions: desktop 0–3 (cards 1–3 up to 4–6), mobile 0–5. After the last position it returns to the first.
- Pauses while the pointer is over the track, while a finger touches it, and while any control inside it has keyboard focus. It resumes when that ends.
- Arrows and dots jump to a position and restart the 3.5 s timer.
- With `prefers-reduced-motion: reduce`, there is no autoplay and no slide animation; arrows and dots still work.
- Also pause when the tab is hidden (`document.visibilitychange`).

**Accessibility:** the region has `aria-roledescription="carrossel"` and `aria-label="Seleção do Edu"`. Each slide has `aria-label="3 de 6"`, and off-screen slides are `inert`. Arrows and dots are real buttons with Portuguese labels. Autoplay never moves keyboard focus.

**Content:** the six properties marked as featured in the data (section 6). Until Edu chooses, use codes 549404, 649403, 72911, 689204, 265678 and 352080, in that order. Featured properties also stay in the full list below.

## 4. Change 2 — Todos os imóveis and Ver mais

The full list gets a heading and shows a batch of cards at a time, with a button to load more.

|  | Desktop | Mobile |
| --- | --- | --- |
| Heading | "Todos os imóveis", Playfair 400, 44/54, above the tabs, 64 px top padding, 1 px #E4DDCF line above the section | 28/34, 40 px top padding |
| Helper line | "SELECIONE UM IMÓVEL PARA CONHECER TODOS OS DETALHES." moves under this heading (it was in the header block) | same |
| First batch | 9 cards (3 rows) | 6 cards |
| Each tap of Ver mais | +9 | +6 |

**Counter and button** (centred under the grid; 56 px above, 96 px below on desktop, 48/64 on mobile)

- Counter: "MOSTRANDO 9 DE 48", Inter 12/16, tracking 2.16 px, uppercase, muted. It counts the active tab ("MOSTRANDO 9 DE 16" for Cobertura).
- Button: "VER MAIS IMÓVEIS", 48 px tall pill, 0.67 px ink outline, transparent fill, same type as the tabs, padding 0 32 px.
- The button hides when all cards of the active tab are showing.

**Behaviour**

- Changing tab resets the list to the first batch.
- After Ver mais, focus moves to the first newly shown card's title link, without scrolling past it.
- New cards appear with the page's existing fade, or instantly with reduced motion.
- The tab and the number shown are reflected in the address (`?tipo=cobertura&mostrar=18`) so a shared link restores them.

## 5. Change 3 — WhatsApp button under every card

Every card, in the Seleção and in the full list, ends with a WhatsApp button that opens a message already naming that property.

**Look** (matches the Coelho da Fonseca pill; green only in the icon disc)

| Part | Value |
| --- | --- |
| Shape | Pill, min-height 44 px, padding 0 20 px 0 8 px, aligned left, 20 px below the card link |
| Fill and text | #1D1D1F fill, #FFFDF9 text |
| Label | "CONSULTAR NO WHATSAPP", Inter 500, 12/16 px tracking 1.68 px on desktop (10.88/16.32, tracking 1.52 px on mobile), uppercase |
| Icon disc | 28 px circle, #308639, white WhatsApp glyph 15 px, 10 px before the label |
| Hover | Fill #000; disc unchanged |
| Focus | 2 px #836731 outline, 2 px offset |

**Structure:** the card's photo, specs, title, code and "Clique para mais informações" stay one link to Coelho. The WhatsApp button is a separate sibling link below it, never nested inside the card link.

**Link:** `https://wa.me/5511961942319?text=<message>`, encoded with `encodeURIComponent`, opening with `target="_blank" rel="noopener"`.

**Message:** Olá, Edu. Vi no seu site o imóvel cód. {codigo} ({titulo}) e gostaria de mais informações.

Example: "Olá, Edu. Vi no seu site o imóvel cód. 549404 (Cobertura no Itaim Bibi) e gostaria de mais informações."

**Accessibility:** the accessible name includes the property, e.g. `aria-label="Consultar no WhatsApp sobre Cobertura no Itaim Bibi, código 549404"`. The glyph is `aria-hidden`. White on #308639 is 4.5:1 (AA).

## 6. Data, tracking, accessibility and performance

**Data:** the listings live in `data/listings.csv` in the repository, read at build time; one row per property, in the order shown on the page. Columns: codigo, titulo, tipo\_tab (Apartamento, Cobertura, Casa or Alphaville), area\_tipo, area\_m2, terreno\_m2, quartos, suites, vagas, destaque, ordem, foto\_url, coelho\_url. The carousel shows rows with `destaque = sim`, sorted by `ordem`. Adding, removing or reordering a listing means editing the CSV and redeploying (section 8).

**One helper for WhatsApp links:** a single function builds every wa.me URL and message (card buttons, the floating button, the footer), so the number and wording live in one place.

**Tracking** (only if analytics already exists or is added with consent; no personal data)

| Event | When | Parameters |
| --- | --- | --- |
| wa\_click | Any WhatsApp button | source (card, selecao, floating, footer), codigo |
| coelho\_click | A card link to Coelho | codigo, source |
| carousel\_nav | Arrow or dot used (not autoplay) | position |
| load\_more | Ver mais tapped | tab, shown |
| tab\_change | A type tab chosen | tab |

**Accessibility**

- WCAG 2.2 AA: everything new meets 4.5:1 for text and 3:1 for controls.
- Every new control is at least 44 px and has a visible focus ring.
- The carousel follows section 3; Ver mais moves focus as in section 4.

**Performance**

The budget below is a pass/fail check. It is measured with Lighthouse (mobile, simulated 4G) on the preview deployment, with an empty cache, and covers the first load before scrolling. The current page loads about 1.7 MB (measured 2026-11-12): roughly 650 KB of portrait and PNG listing photos averaging 145 KB each.

| Budget | Mobile (375 px) | Desktop (1440 px) |
| --- | --- | --- |
| Total transferred on first load | under 1 MB | under 1.5 MB |
| JavaScript (Splide, Alpine, page scripts), compressed | under 80 KB | under 80 KB |
| CSS, compressed | under 40 KB | under 40 KB |
| Fonts | under 150 KB (WOFF2, Latin subset, only the weights used) | same |
| Portrait | under 200 KB (WebP or AVIF, sized per screen) | under 250 KB |
| Each listing photo | under 80 KB (WebP or AVIF, sized for the card) | same |
| Largest Contentful Paint | under 2.5 s | under 2.0 s |
| Cumulative Layout Shift | under 0.1 | under 0.1 |
| Interaction to Next Paint | under 200 ms | under 200 ms |
| Lighthouse Performance score | 90 or higher | 95 or higher |

**How to stay inside it**

- Only the first visible photos load at once: on mobile the portrait plus the first carousel slide and the first list card, on desktop the first 3 slides and the first row. Everything else lazy-loads, and cards behind Ver mais load only when shown.
- The portrait is preloaded with `fetchpriority="high"`; every image has fixed dimensions or an aspect ratio, so nothing shifts.
- Photos are converted at build time to AVIF with a WebP fallback, using `srcset` at 1× and 2× card size.
- Fonts are self-hosted, preloaded only for the two faces seen above the fold, with `font-display: swap`.
- Bootstrap includes only the imported parts; Splide's core CSS only, no theme; scripts load with `defer` or as modules.
- Long-lived caching (1 year, immutable) for hashed assets; HTML is not cached.
- A Lighthouse CI run on every preview deployment fails if any budget is exceeded.

## 7. Acceptance criteria, out of scope and open items

**Acceptance** (checked on a preview deployment, desktop 1440 px and mobile 375 px)

- [ ] Everything outside the three changes is pixel-identical to the live page (screenshot comparison of hero, header block, tabs, a card and the footer).
- [ ] The Seleção shows the six featured listings and advances every 3.5 s.
- [ ] The Seleção pauses on hover, touch, focus and a hidden tab, and stays still with reduced motion.
- [ ] Arrows and dots work and restart the timer.
- [ ] The list shows 9 cards on desktop and 6 on mobile, Ver mais adds the same number again, and the counter is correct.
- [ ] The Ver mais button hides at the end, and changing tab resets the batch.
- [ ] Every card, featured or not, has the WhatsApp button with the correct pre-filled message. The Coelho link still carries `?corretor=18039`.
- [ ] No link is nested inside another link, and all new controls are reachable by keyboard with a visible focus ring.
- [ ] Tested in iOS Safari, Android Chrome, desktop Chrome and Safari, and the Instagram and WhatsApp in-app browsers.
- [ ] Mobile Lighthouse Performance and Accessibility scores are not lower than before.

* [ ] Every item in the section 6 performance budget passes on the preview deployment, with the Lighthouse reports attached.

**Out of scope** (covered by the full redesign spec, not this one): new colours or type, bio and "Como trabalho", buyer brief, seller section, English version, prices, testimonials.

**Open items**

- [ ] Edu chooses the six featured properties and their order.
- [ ] Download the portrait and the 48 listing photos from the current site (section 8) and keep originals in the repository before the old site is switched off.
- [ ] Decide the host (Vercel or Netlify) and who moves the domain's DNS away from Lovable.
- [ ] Decide whether to add analytics now (needs a consent banner) or later.

## 8. Build from scratch: stack, assets and launch

A static site built from well-known libraries, so the code stays readable for whoever maintains it next. **Fidelity rule:** the page must match the live site and the current-style mockups exactly (section 2 values, boards 0 and 0b). Every library must be configured to hit those values; if one can't without hacks, that piece switches to the fallback in the table.

| Area | Choice | How it matches exactly | Fallback if it can't |
| --- | --- | --- | --- |
| Site builder | Astro + TypeScript, static output | Outputs plain HTML and CSS; no visual effect | — |
| CSS framework | Bootstrap 5.3.8 (Sass), not 6 (alpha) | Sass variables set to the section 2 values (colours, fonts, body 16/24, radii, pill buttons). Only the needed parts are imported (reboot, grid, utilities, buttons, nav). Site-specific pieces (pill, divider, card, tab sizes with tracking) are small custom classes on top | Drop a Bootstrap component for a custom class wherever it can't reach a measured value |
| Carousel | Splide 4 | `perMove: 1`, `rewind: true`, `interval: 3500`, `speed: 700` (600 on mobile), `easing: cubic-bezier(0.22,0.61,0.36,1)`, `fixedWidth: 365px` / `gap: 32px` on desktop, `290px` / `16px` on mobile. Also: `pauseOnHover`, `pauseOnFocus`, `reducedMotion`, Portuguese `i18n`, and arrows and dots restyled to the mockup | Embla Carousel + its autoplay plugin |
| Tabs and Ver mais | Alpine.js 3 | Behaviour only; markup and classes stay as in the mockup | A small plain script |
| Data | Astro content collection with a Zod schema, loading `data/listings.csv` | No visual effect; a bad row fails the build with its row number | — |
| Fonts | Fontsource: Inter 300–700, Playfair Display 400–700, self-hosted | Same families and weights as the live page | Google Fonts link, as on the live page |
| Icons | Inline SVG copied from the live page wherever available (spec icons, arrow, floating WhatsApp). New icons via astro-icon: Lucide, plus Bootstrap Icons for brand marks | Same drawings as the live page | Hand-written inline SVG |
| Images | Astro image pipeline, WebP/AVIF with `srcset`, photos in `src/assets/` | Same crops: 3:2 cards, portrait at object-position 50% 28% | — |
| Quality | Prettier (with the Astro plugin), Playwright screenshot tests at 1440 and 375 px | Screenshots compared with the mockups and the live page | — |
| Hosting | Vercel or Netlify, with preview deployments | — | — |
| Domain | edusoaresbroker.com.br moved from Lovable after approval; `/imoveis` redirects 301 to `/` | — | — |

**Assets to bring in**

- Portrait: `banner-edu-soares.jpg` from the current site, shown with object-position 50% 28%.
- Listing photos: one per listing, from the `foto_url` column (the current site's image addresses), saved as `src/assets/listings/<codigo>.<ext>`.
- Favicon and sharing image: none exist yet; make a simple monogram favicon and a 1200×630 sharing image from the portrait and name.

**SEO and sharing**

- Keep the current title and description: "Imóveis de alto padrão à venda em São Paulo — Edu Soares | Coelho da Fonseca".
- Add canonical, Open Graph and Twitter tags, `lang="pt-BR"`, a sitemap and robots.txt.
- Add `RealEstateAgent` structured data (name, CRECI 310960, memberOf Coelho da Fonseca, Instagram).

**Launch**

1. Build on a preview URL and check every acceptance item in section 7.
2. Edu reviews on his phone, including from an Instagram Story link.
3. Move the domain, set the `/imoveis` redirect, and check the old Instagram links still land on the page.
4. Keep the Lovable project unpublished but not deleted for two weeks, as a fallback.
