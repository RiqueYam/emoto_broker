import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { BROKER } from './lib/site';

const CSV_PATH = 'data/listings.csv';

const int = z.string().trim().regex(/^\d+$/, 'deve ser um número inteiro').transform(Number);
const optionalInt = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().regex(/^\d+$/, 'deve ser um número inteiro').transform(Number).optional());

/** Validates one raw CSV row (all strings). */
const rowSchema = z
  .object({
    codigo: z.string().trim().regex(/^\d+$/, 'codigo ausente ou inválido'),
    titulo: z.string().trim().min(1, 'titulo ausente'),
    tipo_tab: z.enum(['Apartamento', 'Cobertura', 'Casa', 'Alphaville']),
    area_tipo: z.enum(['uteis', 'construidos']),
    area_m2: int,
    terreno_m2: optionalInt,
    quartos: int,
    suites: int,
    vagas: optionalInt,
    destaque: z.enum(['sim', 'nao']).transform((v) => v === 'sim'),
    ordem: optionalInt,
    // Only used by scripts/fetch-images.ts; may be empty when the photo is added by hand
    foto_url: z.union([z.literal(''), z.url()]),
    coelho_url: z
      .url()
      .refine(
        (u) => !BROKER.coelhoId || u.includes(`corretor=${BROKER.coelhoId}`),
        `coelho_url sem ?corretor=${BROKER.coelhoId} (BROKER.coelhoId em src/lib/site.ts)`,
      ),
  })
  .superRefine((r, ctx) => {
    if (r.area_tipo === 'construidos' && r.terreno_m2 === undefined)
      ctx.addIssue({
        code: 'custom',
        path: ['terreno_m2'],
        message: 'obrigatório quando area_tipo = construidos',
      });
    if (r.destaque && r.ordem === undefined)
      ctx.addIssue({ code: 'custom', path: ['ordem'], message: 'obrigatório quando destaque = sim' });
  });

export type Listing = z.output<typeof rowSchema> & { index: number };

const listings = defineCollection({
  loader: {
    name: 'listings-csv',
    load: async ({ store, logger }) => {
      const text = await readFile(CSV_PATH, 'utf8');
      const rows: Record<string, string>[] = parse(text, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
      });
      store.clear();
      const seen = new Set<string>();
      rows.forEach((raw, i) => {
        const line = i + 2; // line 1 is the header
        const result = rowSchema.safeParse(raw);
        if (!result.success) {
          const issues = result.error.issues
            .map((e) => `${e.path.join('.') || 'linha'}: ${e.message}`)
            .join('; ');
          throw new Error(`${CSV_PATH} linha ${line}: ${issues}`);
        }
        if (seen.has(result.data.codigo))
          throw new Error(`${CSV_PATH} linha ${line}: codigo ${result.data.codigo} duplicado`);
        seen.add(result.data.codigo);
        store.set({ id: result.data.codigo, data: { ...result.data, index: i } });
      });
      logger.info(`${rows.length} imóveis carregados de ${CSV_PATH}`);
    },
  },
  schema: z.object({
    codigo: z.string(),
    titulo: z.string(),
    tipo_tab: z.enum(['Apartamento', 'Cobertura', 'Casa', 'Alphaville']),
    area_tipo: z.enum(['uteis', 'construidos']),
    area_m2: z.number(),
    terreno_m2: z.number().optional(),
    quartos: z.number(),
    suites: z.number(),
    vagas: z.number().optional(),
    destaque: z.boolean(),
    ordem: z.number().optional(),
    foto_url: z.string(),
    coelho_url: z.string(),
    index: z.number(),
  }),
});

export const collections = { listings };
