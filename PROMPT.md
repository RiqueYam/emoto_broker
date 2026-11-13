# Prompt to paste into Claude Code

Start Claude Code in an empty folder that holds only the files from this pack (see README-FIRST.md), then paste everything between the lines.

---

We're building a new website from scratch for Edu Soares, a private broker in São Paulo. It replaces his current page at https://edusoaresbroker.com.br/imoveis. Read `CLAUDE.md` first, then `docs/spec-current-style.md` in full. Those two files are the source of truth: follow them over anything else, including your own preferences.

**The fidelity rule comes first:** the result must match the live page and the current-style mockups exactly. Use the libraries listed in CLAUDE.md (Astro, Bootstrap 5.3.8, Splide, Alpine.js, Fontsource, astro-icon); they're there to keep the code readable. If any of them can't reproduce a measured value or behaviour without hacks, switch that piece to the fallback listed in CLAUDE.md and tell me.

**Goal**
- Recreate the current page exactly.
- Add three things:
  1. a "Seleção do Edu" carousel of 6 featured listings that advances every 3.5 seconds (spec §3);
  2. a "Todos os imóveis" heading with a "Ver mais imóveis" button, showing 9 cards first on desktop and 6 on mobile (spec §4);
  3. a "Consultar no WhatsApp" button under every property card: an ink pill with a green WhatsApp icon disc and a message naming the property (spec §5).

**References**
- `design/mockups/`: PNG exports of the approved mockups at 1440 px and 375 px. Look at them before you build.
- `design/reference/*.reference.html`: the mockup source with every measured value, all the copy and the carousel and Ver mais logic. Read it for values and behaviour. Don't copy its markup: it uses a canvas-only template format.
- `data/listings.csv`: the 48 listings, with `destaque`/`ordem` for the carousel and `foto_url` for each photo.
- The live page, https://edusoaresbroker.com.br/imoveis. Compare against it if you can reach it. If you can't, tell me and rely on the mockups.

**Work in this order, and stop for my approval after step 1**

1. **Plan, without writing code.**
   - Confirm the stack in CLAUDE.md, list the components and files you'll create, and say how you'll check visual parity.
   - For each library, confirm it can hit the spec's values (Bootstrap variables, Splide options and restyled arrows and dots) or name the fallback you'd use instead.
   - Check whether you can reach the live site to download the photos.
   - Flag anything in the spec that is unclear.
2. **Scaffold.**
   - Create the Astro + TypeScript project and install the libraries from CLAUDE.md.
   - Set the Bootstrap Sass variables to the spec §2 values and import only the needed parts.
   - Set up Fontsource, the listings content collection with its Zod schema, and the WhatsApp helper.
   - Add the dev, build and check commands to CLAUDE.md.
3. **Assets.**
   - Write `scripts/fetch-images.ts` to download the portrait (`https://edusoaresbroker.com.br/__l5e/assets-v1/750b8e16-4532-421e-946a-04cfd93f320f/banner-edu-soares.jpg`) and every `foto_url` into `src/assets/`, then run it.
   - If downloads are blocked, stop and tell me. I'll add the files by hand to `src/assets/portrait/` and `src/assets/listings/<codigo>.<ext>`.
4. **Recreate the current page.**
   - If you can reach the live page, copy its inline SVG icons (specs, arrow, floating WhatsApp) from the DOM.
   - Build the hero, header block, tabs, cards, footer and floating WhatsApp button.
   - Screenshot at 1440×900 and 375×812, and compare with the live page until they match.
5. **WhatsApp button** under every card, as a sibling of the card link, never nested inside it.
6. **Todos os imóveis + Ver mais**, as an Alpine.js component. Include:
   - the counter ("Mostrando 9 de 48");
   - resetting to the first batch when the tab changes;
   - hiding the button at the end;
   - moving focus to the first new card;
   - `?tipo=…&mostrar=…` in the URL;
   - every card showing when JavaScript is off.
7. **Seleção carousel** with Splide, using the options in CLAUDE.md.
   - Restyle the arrows and dots to the mockup; don't use Splide's default theme.
   - Advance every 3.5 s.
   - Pause on hover, touch, focus and when the browser tab is hidden.
   - Arrows on desktop; dots on both desktop and mobile.
   - No autoplay when the visitor's system asks for reduced motion.
   - ARIA and Portuguese labels as in spec §3, through Splide's `i18n` and `label`.
8. **SEO and extras.** Meta and Open Graph tags, `RealEstateAgent` structured data, sitemap, robots.txt, the `/imoveis` → `/` redirect, a monogram favicon, and a 1200×630 sharing image.
9. **Verify.**
   - Build and run the checks.
   - Take Playwright screenshots at both sizes and compare them with the mockups and the live page.
   - Run Lighthouse CI on mobile and desktop against the performance budget in CLAUDE.md and spec §6; fix anything over budget before going on.
   - Report the first-load weight next to the current page's ~1.7 MB.
   - Test keyboard-only navigation.
   - Go through every acceptance item in spec §7 and report pass or fail for each.
10. **Deliver.**
    - Commit in small steps on a branch and push to the GitHub repo I give you.
    - Deploy a preview to Vercel or Netlify, whichever I connect.
    - Give me the preview URL, the screenshots, the Lighthouse reports and the checklist.

**Rules**
- Ask before adding any dependency not listed in CLAUDE.md.
- Don't invent content or show prices.
- Keep all copy in Portuguese, exactly as in the spec.
- Don't touch DNS or the Lovable project.
- If something is ambiguous, ask instead of guessing.
- Record unresolved items in `docs/open-items.md`.

---
