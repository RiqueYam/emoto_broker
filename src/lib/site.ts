/**
 * Broker identity — the single place to edit who the site is for.
 *
 * The name is Eliane Emoto (2026-11-13). The fields marked TODO (CRECI, domain) still hold the
 * previous broker's (Edu Soares) details and must be replaced with Eliane's before
 * the site goes public. See docs/open-items.md.
 */
export const BROKER = {
  name: 'Eliane Emoto',
  firstName: 'Eliane',
  /** Section title of the featured carousel. */
  selecaoTitle: 'Seleção da Eliane',
  /** TODO: Eliane's CRECI number (this is Edu's). */
  creci: '310960',
  /** WhatsApp number, digits only with country code (+55 11 94392-2721). */
  whatsapp: '5511943922721',
  /** Instagram profile. */
  instagram: 'https://www.instagram.com/elianeemoto_broker',
  /**
   * Broker ID at Coelho da Fonseca. Every `coelho_url` in
   * data/listings.csv must contain `corretor=<id>`, or the build stops. Set to null to drop the check.
   */
  coelhoId: '18038' as string | null,
} as const;

/**
 * Image at the top of the page. To switch it:
 *   1. put the photo in src/assets/hero/ (jpg, png, webp or avif; ≥ 1920 px wide is best),
 *   2. set `file` to its file name, e.g. 'eliane-emoto.jpg',
 *   3. describe it in `alt`, and move the crop with `position` (x% y%) if the face is cut off,
 *   4. run `npx tsx scripts/make-brand-assets.ts` to refresh the sharing image.
 * With `file: null` the page shows a plain warm-dark panel with the same fade (as in the mockups).
 */
export const HERO = {
  file: null as string | null,
  alt: `${BROKER.name}, Private Broker`,
  position: '50% 28%',
};

/** TODO: Eliane's domain (this is Edu's). Used for canonical, Open Graph, sitemap and robots.txt. */
export const SITE_URL = 'https://edusoaresbroker.com.br';
export const INSTAGRAM_URL = BROKER.instagram;

export const TITLE = `Imóveis de alto padrão à venda em São Paulo — ${BROKER.name} | Coelho da Fonseca`;
export const DESCRIPTION = `Apartamentos, coberturas e casas em condomínio à venda no Itaim Bibi, Cidade Jardim, Alto de Pinheiros, Chácara Santo Antônio e outros bairros de alto padrão de São Paulo. Vitrine de ${BROKER.name}, corretora associada à Coelho da Fonseca (CRECI ${BROKER.creci}).`;
export const OG_DESCRIPTION = `Vitrine de apartamentos, coberturas e casas em condomínio de alto padrão nos principais bairros de São Paulo, por ${BROKER.name}, corretora associada à Coelho da Fonseca.`;
