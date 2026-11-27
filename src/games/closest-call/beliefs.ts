/**
 * What a computer contestant believes about an answer, without ever looking at it: a normal
 * distribution in log10 space built from *related* facts only.
 * - Normal: the typical value of the question's family (same commodity in other years, same kind
 *   of element property, same kind of world fact), the question's own value left out.
 * - Hard: like an expert — neighbouring years of the same commodity price (y ± 1…3, never y
 *   itself), neighbouring elements in the periodic table (Z ± 1, ± 2) for element properties;
 *   the family prior otherwise.
 * - Easy: the family prior with a wider, noisier spread.
 */
import { greatCircleKm, question, type Bank, type QKey } from '../rough-guess/engine';

export type Level = 'easy' | 'normal' | 'hard';
export interface Belief {
  mean: number;
  sd: number;
}

const ELEMENT_COL = { melting: 4, boiling: 5, density: 6, 'atomic-mass': 7 } as const;

function stats(values: number[]): Belief {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  return { mean, sd: Math.max(0.03, sd) };
}

const distanceCache = new WeakMap<Bank, Belief>();
function distancePrior(bank: Bank): Belief {
  const hit = distanceCache.get(bank);
  if (hit) return hit;
  const c = bank.rough.cities;
  const values: number[] = [];
  for (let i = 0; i < c.length; i += 3)
    for (let j = i + 1; j < c.length; j += 7)
      values.push(
        Math.log10(Math.max(1, greatCircleKm([c[i]![3], c[i]![4]], [c[j]![3], c[j]![4]]))),
      );
  const b = stats(values);
  distanceCache.set(bank, b);
  return b;
}

/** The family prior: typical value and spread of the question's kind, its own value excluded. */
export function familyPrior(bank: Bank, key: QKey): Belief {
  const q = question(bank, key);
  if (q.kind === 'distance') return distancePrior(bank);
  let values: number[];
  if (q.kind === 'price') {
    const ci = Number(key.split(':')[1]);
    values = bank.rough.prices
      .filter((p) => p[0] === ci && p[1] !== q.year)
      .map((p) => Math.log10(p[2]));
  } else if (q.kind in ELEMENT_COL) {
    const col = ELEMENT_COL[q.kind as keyof typeof ELEMENT_COL];
    const own = Number(key.split(':')[1]);
    values = bank.rough.elements
      .filter((e, i) => i !== own && (e[col] as number) > 0)
      .map((e) => Math.log10(e[col] as number));
  } else {
    const own = Number(key.split(':')[1]);
    values = bank.mag.questions
      .filter((m, i) => i !== own && m[1] === q.kind)
      .map((m) => Math.log10(m[2]));
  }
  return stats(values);
}

/** The expert prior used by Hard contestants (falls back to the family prior). */
export function expertPrior(bank: Bank, key: QKey): Belief {
  const q = question(bank, key);
  if (q.kind === 'price') {
    const ci = Number(key.split(':')[1]);
    const near = bank.rough.prices
      .filter((p) => p[0] === ci && p[1] !== q.year && Math.abs(p[1] - q.year) <= 3)
      .map((p) => Math.log10(p[2]));
    if (near.length >= 2) {
      const s = stats(near);
      return { mean: s.mean, sd: Math.max(0.05, s.sd) };
    }
  }
  if (q.kind in ELEMENT_COL) {
    const col = ELEMENT_COL[q.kind as keyof typeof ELEMENT_COL];
    const idx = Number(key.split(':')[1]);
    const z = bank.rough.elements[idx]![3];
    const near = bank.rough.elements
      .filter((e) => e[3] !== z && Math.abs(e[3] - z) <= 2 && (e[col] as number) > 0)
      .map((e) => Math.log10(e[col] as number));
    if (near.length >= 2) {
      const s = stats(near);
      return { mean: s.mean, sd: Math.max(0.08, s.sd) };
    }
  }
  return familyPrior(bank, key);
}

export function belief(bank: Bank, key: QKey, level: Level): Belief {
  if (level === 'hard') return expertPrior(bank, key);
  const f = familyPrior(bank, key);
  return level === 'easy' ? { mean: f.mean, sd: f.sd * 1.6 } : f;
}
