/**
 * The #205 World Quiz bank, generated from the shared world data: type the countries of the world
 * or of a continent onto a map, click countries on the map, capitals by country, flags, and the
 * biggest countries by population and area.
 */
import type { LocalizedText } from '../../core/i18n';
import { item, keysOf, type Quiz, type QuizItem } from '../shared/quiz/engine';
import type { Continent } from '../shared/world/meta';
import { NAMES } from '../shared/world/names';
import { COUNTRIES, type Country } from '../shared/world/world';

const L = (en: string, es: string): LocalizedText => ({ en, es });

/** Dependent territories in the shape set that are not counted as countries. */
export const NON_SOVEREIGN = new Set(['GL', 'PR', 'EH']);
export const SOVEREIGN: readonly Country[] = COUNTRIES.filter((c) => !NON_SOVEREIGN.has(c.iso2));

export function countryItem(c: Country, extra: Partial<QuizItem> = {}): QuizItem {
  const [en, es, aliasEn, aliasEs] = NAMES[c.iso2]!;
  return {
    display: { en, es },
    keys: keysOf({ en: [en, ...aliasEn], es: [es, ...aliasEs] }),
    iso2: c.iso2,
    ...extra,
  };
}

const CONTINENT_NAMES: Record<Continent, LocalizedText> = {
  eu: L('Europe', 'Europa'),
  as: L('Asia', 'Asia'),
  af: L('Africa', 'África'),
  na: L('North America', 'América del Norte'),
  sa: L('South America', 'América del Sur'),
  oc: L('Oceania', 'Oceanía'),
};

const byName = (lang: 'en' | 'es') => (a: Country, b: Country) =>
  a.name[lang].localeCompare(b.name[lang], lang);
const of = (cs: Continent[]) =>
  SOVEREIGN.filter((c) => cs.includes(c.continent)).sort(byName('en'));

function mapType(id: string, cs: Continent[], title: LocalizedText, seconds: number): Quiz {
  const list = cs.length === 6 ? [...SOVEREIGN].sort(byName('en')) : of(cs);
  return {
    id,
    category: 'countries',
    format: 'map-type',
    title,
    description: L(
      `Type the ${list.length} countries; each one lights up on the map.`,
      `Escribe los ${list.length} países; cada uno se ilumina en el mapa.`,
    ),
    seconds,
    region: cs.length === 6 ? undefined : cs,
    items: list.map((c) => countryItem(c)),
  };
}

function mapClick(id: string, cs: Continent[], title: LocalizedText, seconds: number): Quiz {
  const list = of(cs);
  return {
    id,
    category: 'map',
    format: 'map-click',
    title,
    description: L(
      `Click each of the ${list.length} countries as it is named.`,
      `Haz clic en cada uno de los ${list.length} países cuando se nombre.`,
    ),
    seconds,
    region: cs,
    items: list.map((c) => countryItem(c)),
  };
}

/** Extra accepted capital names (common short forms and co-capitals). */
const CAPITAL_ALIASES: Record<string, string[]> = {
  US: ['washington', 'washington dc'],
  MX: ['mexico city', 'mexico', 'cdmx', 'ciudad de mexico'],
  KW: ['kuwait'],
  GT: ['guatemala'],
  PA: ['panama'],
  VA: ['vatican'],
  LK: ['kotte', 'sri jayewardenepura kotte'],
  BO: ['la paz'],
  ZA: ['cape town', 'bloemfontein', 'ciudad del cabo'],
  MY: ['putrajaya'],
  BJ: ['porto novo'],
  CI: ['yamoussoukro', 'yamusukro'],
  NL: ['the hague', 'la haya'],
  IL: ['jerusalem', 'jerusalen'],
  PS: ['ramallah', 'east jerusalem'],
  SG: ['singapore', 'singapur'],
  MC: ['monaco', 'monaco city'],
  LU: ['luxembourg city', 'ciudad de luxemburgo'],
  UA: ['kiev', 'kyiv'],
  KZ: ['nur sultan', 'astana'],
  MM: ['nay pyi taw', 'naypyitaw', 'rangoon', 'yangon'],
  CH: ['bern', 'berne', 'berna'],
};

function capitals(id: string, cs: Continent[], title: LocalizedText, seconds: number): Quiz {
  const list = of(cs);
  return {
    id,
    category: 'capitals',
    format: 'type',
    title,
    description: L(
      `Name the capital of each of the ${list.length} countries.`,
      `Nombra la capital de cada uno de los ${list.length} países.`,
    ),
    seconds,
    columns: { hint: L('Country', 'País'), answer: L('Capital', 'Capital') },
    items: list.map((c) => {
      const extra = CAPITAL_ALIASES[c.iso2] ?? [];
      const it = item(
        `${[c.capital.en, ...extra].join('/')}|${[c.capital.es, ...extra].join('/')}`,
        c.name,
        {
          iso2: c.iso2,
        },
      );
      return { ...it, display: { en: c.capital.en, es: c.capital.es } };
    }),
  };
}

function flags(id: string, cs: Continent[], title: LocalizedText, seconds: number): Quiz {
  const list = cs.length === 6 ? [...SOVEREIGN] : of(cs);
  return {
    id,
    category: 'flags',
    format: 'slideshow',
    shuffle: true,
    title,
    description: L(
      `Name the country of each of ${list.length} flags.`,
      `Nombra el país de cada una de las ${list.length} banderas.`,
    ),
    seconds,
    items: list.map((c) => countryItem(c, { picture: { kind: 'flag', iso2: c.iso2 } })),
  };
}

function ranked(
  id: string,
  key: 'population' | 'area',
  n: number,
  title: LocalizedText,
  seconds: number,
): Quiz {
  const list = [...SOVEREIGN].sort((a, b) => b[key] - a[key]).slice(0, n);
  const fmt = (c: Country) =>
    key === 'population'
      ? L(
          `#${list.indexOf(c) + 1} · ${(c.population / 1000).toFixed(0)} M`,
          `#${list.indexOf(c) + 1} · ${(c.population / 1000).toFixed(0)} M`,
        )
      : L(
          `#${list.indexOf(c) + 1} · ${(c.area / 1e6).toFixed(2)} M km²`,
          `#${list.indexOf(c) + 1} · ${(c.area / 1e6).toFixed(2)} M km²`,
        );
  return {
    id,
    category: 'rankings',
    format: 'type',
    title,
    description: L(
      `Name the top ${n}; their ranks and figures are the clues.`,
      `Nombra los ${n} primeros; los puestos y las cifras son las pistas.`,
    ),
    seconds,
    columns: { hint: L('Rank', 'Puesto'), answer: L('Country', 'País') },
    items: list.map((c) => countryItem(c, { hint: fmt(c) })),
  };
}

const ALL: Continent[] = ['eu', 'as', 'af', 'na', 'sa', 'oc'];

export const QUIZZES: Quiz[] = [
  mapType('countries-world', ALL, L('Countries of the world', 'Países del mundo'), 15 * 60),
  ...(['eu', 'as', 'af', 'na', 'sa', 'oc'] as Continent[]).map((c) =>
    mapType(
      `countries-${c}`,
      [c],
      L(`Countries of ${CONTINENT_NAMES[c].en}`, `Países de ${CONTINENT_NAMES[c].es}`),
      c === 'sa' ? 2 * 60 : c === 'oc' ? 2 * 60 : 6 * 60,
    ),
  ),
  mapClick(
    'click-eu',
    ['eu'],
    L('Click the countries of Europe', 'Haz clic en los países de Europa'),
    5 * 60,
  ),
  mapClick(
    'click-af',
    ['af'],
    L('Click the countries of Africa', 'Haz clic en los países de África'),
    6 * 60,
  ),
  mapClick(
    'click-as',
    ['as'],
    L('Click the countries of Asia', 'Haz clic en los países de Asia'),
    6 * 60,
  ),
  mapClick(
    'click-americas',
    ['na', 'sa'],
    L('Click the countries of the Americas', 'Haz clic en los países de América'),
    5 * 60,
  ),
  capitals('capitals-eu', ['eu'], L('Capitals of Europe', 'Capitales de Europa'), 6 * 60),
  capitals('capitals-as', ['as'], L('Capitals of Asia', 'Capitales de Asia'), 6 * 60),
  capitals('capitals-af', ['af'], L('Capitals of Africa', 'Capitales de África'), 7 * 60),
  capitals(
    'capitals-americas',
    ['na', 'sa'],
    L('Capitals of the Americas', 'Capitales de América'),
    5 * 60,
  ),
  capitals('capitals-oc', ['oc'], L('Capitals of Oceania', 'Capitales de Oceanía'), 2 * 60),
  flags('flags-world', ALL, L('Flags of the world', 'Banderas del mundo'), 15 * 60),
  flags('flags-eu', ['eu'], L('Flags of Europe', 'Banderas de Europa'), 5 * 60),
  flags('flags-americas', ['na', 'sa'], L('Flags of the Americas', 'Banderas de América'), 4 * 60),
  ranked(
    'top-population',
    'population',
    25,
    L('Most populous countries', 'Países más poblados'),
    4 * 60,
  ),
  ranked(
    'top-area',
    'area',
    20,
    L('Largest countries by area', 'Países más grandes por superficie'),
    4 * 60,
  ),
];
