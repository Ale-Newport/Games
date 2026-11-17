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
