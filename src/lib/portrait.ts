import { getImage } from 'astro:assets';
import portraitSrc from '../assets/portrait/banner-edu-soares.jpg';

export const PORTRAIT_SIZES = '100vw';
const WIDTHS = [480, 750, 1080, 1440, 1920];

/** Same srcset for the <picture> and the <link rel="preload">, so the browser reuses the preload. */
export async function portraitSources() {
  const [avif, webp] = await Promise.all(
    (['avif', 'webp'] as const).map((format) =>
      getImage({ src: portraitSrc, widths: WIDTHS, sizes: PORTRAIT_SIZES, format, quality: 55 }),
    ),
  );
  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    fallback: webp.src,
    width: portraitSrc.width,
    height: portraitSrc.height,
  };
}
