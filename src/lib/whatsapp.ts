/** Single source for every wa.me link (spec §6). */
import { BROKER } from './site';

export const WHATSAPP_NUMBER = BROKER.whatsapp;

export const GENERIC_MESSAGE = `Olá, ${BROKER.firstName}. Vim pelo site e gostaria de conversar sobre um imóvel.`;

export function waUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function listingMessage(codigo: string, titulo: string): string {
  return `Olá, ${BROKER.firstName}. Vi no seu site o imóvel cód. ${codigo} (${titulo}) e gostaria de mais informações.`;
}

export function listingWaUrl(codigo: string, titulo: string): string {
  return waUrl(listingMessage(codigo, titulo));
}

export const genericWaUrl = waUrl(GENERIC_MESSAGE);
