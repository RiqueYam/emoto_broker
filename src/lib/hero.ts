import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { HERO } from './site';

export const HERO_SIZES = '100vw';
const WIDTHS = [480, 750, 1080, 1440, 1920];

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/hero/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export interface HeroImage {
  avif: string;
  webp: string;
  fallback: string;
  width: number;
  height: number;
  alt: string;
  position: string;
}

/**
 * The image chosen in HERO (src/lib/site.ts), or null for the placeholder panel.
 * The same AVIF srcset feeds the <picture> and the <link rel="preload">, so the browser reuses the preload.
 */
export async function heroImage(): Promise<HeroImage | null> {
  if (!HERO.file) return null;
  const key = Object.keys(files).find((p) => p.endsWith(`/${HERO.file}`));
  if (!key) throw new Error(`HERO.file "${HERO.file}" not found in src/assets/hero/`);
  const src = files[key].default;
  const [avif, webp] = await Promise.all(
    (['avif', 'webp'] as const).map((format) =>
      getImage({ src, widths: WIDTHS, sizes: HERO_SIZES, format, quality: 55 }),
    ),
  );
  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    fallback: webp.src,
    width: src.width,
    height: src.height,
    alt: HERO.alt,
    position: HERO.position,
  };
}
