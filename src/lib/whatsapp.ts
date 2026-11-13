/** Single source for every wa.me link (spec §6). */
export const WHATSAPP_NUMBER = '5511961942319';

export const GENERIC_MESSAGE = 'Olá, Edu. Vim pelo site e gostaria de conversar sobre um imóvel.';

export function waUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function listingMessage(codigo: string, titulo: string): string {
  return `Olá, Edu. Vi no seu site o imóvel cód. ${codigo} (${titulo}) e gostaria de mais informações.`;
}

export function listingWaUrl(codigo: string, titulo: string): string {
  return waUrl(listingMessage(codigo, titulo));
}

export const genericWaUrl = waUrl(GENERIC_MESSAGE);
