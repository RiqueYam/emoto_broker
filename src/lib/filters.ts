/**
 * Listing filters under the type tabs: neighbourhood, rooms, parking and size.
 * Shared by the markup (src/components/ListingFilters.astro), the script
 * (src/scripts/listings.ts) and the tests, so the options live in one place.
 * Price can be added later as one more entry once the CSV has a price column.
 */

/** Neighbourhood from the title: "Apartamento no Itaim Bibi" → "Itaim Bibi". */
export function bairroFromTitle(titulo: string): string | undefined {
  return titulo.match(/\s(?:no|na|nos|nas)\s(.+)$/)?.[1].trim();
}

/** URL-safe value: "Chácara Santo Antônio" → "chacara-santo-antonio". */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "at least N" options for quartos and vagas. */
export const MIN_OPTIONS = [2, 3, 4, 5] as const;

/** Size ranges on área útil / construída (the first number on each card), lower bound inclusive. */
export const AREA_RANGES = [
  { value: '0-250', label: 'Até 250 m²', min: 0, max: 250 },
  { value: '250-500', label: '250 a 500 m²', min: 250, max: 500 },
  { value: '500-1000', label: '500 a 1.000 m²', min: 500, max: 1000 },
  { value: '1000-', label: 'Acima de 1.000 m²', min: 1000, max: Infinity },
] as const;

export interface FilterState {
  bairro: string[];
  quartos: number;
  vagas: number;
  area: string;
}

export const EMPTY_FILTERS: FilterState = { bairro: [], quartos: 0, vagas: 0, area: '' };

export interface Filterable {
  bairro: string;
  quartos: number;
  vagas: number;
  area: number;
}

export function matches(l: Filterable, f: FilterState): boolean {
  if (f.bairro.length && !f.bairro.includes(l.bairro)) return false;
  if (f.quartos && l.quartos < f.quartos) return false;
  if (f.vagas && l.vagas < f.vagas) return false;
  if (f.area) {
    const r = AREA_RANGES.find((r) => r.value === f.area);
    if (r && (l.area < r.min || l.area >= r.max)) return false;
  }
  return true;
}
