export type SpecKind = 'area' | 'land' | 'bed' | 'bath' | 'car';
export interface Spec {
  kind: SpecKind;
  text: string;
}

interface SpecSource {
  area_tipo: 'uteis' | 'construidos';
  area_m2: number;
  terreno_m2?: number;
  quartos: number;
  suites: number;
  vagas?: number;
}

/** 1200 → "1.200" (pt-BR thousands dot). */
export const formatNumber = (n: number): string => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

export function listingSpecs(l: SpecSource): Spec[] {
  const specs: Spec[] = [];
  if (l.area_tipo === 'uteis') {
    specs.push({ kind: 'area', text: `${formatNumber(l.area_m2)} m² úteis` });
  } else {
    specs.push({ kind: 'area', text: `${formatNumber(l.area_m2)} m² construídos` });
    if (l.terreno_m2 !== undefined) specs.push({ kind: 'land', text: `${formatNumber(l.terreno_m2)} m² de terreno` });
  }
  specs.push({ kind: 'bed', text: `${l.quartos} quartos` });
  specs.push({ kind: 'bath', text: `${l.suites} suítes` });
  if (l.vagas !== undefined && l.vagas > 0) specs.push({ kind: 'car', text: `${l.vagas} vagas` });
  return specs;
}
