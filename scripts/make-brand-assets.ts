/**
 * Renders the monogram favicons and the 1200×630 sharing image with Chromium so they
 * use the site's own fonts (Fontsource). Run again after changing BROKER or HERO in src/lib/site.ts:
 *   npx tsx scripts/make-brand-assets.ts
 */
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { BROKER, HERO } from '../src/lib/site.ts';

// Monogram from the broker's initials, e.g. "Eliane Emoto" → E + E
const [first = '', ...rest] = BROKER.name.split(/\s+/);
const initials = [first[0] ?? '', rest.at(-1)?.[0] ?? ''].map((c) => c.toUpperCase());

const font = (p: string) => readFile(path.resolve('node_modules', p)).then((b) => b.toString('base64'));

const [inter400, inter500, playfair500, heroPhoto] = await Promise.all([
  font('@fontsource/inter/files/inter-latin-400-normal.woff2'),
  font('@fontsource/inter/files/inter-latin-500-normal.woff2'),
  font('@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2'),
  // Same image as the top of the page (HERO in src/lib/site.ts); the dark panel while none is set
  HERO.file
    ? sharp(path.join('src/assets/hero', HERO.file)).resize(1200).jpeg({ quality: 85 }).toBuffer()
    : Promise.resolve(null),
]);
const heroBackground = heroPhoto
  ? `url(data:image/jpeg;base64,${heroPhoto.toString('base64')}) ${HERO.position}/cover`
  : '#3A332C';

const fonts = `
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${inter400}) format('woff2')}
@font-face{font-family:Inter;font-weight:500;src:url(data:font/woff2;base64,${inter500}) format('woff2')}
@font-face{font-family:'Playfair Display';font-weight:500;src:url(data:font/woff2;base64,${playfair500}) format('woff2')}
*{margin:0;box-sizing:border-box}`;

const monogram = (size: number) => `<!doctype html><style>${fonts}
body{width:${size}px;height:${size}px;background:#1D1D1F;display:flex;align-items:center;justify-content:center;
font-family:'Playfair Display';color:#FFFDF9;font-size:${size * 0.5}px;letter-spacing:${-size * 0.02}px;
${size >= 128 ? '' : ''}border-radius:${size >= 128 ? 0 : size * 0.18}px}
span{color:#836731}</style><body>${initials[0]}<span>${initials[1]}</span></body>`;

const og = `<!doctype html><style>${fonts}
body{width:1200px;height:630px;background:#FFFDF9;font-family:Inter;color:#1D1D1F;position:relative;overflow:hidden}
.ph{position:absolute;inset:0 0 auto 0;height:380px;background:${heroBackground}}
.fade{position:absolute;left:0;right:0;top:250px;height:130px;background:linear-gradient(rgba(255,253,249,0),#FFFDF9)}
.t{position:absolute;left:80px;right:80px;bottom:56px}
.n{font-size:30px;line-height:36px;letter-spacing:.3px}
.r{margin-top:8px;font-size:13px;font-weight:500;letter-spacing:.4em;text-transform:uppercase;color:#836731}
.d{width:56px;height:1px;background:#836731;margin-top:24px}
h1{margin-top:20px;font-family:'Playfair Display';font-weight:500;font-size:56px;line-height:64px;letter-spacing:-1.4px}
.c{position:absolute;right:80px;bottom:64px;padding:10px 20px;border-radius:9999px;background:#1D1D1F;color:#FFFDF9;
font-size:13px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}</style>
<body><div class="ph"></div><div class="fade"></div>
<div class="t"><p class="n">${BROKER.name.toUpperCase()}</p><p class="r">Private Broker</p><div class="d"></div><h1>Imóveis Selecionados</h1></div>
<p class="c">Corretora associada à Coelho da Fonseca</p></body>`;

const browser = await chromium.launch();
const shot = async (html: string, w: number, h: number, type: 'png' | 'jpeg' = 'png') => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({
    type,
    quality: type === 'jpeg' ? 85 : undefined,
    omitBackground: true,
  });
  await page.close();
  return buf;
};

const png32 = await shot(monogram(32), 32, 32);
const png16 = await sharp(await shot(monogram(64), 64, 64))
  .resize(16)
  .png()
  .toBuffer();
await writeFile('public/apple-touch-icon.png', await shot(monogram(180), 180, 180));
await writeFile('public/icon-192.png', await shot(monogram(192), 192, 192));
await writeFile('public/og-image.jpg', await shot(og, 1200, 630, 'jpeg'));

// favicon.ico holding two PNG images (16 and 32)
const images = [png16, png32];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const size = i === 0 ? 16 : 32;
  const e = 6 + i * 16;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...images]));

await browser.close();
console.log('Wrote public/favicon.ico, apple-touch-icon.png, icon-192.png, og-image.jpg');
