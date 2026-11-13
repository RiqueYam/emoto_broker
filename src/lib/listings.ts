import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { listingSpecs, type Spec } from './specs';
import { listingWaUrl } from './whatsapp';
import { bairroFromTitle, slug } from './filters';

export const TABS = ['Todos', 'Apartamento', 'Cobertura', 'Casa', 'Alphaville'] as const;
export type Tab = (typeof TABS)[number];

const photos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/listings/*.{webp,jpg,jpeg,png,avif}',
  {
    eager: true,
  },
);

function photoFor(codigo: string): ImageMetadata {
  const key = Object.keys(photos).find((p) => p.split('/').pop()!.split('.')[0] === codigo);
  if (!key) throw new Error(`Foto ausente: src/assets/listings/${codigo}.<ext> (rode npm run fetch-images)`);
  return photos[key].default;
}

export interface ListingView {
  codigo: string;
  titulo: string;
  tipo: Exclude<Tab, 'Todos'>;
  specs: Spec[];
  coelhoUrl: string;
  waUrl: string;
  photo: ImageMetadata;
  destaque: boolean;
  ordem?: number;
  /** Position in the full list. */
  index: number;
  /** Position within its own tab. */
  tabIndex: number;
  /** Neighbourhood from the title, for the location filter. */
  bairro: string;
  quartos: number;
  /** 0 when the CSV leaves it empty. */
  vagas: number;
  /** área útil or construída in m², the first number on the card. */
  area: number;
}

export async function loadListings(): Promise<ListingView[]> {
  const entries = (await getCollection('listings')).map((e) => e.data).sort((a, b) => a.index - b.index);
  const perTab = new Map<string, number>();
  return entries.map((l) => {
    const tabIndex = perTab.get(l.tipo_tab) ?? 0;
    perTab.set(l.tipo_tab, tabIndex + 1);
    const bairro = bairroFromTitle(l.titulo);
    if (!bairro)
      throw new Error(
        `data/listings.csv, código ${l.codigo}: bairro não encontrado no titulo "${l.titulo}" (esperado "… no/na <bairro>")`,
      );
    return {
      codigo: l.codigo,
      titulo: l.titulo,
      tipo: l.tipo_tab,
      specs: listingSpecs(l),
      coelhoUrl: l.coelho_url,
      waUrl: listingWaUrl(l.codigo, l.titulo),
      photo: photoFor(l.codigo),
      destaque: l.destaque,
      ordem: l.ordem,
      index: l.index,
      tabIndex,
      bairro,
      quartos: l.quartos,
      vagas: l.vagas ?? 0,
      area: l.area_m2,
    };
  });
}

export function featured(all: ListingView[]): ListingView[] {
  return all.filter((l) => l.destaque).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

export function tabCounts(all: ListingView[]): Record<Tab, number> {
  const counts = { Todos: all.length, Apartamento: 0, Cobertura: 0, Casa: 0, Alphaville: 0 };
  for (const l of all) counts[l.tipo]++;
  return counts;
}

/** URL slug for ?tipo= */
export const tabSlug = (t: Tab) => t.toLowerCase();

/** Neighbourhoods for the location filter, alphabetical (pt-BR), with their URL value. */
export function bairros(all: ListingView[]): { label: string; value: string }[] {
  return [...new Set(all.map((l) => l.bairro))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((label) => ({ label, value: slug(label) }));
}
