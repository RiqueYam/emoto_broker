/**
 * One-off: download the portrait and every listing photo from the current site.
 *   npm run fetch-images            (skips files already present)
 *   npm run fetch-images -- --force
 * The extension comes from the Content-Type header: the current site serves WebP
 * from URLs ending in .png.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const PORTRAIT_URL =
  'https://edusoaresbroker.com.br/__l5e/assets-v1/750b8e16-4532-421e-946a-04cfd93f320f/banner-edu-soares.jpg';
const LISTINGS_DIR = 'src/assets/listings';
const PORTRAIT_DIR = 'src/assets/portrait';
const force = process.argv.includes('--force');

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

async function download(url: string, dir: string, base: string, existing: string[]): Promise<string> {
  const already = existing.find((f) => path.parse(f).name === base);
  if (already && !force) return `skip  ${already}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'site-build-image-fetch' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  const ext = EXT[type];
  if (!ext) throw new Error(`Unexpected content-type "${type}" for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = `${base}.${ext}`;
  await writeFile(path.join(dir, file), buf);
  return `saved ${file} (${Math.round(buf.length / 1024)} KB)`;
}

async function main() {
  await mkdir(LISTINGS_DIR, { recursive: true });
  await mkdir(PORTRAIT_DIR, { recursive: true });

  const portraitExisting = await readdir(PORTRAIT_DIR);
  console.log('portrait:', await download(PORTRAIT_URL, PORTRAIT_DIR, 'banner-edu-soares', portraitExisting));

  const rows: { codigo: string; foto_url: string }[] = parse(await readFile('data/listings.csv', 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
  const existing = await readdir(LISTINGS_DIR);
  let failed = 0;
  for (const row of rows) {
    try {
      console.log(`${row.codigo}:`, await download(row.foto_url, LISTINGS_DIR, row.codigo, existing));
    } catch (err) {
      failed++;
      console.error(`${row.codigo}: FAILED`, (err as Error).message);
    }
  }
  if (failed) {
    console.error(`${failed} download(s) failed.`);
    process.exit(1);
  }
}

main();
