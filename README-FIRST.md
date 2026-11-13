# Claude Code pack: Edu Soares landing page, new build in the current style

## 1. Create the project folder
Make an empty folder (for example `edu-soares-site`) and copy this pack's contents into it:

```
edu-soares-site/
├── CLAUDE.md                     ← rules, stack and design values
├── PROMPT.md                     ← what to paste into Claude Code
├── docs/
│   ├── spec-current-style.md     ← export from the spec doc (step 2)
│   └── open-items.md
├── data/
│   └── listings.csv              ← 48 listings, including photo addresses
└── design/
    ├── mockups/                  ← PNGs you export from the canvas (step 3)
    └── reference/
        ├── current-style-desktop.reference.html
        └── current-style-mobile.reference.html
```

## 2. Export the spec
Open "Edu Soares — Current Style Landing Page: Specification". Use its Export menu → Markdown and save it as `docs/spec-current-style.md`.

## 3. Export the mockups
On the design canvas, export these boards as PNG into `design/mockups/`:
- `0 · Current style, desktop + Seleção + Ver mais` → `desktop-1440.png`
- `0b · Current style, mobile + Seleção + Ver mais` → `mobile-375.png`

A screenshot of the live page at the same sizes is a helpful extra: `live-desktop.png`, `live-mobile.png`.

## 4. Accounts to have ready
- **GitHub:** an empty repository for the site. Claude Code will push to it.
- **Vercel or Netlify:** connect the GitHub repo to get preview links. Claude Code can't create accounts for you.
- **Domain:** don't move edusoaresbroker.com.br yet. That happens after Edu approves the preview.

## 5. Photos
The CSV's `foto_url` column and the prompt point to the current site's images, and Claude Code will try to download them. If it can't reach the site, save each photo yourself as `src/assets/listings/<codigo>.<ext>` and the portrait as `src/assets/portrait/banner-edu-soares.jpg`.

## 6. Start Claude Code
Open a terminal in the folder, run `claude`, and paste the prompt from `PROMPT.md`. It will stop after the planning step and wait for your go-ahead. It needs Node LTS installed, and it will ask before installing Playwright or Lighthouse for checks.
