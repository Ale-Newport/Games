/**
 * The computer's placements: for each mystery country, find the visible countries most similar
 * to it on *other* indicators in the same year (never the two plotted ones), and place it at the
 * average position of its five nearest neighbours. Honest inference — like reasoning “it is a
 * lot like these countries, so it should sit near them”.
 */
import { INDICATORS } from '../shared/stats/indicators';
import type { StatsData } from '../shared/stats/stats';
import { layout, norm, PAIRS, valueOf, type Chart } from './engine';

const K = 5;

/** Feature value (log for money and counts, so ratios matter rather than raw differences). */
function feature(data: StatsData, code: string, ent: number, year: number): number | null {
  const v = valueOf(data, code, ent, year);
  if (v === null) return null;
  const ind = INDICATORS.find((i) => i.code === code)!;
  if (ind.format === 'money' || ind.format === 'count') return v > 0 ? Math.log10(v) : null;
  return v;
}

export function computerPlacements(data: StatsData, c: Chart): [number, number][] {
  const pair = PAIRS[c.pair]!;
  const l = layout(data, c);
  const context = l.points.filter((p) => !c.targets.includes(p.ent));
  const codes = INDICATORS.map((i) => i.code).filter((code) => code !== pair.x && code !== pair.y);
  // Standardise each feature over the visible countries.
  const stats = new Map<string, { mean: number; sd: number }>();
  for (const code of codes) {
    const vals = context
      .map((p) => feature(data, code, p.ent, c.year))
      .filter((v): v is number => v !== null);
    if (vals.length < 20) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
    stats.set(code, { mean, sd });
  }
  const centroid: [number, number] = [
    context.reduce((a, p) => a + norm(p.x, l.x), 0) / context.length,
    context.reduce((a, p) => a + norm(p.y, l.y), 0) / context.length,
  ];
  return c.targets.map((t) => {
    const mine = new Map<string, number>();
    for (const code of stats.keys()) {
      const v = feature(data, code, t, c.year);
      if (v !== null) mine.set(code, v);
    }
    if (mine.size < 3) return centroid;
    const scored = context
      .map((p) => {
        let sum = 0;
        let n = 0;
        for (const [code, v] of mine) {
          const o = feature(data, code, p.ent, c.year);
          if (o === null) continue;
          const s = stats.get(code)!;
          sum += ((v - o) / s.sd) ** 2;
          n++;
        }
        return { p, d: n >= 3 ? Math.sqrt(sum / n) : Infinity };
      })
      .filter((x) => Number.isFinite(x.d))
      .sort((a, b) => a.d - b.d)
      .slice(0, K);
    if (!scored.length) return centroid;
    const nx = scored.reduce((a, x) => a + norm(x.p.x, l.x), 0) / scored.length;
    const ny = scored.reduce((a, x) => a + norm(x.p.y, l.y), 0) / scored.length;
    return [Math.min(1, Math.max(0, nx)), Math.min(1, Math.max(0, ny))];
  });
}

/** The visible countries' centroid for every target (the know-nothing baseline). */
export function centroidPlacements(data: StatsData, c: Chart): [number, number][] {
  const l = layout(data, c);
  const context = l.points.filter((p) => !c.targets.includes(p.ent));
  const cx = context.reduce((a, p) => a + norm(p.x, l.x), 0) / context.length;
  const cy = context.reduce((a, p) => a + norm(p.y, l.y), 0) / context.length;
  return c.targets.map(() => [cx, cy]);
}
