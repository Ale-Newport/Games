/**
 * Runtime country data for the geography games: names (en/es + aliases), facts, typo-tolerant
 * matching, lazily loaded Natural Earth shapes, centroids, distances, bearings and flag images.
 * Pure helpers except `loadShapes` / `flagUrl`, which load assets on demand.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { editDistance, normalize } from '../survey/engine';
import { BORDER_KM_B64, CENTROID, ORDER } from './geo-facts';
import { COUNTRY_META, type Continent, type CountryMeta } from './meta';
import { NAMES } from './names';

export type Lang = 'en' | 'es';

export interface Country extends CountryMeta {
  name: { en: string; es: string };
  /** Normalized accepted keys per language (name + aliases). */
  keys: { en: string[]; es: string[] };
}

export const COUNTRIES: readonly Country[] = COUNTRY_META.map((m) => {
  const [en, es, aliasEn, aliasEs] = NAMES[m.iso2]!;
  return {
    ...m,
    name: { en, es },
    keys: {
      en: [...new Set([en, ...aliasEn].map(normalize))],
      es: [...new Set([es, ...aliasEs].map(normalize))],
    },
  };
});

export const BY_ISO2 = new Map(COUNTRIES.map((c) => [c.iso2, c]));

export function country(iso2: string): Country {
  const c = BY_ISO2.get(iso2);
  if (!c) throw new Error(`Unknown country ${iso2}`);
  return c;
}

export const CONTINENTS: readonly Continent[] = ['af', 'as', 'eu', 'na', 'sa', 'oc'];

/**
 * Finds the country a typed name refers to: exact name/alias in either language, then the unique
 * closest name within a small typo tolerance (none for short inputs). `pool` limits the search.
 */
export function matchCountry(
  input: string,
  lang: Lang,
  pool: readonly Country[] = COUNTRIES,
  fuzzy = true,
): Country | null {
  const key = normalize(input);
  if (key.length < 2) return null;
  for (const l of [lang, lang === 'en' ? 'es' : 'en'] as const) {
    const hit = pool.find((c) => c.keys[l].includes(key));
    if (hit) return hit;
  }
  if (!fuzzy || key.length < 5) return null;
  const tol = key.length >= 9 ? 2 : 1;
  let best = tol + 1;
  let found: Country[] = [];
  for (const c of pool)
    for (const k of c.keys[lang]) {
      if (k.length < 5) continue;
      const d = editDistance(key, k, tol);
      if (d < best) {
        best = d;
        found = [c];
      } else if (d === best && !found.includes(c)) found.push(c);
    }
  return best <= tol && found.length === 1 ? found[0]! : null;
}

/** Same matching for capital cities. */
export function matchCapital(input: string, lang: Lang, pool: readonly Country[]): Country | null {
  const key = normalize(input);
  if (key.length < 2) return null;
  const exact = pool.find(
    (c) => normalize(c.capital.en) === key || normalize(c.capital.es) === key,
  );
  if (exact || key.length < 5) return exact ?? null;
  const tol = key.length >= 9 ? 2 : 1;
  const close = pool.filter((c) =>
    [c.capital[lang], c.capital.en].some((n) => editDistance(key, normalize(n), tol) <= tol),
  );
  return close.length === 1 ? close[0]! : null;
}

// ---------------------------------------------------------------- geometry

const RAD = Math.PI / 180;

/** Great-circle distance in km between two [lon, lat] points. */
export function haversine(a: readonly [number, number], b: readonly [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing in degrees (0 = north, clockwise) from a to b. */
export function bearing(a: readonly [number, number], b: readonly [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
  const x =
    Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
    Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  return (((Math.atan2(y, x) / RAD) % 360) + 360) % 360;
}

const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
export const arrowFor = (deg: number) => ARROWS[Math.round(deg / 45) % 8]!;

export interface Shapes {
  features: Map<string, Feature<Geometry>>;
  collection: FeatureCollection<Geometry>;
  /** Visual centroid per country, [lon, lat]. */
  centroid: Map<string, [number, number]>;
  /** Up to ~200 boundary points per country for border-distance estimates. */
  outline: Map<string, [number, number][]>;
}

let shapesPromise: Promise<Shapes> | null = null;

/** Loads and decodes the Natural Earth 1:50m shapes once. */
export function loadShapes(): Promise<Shapes> {
  shapesPromise ??= (async () => {
    const [{ feature }, { geoCentroid, geoArea }, topo] = await Promise.all([
      import('topojson-client'),
      import('d3-geo'),
      import('./world-50m.json'),
    ]);
    const t = topo.default as unknown as Parameters<typeof feature>[0];
    const collection = feature(
      t,
      (t as unknown as { objects: { countries: Parameters<typeof feature>[1] } }).objects.countries,
    ) as unknown as FeatureCollection<Geometry>;
    const features = new Map<string, Feature<Geometry>>();
    const centroid = new Map<string, [number, number]>();
    const outline = new Map<string, [number, number][]>();
    for (const f of collection.features) {
      const id = String(f.id);
      features.set(id, f);
      // Centroid of the largest polygon, so overseas parts do not pull it into the sea.
      let main: Feature<Geometry> = f;
      const pts: [number, number][] = [];
      if (f.geometry.type === 'MultiPolygon') {
        let bestArea = -1;
        for (const poly of f.geometry.coordinates) {
          const part: Feature<Geometry> = {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: poly },
          };
          const a = geoArea(part);
          if (a > bestArea) {
            bestArea = a;
            main = part;
          }
          for (const ring of poly) for (const p of ring) pts.push(p as [number, number]);
        }
      } else if (f.geometry.type === 'Polygon') {
        for (const ring of f.geometry.coordinates)
          for (const p of ring) pts.push(p as [number, number]);
      }
      centroid.set(id, geoCentroid(main) as [number, number]);
      const step = Math.max(1, Math.floor(pts.length / 200));
      outline.set(
        id,
        pts.filter((_, i) => i % step === 0),
      );
    }
    return { features, collection, centroid, outline };
  })();
  return shapesPromise;
}

/** Approximate shortest distance between two countries' borders in km (0 when they touch). */
export function borderDistance(shapes: Shapes, a: string, b: string): number {
  if (a === b) return 0;
  const pa = shapes.outline.get(a) ?? [];
  const pb = shapes.outline.get(b) ?? [];
  let best = Infinity;
  for (const p of pa) for (const q of pb) best = Math.min(best, haversine(p, q));
  // Sampled outlines miss a little: treat anything within 25 km as touching.
  return best < 25 ? 0 : Math.round(best);
}

// ---------------------------------------------------------------- flags

const FLAGS = import.meta.glob('../../../../node_modules/flag-icons/flags/4x3/*.svg', {
  query: '?url',
  import: 'default',
}) as Record<string, () => Promise<string>>;

/** URL of a country's flag (flag-icons, MIT; the flags themselves are public symbols). */
export async function flagUrl(iso2: string): Promise<string> {
  const key = Object.keys(FLAGS).find((k) => k.endsWith(`/${iso2.toLowerCase()}.svg`));
  if (!key) throw new Error(`No flag for ${iso2}`);
  return FLAGS[key]!();
}

export function continentOf(iso2: string): Continent {
  return country(iso2).continent;
}

// ---------------------------------------------------------------- precomputed distances

const ORDER_INDEX = new Map(ORDER.map((id, i) => [id, i]));
let borderTable: Uint16Array | null = null;

function table(): Uint16Array {
  if (!borderTable) {
    const bin = atob(BORDER_KM_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    borderTable = new Uint16Array(bytes.buffer);
  }
  return borderTable;
}

/** Centroid [lon, lat] of a country's largest polygon (precomputed). */
export function centroidOf(iso2: string): [number, number] {
  const c = CENTROID[iso2];
  if (!c) throw new Error(`No centroid for ${iso2}`);
  return c;
}

/** Great-circle distance between two countries' centroids, in km. */
export function centroidKm(a: string, b: string): number {
  return a === b ? 0 : Math.round(haversine(centroidOf(a), centroidOf(b)));
}

/** Shortest border-to-border distance in km (0 when the countries touch; precomputed). */
export function borderKm(a: string, b: string): number {
  if (a === b) return 0;
  const i = ORDER_INDEX.get(a);
  const j = ORDER_INDEX.get(b);
  if (i === undefined || j === undefined) throw new Error(`Unknown country ${a} or ${b}`);
  return table()[i * ORDER.length + j]!;
}
