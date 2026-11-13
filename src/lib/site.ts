/**
 * Broker identity — the single place to edit who the site is for.
 *
 * The name is Eliane Emoto (2026-11-13). The fields marked TODO still hold the
 * previous broker's (Edu Soares) details and must be replaced with Eliane's before
 * the site goes public. See docs/open-items.md.
 */
export const BROKER = {
  name: 'Eliane Emoto',
  firstName: 'Eliane',
  /** Section title of the featured carousel. */
  selecaoTitle: 'Seleção de Eliane',
  /** TODO: Eliane's CRECI number (this is Edu's). */
  creci: '310960',
  /** TODO: Eliane's WhatsApp number, digits only with country code (this is Edu's). */
  whatsapp: '5511961942319',
  /** TODO: Eliane's Instagram (this is Edu's). */
  instagram: 'https://instagram.com/edusoares.broker',
  /**
   * TODO: Eliane's broker ID at Coelho da Fonseca (this is Edu's). Every `coelho_url` in
   * data/listings.csv must contain `corretor=<id>`, or the build stops. Set to null to drop the check.
   */
  coelhoId: '18039' as string | null,
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
export const DESCRIPTION = `Apartamentos, coberturas e casas em condomínio à venda no Itaim Bibi, Cidade Jardim, Alto de Pinheiros, Chácara Santo Antônio e outros bairros de alto padrão de São Paulo. Vitrine de ${BROKER.name}, corretor associado à Coelho da Fonseca (CRECI ${BROKER.creci}).`;
export const OG_DESCRIPTION = `Vitrine de apartamentos, coberturas e casas em condomínio de alto padrão nos principais bairros de São Paulo, por ${BROKER.name}, corretor associado à Coelho da Fonseca.`;
