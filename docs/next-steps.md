# Next steps: from here to Eliane's site going live

State on 2026-11-14: the site is built (now with filters by tipo, bairro, quartos, vagas and área, on branch `feat/filters`) and tested on branch `feat/site-rebuild` and carries Eliane Emoto's name, WhatsApp, Instagram, Coelho broker ID and the feminine wording. Two of Edu Soares's details remain (CRECI and domain), and the top image is a dark placeholder. The preview at https://emotobroker.vercel.app shows the last pushed commit; push to update it (Phase 4).

Work through the phases in order. Each step says what to collect, where to change it, and how to check it.

---

## Phase 1: collect from Eliane

| # | What | Status |
|---|---|---|
| 1 | **Photo for the top of the page** (landscape, ≥ 1920 px wide, subject in the upper-middle) | **Pending.** The page shows a placeholder panel |
| 2 | WhatsApp number | Done: +55 11 94392-2721 |
| 3 | **CRECI number** | **Pending.** Footer, metadata and search data still show Edu's `310960` |
| 4 | Instagram link | Done: instagram.com/elianeemoto_broker |
| 5 | Broker ID at Coelho da Fonseca | Done: `18038` in every card link |
| 6 | Listings | Done: they stay the same 48 |
| 7 | **Her six featured listings** and their order | **To confirm.** The carousel shows the six chosen for Edu |
| 8 | **Domain** | **Pending** (not available yet). Canonical link, sharing tags and sitemap still use `edusoaresbroker.com.br` |
| 9 | Wording | Done: "Corretora associada à Coelho da Fonseca" and "Seleção da Eliane" |
| 10 | **Where "Clique para mais informações" should go** | Currently Coelho da Fonseca with her ID. Change it only if she wants another page |
| 11 | **Filter wording** (Tipo, Bairro, Quartos, Vagas, Área, size ranges) | Proposed, see "Filters" in `docs/open-items.md` |
| 12 | **Price filter**: wanted? With visible prices or not? | Needs a price column in the CSV; the spec says not to show prices |

## Phase 2: apply the remaining details

All identity settings are in **`src/lib/site.ts`**; fields still holding Edu's data are marked `TODO`.

1. **CRECI:** `creci` in `BROKER` (`src/lib/site.ts`), digits only. It feeds the footer, the page description and the search data.
2. **Domain:** `SITE_URL` in `src/lib/site.ts`, `site` in `astro.config.mjs`, and the `Sitemap:` line in `public/robots.txt`.
3. **Top image:**
   1. Put the photo in `src/assets/hero/`, e.g. `src/assets/hero/eliane-emoto.jpg`.
   2. In `src/lib/site.ts`, set `HERO.file` to `'eliane-emoto.jpg'` and check `HERO.alt`.
   3. If the face is cropped badly, change `HERO.position` (`'50% 28%'` means centred horizontally, 28 % from the top). Raise or lower the second number.
   4. To go back to the placeholder, set `HERO.file` back to `null`.
4. **Filters:** options (quartos/vagas minimums, size ranges) are in `src/lib/filters.ts`. Neighbourhoods come from the listing titles ("… no/na <bairro>"), so a new listing must follow that pattern. Price: add a column to `data/listings.csv`, then one entry in `src/lib/filters.ts` and one group in `src/components/ListingFilters.astro`.
5. **Featured listings:** in `data/listings.csv`, `destaque` = `sim` plus `ordem` 1–6 marks the six carousel listings. Set every other row to `nao` with an empty `ordem`.
6. **Card link ("Clique para mais informações"):** see "Changing the card link" in `docs/open-items.md`. There are three options: per listing, one rule for all, or only that line.
7. **Sharing image and favicon:** after a new photo or CRECI, regenerate them.

```bash
npx tsx scripts/make-brand-assets.ts
```

8. **Clean-up:** once Eliane's photo is in, delete Edu's original portrait. The page no longer uses it.

```bash
git rm -r src/assets/portrait
```

Other settings, if they ever change: WhatsApp (`BROKER.whatsapp`, digits only with country code), Instagram (`BROKER.instagram`), Coelho ID (`BROKER.coelhoId`; every `coelho_url` in `data/listings.csv` must contain `corretor=<id>`, or the build stops; `null` turns the check off), carousel title (`BROKER.selecaoTitle`). The "Corretora associada" line lives in `src/components/Hero.astro`, `src/components/Footer.astro`, `DESCRIPTION` / `OG_DESCRIPTION` in `src/lib/site.ts` and `scripts/make-brand-assets.ts`.

## Phase 3: check locally

```bash
npm run check
```

```bash
npm run build
```

```bash
npm run test:visual
```

- The tests read their expectations from `data/listings.csv` and `src/lib/site.ts`, so data changes don't break them.
- One test compares the text under the top image with Edu's old live page, skipping the lines that differ on purpose (name and "Corretora"). Once that page is gone, delete the "header text block is identical" test in `tests/visual.spec.ts`.
- Screenshots land in `test-results/screens/`.

```bash
npm run preview
```

The last command serves the built site at http://localhost:4321 so you can look at it yourself.

## Phase 4: update the preview on Vercel

Vercel Authentication is off, so every push gets an open preview link, and `emotobroker.vercel.app` follows `feat/site-rebuild`.

1. **Push** the local commits:

```bash
git push
```

2. **Check the deployment** once Vercel shows it as ready:

```bash
BASE_URL=https://emotobroker.vercel.app npm run test:visual
```

   - Lighthouse: `npm run lhci` with `--collect.url=<preview URL>` (on Windows, set `CHROME_PATH` to Chrome first).
   - `/imoveis` and `/imoveis/` answer **301 → /** (verified on 2026-11-13).

## Phase 5: review on real devices (spec §7)

On the preview link, check:
- iPhone Safari, Android Chrome, desktop Chrome and Safari;
- the Instagram in-app browser (open the link from a Story or DM) and the WhatsApp in-app browser;
- per device: the carousel moves every 3.5 s and stops while touched, Ver mais adds cards, the filters (type included) narrow the list (on phones the Filtros sheet opens, scrolls and closes), each WhatsApp button opens a chat with the right property and **Eliane's** number, and the card link opens the right page.

The carousel deliberately stands still when:
- the mouse rests over the cards (desktop), until it moves away;
- the phone or computer asks for less motion. On iPhone: Settings → Accessibility → Motion → Reduce Motion. On Android: Settings → Accessibility → Remove animations. On Windows: Settings → Accessibility → Visual effects → Animation effects. Visitors with this on see the arrows and dots instead;
- the browser tab is in the background.

Eliane approves the preview on her own phone.

## Phase 6: launch

1. **Merge into `main`**, the production branch. Vercel's `main` build currently fails only because `main` holds no site yet.

```bash
git checkout main
```

```bash
git merge --ff-only feat/site-rebuild
```

```bash
git push
```

2. If the production branch was changed to `feat/site-rebuild` in Vercel, set it back to `main`.
3. **Domain:** in Vercel → Settings → Domains, add Eliane's domain and follow the DNS records Vercel shows at her registrar.
   - If you keep `edusoaresbroker.com.br`, it first has to move away from Lovable.
   - The `/imoveis` redirect only matters for old links to that domain. On a brand-new domain it does no harm.
4. Re-run the tests and Lighthouse against the real domain.

## Phase 7: optional, later

- **Analytics:** events are already emitted to `window.dataLayer` (`src/scripts/track.ts`). Adding a tool needs a cookie-consent banner.
- **Listing updates without code:** a Google Sheet source instead of the CSV (part of the full redesign).
- **Astro 7:** needs Node ≥ 22.23. Update Node, then `npm install astro@7` and re-run the checks.
- **Spec documents:** `docs/spec-current-style.md` and the mockups still say Edu. Update them if they'll be shared again.

---

Decisions taken along the way, and their reasons: `docs/open-items.md`. Commands: the "Commands" section of `CLAUDE.md`.
