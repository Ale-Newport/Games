/**
 * Builds the shared world data for the geography games from Natural Earth (public domain, via
 * the `world-atlas` package) and country names from `i18n-iso-countries` (MIT):
 *   src/games/shared/world/names.ts    ISO2 → English/Spanish names and accepted aliases
 *   src/games/shared/world/world-50m.json  topology limited to the countries in meta.ts
 * Run: npx tsx tools/generate-world.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };
import es from 'i18n-iso-countries/langs/es.json' with { type: 'json' };
import { COUNTRY_META } from '../src/games/shared/world/meta';

countries.registerLocale(en);
countries.registerLocale(es);

const root = new URL('../', import.meta.url);
const topo = JSON.parse(
  readFileSync(new URL('node_modules/world-atlas/countries-50m.json', root), 'utf8'),
) as {
  objects: { countries: { geometries: { id?: string; properties: { name?: string } }[] } };
};

const wanted = new Set(COUNTRY_META.map((m) => m.iso2));
const EXTRA: Record<string, string> = { Kosovo: 'XK' };
const kept = topo.objects.countries.geometries.flatMap((g) => {
  const iso2 = g.id ? countries.numericToAlpha2(g.id) : EXTRA[g.properties.name ?? ''];
  if (!iso2 || !wanted.has(iso2)) return [];
  // Australia appears twice (Ashmore and Cartier Is.); keep the mainland only.
  if (g.properties.name === 'Ashmore and Cartier Is.') return [];
  return [{ ...g, id: iso2, properties: {} }];
});
const missing = [...wanted].filter((w) => !kept.some((k) => k.id === w));
if (missing.length) throw new Error(`No shape for ${missing.join(', ')}`);
topo.objects.countries.geometries = kept;
writeFileSync(new URL('src/games/shared/world/world-50m.json', root), JSON.stringify(topo));

/** Hand-added aliases people commonly type (en/es). */
const ALIASES: Record<string, [string[], string[]]> = {
  US: [
    ['usa', 'us', 'america', 'united states'],
    ['eeuu', 'ee uu', 'usa', 'estados unidos'],
  ],
  GB: [
    ['uk', 'britain', 'great britain', 'england'],
    ['reino unido', 'gran bretana', 'inglaterra'],
  ],
  CD: [
    ['drc', 'dr congo', 'congo kinshasa', 'zaire'],
    ['rd congo', 'rdc', 'congo kinsasa'],
  ],
  CG: [
    ['congo', 'republic of the congo', 'congo brazzaville'],
    ['congo', 'republica del congo'],
  ],
  CI: [['ivory coast', 'cote d ivoire'], ['costa de marfil']],
  CZ: [
    ['czech republic', 'czechia'],
    ['republica checa', 'chequia'],
  ],
  MK: [
    ['macedonia', 'north macedonia'],
    ['macedonia', 'macedonia del norte'],
  ],
  SZ: [
    ['swaziland', 'eswatini'],
    ['suazilandia', 'esuatini'],
  ],
  MM: [['burma'], ['birmania']],
  TL: [['east timor'], ['timor oriental']],
  KR: [
    ['korea', 'south korea'],
    ['corea', 'corea del sur'],
  ],
  KP: [['north korea'], ['corea del norte']],
  NL: [
    ['holland', 'the netherlands'],
    ['holanda', 'paises bajos'],
  ],
  VA: [
    ['vatican', 'holy see'],
    ['vaticano', 'santa sede'],
  ],
  CV: [['cape verde'], ['cabo verde']],
  XK: [['kosovo'], ['kosovo']],
  PS: [['palestine'], ['palestina']],
  TW: [['taiwan'], ['taiwan']],
  RU: [['russia'], ['rusia']],
  IR: [['iran'], ['iran']],
  SY: [['syria'], ['siria']],
  LA: [['laos'], ['laos']],
  VN: [['vietnam', 'viet nam'], ['vietnam']],
  BO: [['bolivia'], ['bolivia']],
  VE: [['venezuela'], ['venezuela']],
  TZ: [['tanzania'], ['tanzania']],
  MD: [['moldova'], ['moldavia']],
  FM: [['micronesia'], ['micronesia']],
  BN: [['brunei'], ['brunei']],
};

/** Display names where the library's short forms are ambiguous or unusual. */
const DISPLAY: Record<string, [string, string]> = {
  CD: ['DR Congo', 'República Democrática del Congo'],
  CG: ['Republic of the Congo', 'República del Congo'],
  US: ['United States', 'Estados Unidos'],
  KR: ['South Korea', 'Corea del Sur'],
  KP: ['North Korea', 'Corea del Norte'],
  RU: ['Russia', 'Rusia'],
  IR: ['Iran', 'Irán'],
  SY: ['Syria', 'Siria'],
  LA: ['Laos', 'Laos'],
  VN: ['Vietnam', 'Vietnam'],
  BO: ['Bolivia', 'Bolivia'],
  VE: ['Venezuela', 'Venezuela'],
  TZ: ['Tanzania', 'Tanzania'],
  MD: ['Moldova', 'Moldavia'],
  FM: ['Micronesia', 'Micronesia'],
  BN: ['Brunei', 'Brunéi'],
  TW: ['Taiwan', 'Taiwán'],
  PS: ['Palestine', 'Palestina'],
  VA: ['Vatican City', 'Ciudad del Vaticano'],
  MK: ['North Macedonia', 'Macedonia del Norte'],
  CZ: ['Czechia', 'Chequia'],
  SZ: ['Eswatini', 'Esuatini'],
  CI: ["Côte d'Ivoire", 'Costa de Marfil'],
  CV: ['Cabo Verde', 'Cabo Verde'],
  TL: ['Timor-Leste', 'Timor Oriental'],
  MM: ['Myanmar', 'Myanmar'],
  NL: ['Netherlands', 'Países Bajos'],
  GB: ['United Kingdom', 'Reino Unido'],
};

const lines: string[] = [];
for (const m of COUNTRY_META) {
  const nameEn =
    m.iso2 === 'XK' ? 'Kosovo' : countries.getName(m.iso2, 'en', { select: 'official' })!;
  const nameEs =
    m.iso2 === 'XK' ? 'Kosovo' : countries.getName(m.iso2, 'es', { select: 'official' })!;
  const allEn = m.iso2 === 'XK' ? [] : (countries.getName(m.iso2, 'en', { select: 'all' }) ?? []);
  const allEs = m.iso2 === 'XK' ? [] : (countries.getName(m.iso2, 'es', { select: 'all' }) ?? []);
  const [aEn, aEs] = ALIASES[m.iso2] ?? [[], []];
  const short = (n: string) => n.replace(/,.*$/, '').replace(/\s*\(.*\)\s*/, '');
  const en1 = DISPLAY[m.iso2]?.[0] ?? short(nameEn);
  const es1 = DISPLAY[m.iso2]?.[1] ?? short(nameEs);
  // A bare "Congo" belongs to the Republic of the Congo only.
  const ok = (a: string) => a !== en1 && a !== es1 && !(m.iso2 === 'CD' && /^congo$/i.test(a));
  const aliasEn = [...new Set([nameEn, ...allEn, ...aEn].filter(ok))];
  const aliasEs = [...new Set([nameEs, ...allEs, ...aEs].filter(ok))];
  lines.push(
    `  ${m.iso2}: [${JSON.stringify(en1)}, ${JSON.stringify(es1)}, ${JSON.stringify(aliasEn)}, ${JSON.stringify(aliasEs)}],`,
  );
}
writeFileSync(
  new URL('src/games/shared/world/names.ts', root),
  `/** GENERATED by tools/generate-world.ts from i18n-iso-countries (MIT). Do not edit. */\n` +
    `/** ISO2 → [English name, Spanish name, English aliases, Spanish aliases] */\n` +
    `export const NAMES: Record<string, [string, string, string[], string[]]> = {\n${lines.join('\n')}\n};\n`,
);
console.log(`world: ${kept.length} shapes, ${lines.length} names`);

// ---------------------------------------------------------------- centroids and border distances
// Precomputed so the geography games can measure distances synchronously (and in the AI
// environments): the centroid of each country's largest polygon, and the shortest distance in km
// between every pair of borders (0 when they touch), sampled at up to 400 boundary points.
{
  const { feature } = await import('topojson-client');
  const { geoArea, geoCentroid } = await import('d3-geo');
  type Ring = [number, number][];
  const toFeature = feature as unknown as (t: unknown, o: unknown) => unknown;
  const fc = toFeature(topo, topo.objects.countries) as unknown as {
    features: { id: string; geometry: { type: string; coordinates: unknown } }[];
  };
  const ids = COUNTRY_META.map((m) => m.iso2);
  const cent: Record<string, [number, number]> = {};
  const outline: Record<string, Ring> = {};
  for (const f of fc.features) {
    const polys = (
      f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    ) as Ring[][];
    let best = -1;
    let main = polys[0]!;
    const pts: Ring = [];
    for (const poly of polys) {
      const a = geoArea({ type: 'Polygon', coordinates: poly } as never);
      if (a > best) {
        best = a;
        main = poly;
      }
      for (const ring of poly) pts.push(...ring);
    }
    const c = geoCentroid({ type: 'Polygon', coordinates: main } as never);
    cent[f.id] = [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100];
    const step = Math.max(1, Math.floor(pts.length / 400));
    outline[f.id] = pts.filter((_, i) => i % step === 0);
  }
  const R = Math.PI / 180;
  const hav = (a: [number, number], b: [number, number]) => {
    const dLat = (b[1] - a[1]) * R;
    const dLon = (b[0] - a[0]) * R;
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * R) * Math.cos(b[1] * R) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const n = ids.length;
  const dist = new Uint16Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const A = outline[ids[i]!]!;
      const B = outline[ids[j]!]!;
      // Quick reject via centroid distance minus generous radii is not safe for long countries; brute force.
      let best = Infinity;
      for (const p of A)
        for (const q of B) {
          const d = hav(p, q);
          if (d < best) best = d;
        }
      const km = best < 40 ? 0 : Math.min(65535, Math.round(best));
      dist[i * n + j] = km;
      dist[j * n + i] = km;
    }
  const b64 = Buffer.from(dist.buffer).toString('base64');
  writeFileSync(
    new URL('src/games/shared/world/geo-facts.ts', root),
    `/** GENERATED by tools/generate-world.ts from Natural Earth 1:50m. Do not edit. */\n` +
      `/** Country order for BORDER_KM rows/columns (same as meta.ts). */\n` +
      `export const ORDER = ${JSON.stringify(ids)};\n` +
      `/** Centroid [lon, lat] of each country's largest polygon. */\n` +
      `export const CENTROID: Record<string, [number, number]> = ${JSON.stringify(cent)};\n` +
      `/** Shortest border-to-border distance in km (0 = touching), Uint16 row-major, base64. */\n` +
      `export const BORDER_KM_B64 =\n  '${b64}';\n`,
  );
  console.log(`geo facts: ${n} centroids, ${(n * (n - 1)) / 2} border distances`);
}
