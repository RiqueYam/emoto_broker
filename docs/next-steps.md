# Next steps: from here to Eliane's site going live

State on 2026-11-13: the site is built and tested on branch `feat/site-rebuild` and carries Eliane Emoto's name. Several details are still Edu Soares's, and the top image is a dark placeholder. The last 3 commits are local only (not pushed), so Vercel still shows the older Edu version.

Work through the phases in order. Each step says what to collect, where to change it, and how to check it.

---

## Phase 1: collect from Eliane

| # | What | Why it matters |
|---|---|---|
| 1 | **Photo for the top of the page** (landscape, ≥ 1920 px wide, subject in the upper-middle) | Replaces the placeholder panel and the sharing image |
| 2 | **WhatsApp number** | Every button still sends leads to **Edu's** number |
| 3 | **CRECI number** | Shown in the footer, metadata and search data |
| 4 | **Instagram link** | Footer link and search data |
| 5 | **Broker ID at Coelho da Fonseca** (the `corretor=` value in her Coelho links) | Every card links to Coelho with Edu's ID (`18039`) |
| 6 | **Her listings**: same 48 as Edu's, or a new list | `data/listings.csv` is Edu's portfolio |
| 7 | **Her six featured listings** and their order | The "Seleção" carousel |
| 8 | **Domain** (new one, or keep `edusoaresbroker.com.br`?) | Canonical link, sharing tags, sitemap |
| 9 | **Wording**: "Corretor associado" or "Corretora associada"? "Seleção de Eliane" or "da Eliane"? | Pill, footer, descriptions, carousel title |
| 10 | **Where "Clique para mais informações" should go** (Coelho, her own page, …) | The card link |

## Phase 2: apply the details

All identity settings are in **`src/lib/site.ts`**; fields still holding Edu's data are marked `TODO`.

1. **Name, CRECI, WhatsApp, Instagram, broker ID:** edit `BROKER` in `src/lib/site.ts`.
   - `whatsapp`: digits only, with country code, e.g. `5511912345678`.
   - `coelhoId`: her Coelho ID. Set it to `null` if the card links won't point to Coelho.
   - `selecaoTitle`: the carousel title.
2. **Domain:** `SITE_URL` in `src/lib/site.ts`, `site` in `astro.config.mjs`, and the `Sitemap:` line in `public/robots.txt`.
3. **Top image:**
   1. Put the photo in `src/assets/hero/`, e.g. `src/assets/hero/eliane-emoto.jpg`.
   2. In `src/lib/site.ts`, set `HERO.file` to `'eliane-emoto.jpg'` and check `HERO.alt`.
   3. If the face is cropped badly, change `HERO.position` (`'50% 28%'` means centred horizontally, 28 % from the top). Raise or lower the second number.
   4. To go back to the placeholder, set `HERO.file` back to `null`.
4. **Wording (corretor / corretora):** the pill in `src/components/Hero.astro`, the line under the name in `src/components/Footer.astro`, and `DESCRIPTION` / `OG_DESCRIPTION` in `src/lib/site.ts`.
5. **Listings:** edit `data/listings.csv`, one row per property, in page order.
   - `destaque` = `sim` plus `ordem` 1–6 marks the six featured listings.
   - Photos either come from `foto_url` (download with `npm run fetch-images`) or go by hand into `src/assets/listings/<codigo>.<ext>`, leaving `foto_url` empty.
   - The build stops with the row number if a row is invalid.
   - Delete photos of listings you removed from `src/assets/listings/`.
6. **Card link ("Clique para mais informações"):** see "Changing the card link" in `docs/open-items.md`. There are three options: per listing, one rule for all, or only that line.
7. **Sharing image and favicon:** after steps 1–4, regenerate them.

```bash
npx tsx scripts/make-brand-assets.ts
```

8. **Clean-up:** once Eliane's photo is in, delete Edu's original portrait. The page no longer uses it.

```bash
git rm -r src/assets/portrait
```

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
- One test compares the text under the top image with Edu's old live page. Once that page is gone, or the wording changes on purpose, delete the "header text block is identical" test in `tests/visual.spec.ts`.
- Screenshots land in `test-results/screens/`.

```bash
npm run preview
```

The last command serves the built site at http://localhost:4321 so you can look at it yourself.

## Phase 4: deploy a preview on Vercel

1. **Decide how previews should be reachable** (one-time, in Vercel):
   - **Simplest:** Settings → Deployment Protection → turn **Vercel Authentication** off. Every push then gets an open preview link.
   - **Or:** Settings → Git → Production Branch → `feat/site-rebuild`, so `emotobroker.vercel.app` always shows the newest build. Switch it back to `main` at launch.
2. **Push** (this also sends the 3 local commits):

```bash
git push
```

3. **Check the deployment:**
   - Run the tests against the preview, replacing the URL with the one Vercel shows:

```bash
BASE_URL=https://emotobroker.vercel.app npm run test:visual
```

   - Lighthouse: `npm run lhci` with `--collect.url=<preview URL>` (on Windows, set `CHROME_PATH` to Chrome first).
   - The redirect: `/imoveis` and `/imoveis/` should both answer **301 → /**. The trailing-slash case is fixed in `vercel.json` but not yet verified on Vercel.

## Phase 5: review on real devices (spec §7)

On the preview link, check:
- iPhone Safari, Android Chrome, desktop Chrome and Safari;
- the Instagram in-app browser (open the link from a Story or DM) and the WhatsApp in-app browser;
- per device: the carousel moves every 3.5 s and stops while touched, Ver mais adds cards, the tabs filter, each WhatsApp button opens a chat with the right property and **Eliane's** number, and the card link opens the right page.

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

2. If you changed the production branch in Phase 4, set it back to `main`.
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
