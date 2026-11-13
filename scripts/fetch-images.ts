/**
 * Download every listing photo named in the `foto_url` column of data/listings.csv
 * into src/assets/listings/<codigo>.<ext>.
 *   npm run fetch-images            (skips photos already present)
 *   npm run fetch-images -- --force
 * Rows with an empty `foto_url` are skipped: add those photos by hand with the same name.
 * The extension comes from the Content-Type header (some servers send WebP from URLs ending in .png).
 * The top-of-page image is not downloaded here; see HERO in src/lib/site.ts.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const LISTINGS_DIR = 'src/assets/listings';
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
  const rows: { codigo: string; foto_url: string }[] = parse(await readFile('data/listings.csv', 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
  const existing = await readdir(LISTINGS_DIR);
  let failed = 0;
  for (const row of rows) {
    if (!row.foto_url.trim()) {
      const present = existing.some((f) => path.parse(f).name === row.codigo);
      console.log(
        `${row.codigo}:`,
        present ? 'no foto_url, using the file already present' : 'no foto_url and NO PHOTO',
      );
      if (!present) failed++;
      continue;
    }
    try {
      console.log(`${row.codigo}:`, await download(row.foto_url, LISTINGS_DIR, row.codigo, existing));
    } catch (err) {
      failed++;
      console.error(`${row.codigo}: FAILED`, (err as Error).message);
    }
  }
  if (failed) {
    console.error(`${failed} photo(s) missing or failed.`);
    process.exit(1);
  }
}

main();
