/**
 * Real statistical time series for the data games (World Bank World Development Indicators,
 * CC BY 4.0), built by tools/generate-stats.ts into `wdi.json`: for every indicator × country or
 * region, the most recent run of consecutive reported years (≥ 20). Pure helpers only — the JSON
 * is loaded lazily (`loadStats`) by the games and statically by their AI adapters.
 */
import { INDICATOR_BY_CODE, INDICATORS, type Indicator, type StatTopic } from './indicators';

export interface StatsData {
  source: string;
  /** Date the World Bank last updated the downloaded indicators (YYYY-MM-DD). */
  updated: string;
  /** Indicator codes, in the order the series refer to them. */
  indicators: string[];
  /** [ISO3, ISO2, English name, Spanish name, 1 if a region/income aggregate]. */
  entities: [string, string, string, string, 0 | 1][];
  /** [indicator index, entity index, first year, values for consecutive years]. */
  series: [number, number, number, number[]][];
}

export interface Entity {
  iso3: string;
  iso2: string;
  name: { en: string; es: string };
  aggregate: boolean;
}

export interface Series {
  index: number;
  indicator: Indicator;
  entity: Entity;
  start: number;
  values: number[];
}

export const loadStats = (): Promise<StatsData> =>
  import('./wdi.json').then((m) => m.default as unknown as StatsData);

export function entityAt(data: StatsData, i: number): Entity {
  const [iso3, iso2, en, es, agg] = data.entities[i]!;
  return { iso3, iso2, name: { en, es }, aggregate: agg === 1 };
}

export function seriesAt(data: StatsData, i: number): Series {
  const [ind, ent, start, values] = data.series[i]!;
  const indicator = INDICATOR_BY_CODE.get(data.indicators[ind]!);
  if (!indicator) throw new Error(`Unknown indicator ${data.indicators[ind]}`);
  return { index: i, indicator, entity: entityAt(data, ent), start, values };
}

/** Indices of the series matching a filter (cached per data object and key). */
const cache = new WeakMap<StatsData, Map<string, number[]>>();
export function seriesWhere(
  data: StatsData,
  key: string,
  keep: (indicator: Indicator, length: number) => boolean,
): number[] {
  let m = cache.get(data);
  if (!m) cache.set(data, (m = new Map()));
  const hit = m.get(key);
  if (hit) return hit;
  const inds = data.indicators.map((c) => INDICATOR_BY_CODE.get(c)!);
  const out: number[] = [];
  data.series.forEach(([ind, , , values], i) => {
    if (keep(inds[ind]!, values.length)) out.push(i);
  });
  m.set(key, out);
  return out;
}

export const topicOf = (s: Series): StatTopic => s.indicator.topic;
export { INDICATORS };

/** Source line and the official page of the indicator for one country. */
export function sourceUrl(s: Series): string {
  const loc =
    s.entity.iso2 && /^[A-Z0-9]{2}$/.test(s.entity.iso2) ? `?locations=${s.entity.iso2}` : '';
  return `https://data.worldbank.org/indicator/${s.indicator.code}${loc}`;
}

/** A value with its unit, compact for big numbers ("$1.2 bn", "45.3 %", "8.1 M"). */
export function formatValue(v: number, ind: Indicator, locale: string, short = false): string {
  const abs = Math.abs(v);
  const digits = short ? 2 : 3;
  const compact = abs >= 10_000;
  const nf = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumSignificantDigits: compact ? digits : undefined,
    maximumFractionDigits: compact ? undefined : abs >= 100 ? 0 : abs >= 10 ? 1 : 2,
  });
  const n = nf.format(v);
  switch (ind.format) {
    case 'pct':
      return `${n} %`;
    case 'money':
      return v < 0 ? `−$${nf.format(-v)}` : `$${n}`;
    default:
      return n;
  }
}

/** "Nice" axis ticks (1, 2, 2.5, 5 × 10^k steps) covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? 10 * mag;
  const first = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = first; v <= hi + step * 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

/** Extends [lo, hi] outwards to the nearest multiples of a nice step. */
export function niceRange(lo: number, hi: number, target = 5): [number, number] {
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const ticks = niceTicks(lo, hi, target);
  const step = ticks.length > 1 ? ticks[1]! - ticks[0]! : (hi - lo) / target;
  return [Math.floor(lo / step + 1e-9) * step, Math.ceil(hi / step - 1e-9) * step];
}
