/**
 * Hand shapes: winning decompositions (four sets and a pair, seven pairs, thirteen orphans),
 * shanten (how many tiles from ready) and waits. Counts are arrays of 34 kinds.
 */
import { KINDS, YAOCHU } from './tiles';

export type Group = { type: 'chi' | 'pon'; kind: number };
export interface Decomposition {
  pair: number;
  sets: Group[];
}

/** Every way to split closed counts into `need` sets and one pair. */
export function decompositions(counts: readonly number[], need: number): Decomposition[] {
  const out: Decomposition[] = [];
  const c = [...counts];
  const sets: Group[] = [];
  const rec = (from: number, pair: number) => {
    let i = from;
    while (i < KINDS && c[i] === 0) i++;
    if (i === KINDS) {
      if (pair >= 0 && sets.length === need) out.push({ pair, sets: [...sets] });
      return;
    }
    if (pair < 0 && c[i]! >= 2) {
      c[i]! -= 2;
      rec(i, i);
      c[i]! += 2;
    }
    if (c[i]! >= 3) {
      c[i]! -= 3;
      sets.push({ type: 'pon', kind: i });
      rec(i, pair);
      sets.pop();
      c[i]! += 3;
    }
    if (i < 27 && i % 9 <= 6 && c[i + 1]! > 0 && c[i + 2]! > 0) {
      c[i]!--;
      c[i + 1]!--;
      c[i + 2]!--;
      sets.push({ type: 'chi', kind: i });
      rec(i, pair);
      sets.pop();
      c[i]!++;
      c[i + 1]!++;
      c[i + 2]!++;
    }
  };
  rec(0, -1);
  return out;
}

export const isSevenPairs = (c: readonly number[]) => c.filter((x) => x === 2).length === 7;
export const isThirteenOrphans = (c: readonly number[]) =>
  YAOCHU.every((k) => c[k]! >= 1) &&
  YAOCHU.some((k) => c[k] === 2) &&
  c.reduce((a, b) => a + b, 0) === 14;

/** Whether closed counts (with `melds` open or concealed sets already made) form a winning shape. */
export function isComplete(c: readonly number[], melds: number): boolean {
  if (melds === 0 && (isSevenPairs(c) || isThirteenOrphans(c))) return true;
  return decompositions(c, 4 - melds).length > 0;
}

type Options = [number, number][];

/** Every (sets, partials) a suit (or the honours) can be split into, without and with a pair; memoized. */
const groupMemo = new Map<string, [Options, Options]>();
function groupOptions(c: number[], runs: boolean): [Options, Options] {
  const key = (runs ? 's' : 'h') + c.join('');
  const hit = groupMemo.get(key);
  if (hit) return hit;
  const found: [Set<number>, Set<number>] = [new Set(), new Set()];
  const n = c.length;
  const rec = (from: number, sets: number, partials: number, pair: number) => {
    let i = from;
    while (i < n && c[i] === 0) i++;
    if (i === n) {
      found[pair]!.add(sets * 16 + partials);
      return;
    }
    if (c[i]! >= 3) {
      c[i]! -= 3;
      rec(i, sets + 1, partials, pair);
      c[i]! += 3;
    }
    if (runs && i <= n - 3 && c[i + 1]! > 0 && c[i + 2]! > 0) {
      c[i]!--;
      c[i + 1]!--;
      c[i + 2]!--;
      rec(i, sets + 1, partials, pair);
      c[i]!++;
      c[i + 1]!++;
      c[i + 2]!++;
    }
    if (c[i]! >= 2) {
      c[i]! -= 2;
      if (!pair) rec(i, sets, partials, 1);
      rec(i, sets, partials + 1, pair);
      c[i]! += 2;
    }
    if (runs && i <= n - 2 && c[i + 1]! > 0) {
      c[i]!--;
      c[i + 1]!--;
      rec(i, sets, partials + 1, pair);
      c[i]!++;
      c[i + 1]!++;
    }
    if (runs && i <= n - 3 && c[i + 2]! > 0) {
      c[i]!--;
      c[i + 2]!--;
      rec(i, sets, partials + 1, pair);
      c[i]!++;
      c[i + 2]!++;
    }
    c[i]!--;
    rec(i, sets, partials, pair);
    c[i]!++;
  };
  rec(0, 0, 0, 0);
  // Keep only the options no other option beats on both counts.
  const frontier = (codes: Set<number>): Options => {
    const all = [...codes].map((x): [number, number] => [x >> 4, x & 15]);
    return all.filter(
      ([m, p]) => !all.some(([m2, p2]) => m2 >= m && p2 >= p && (m2 > m || p2 > p)),
    );
  };
  const out: [Options, Options] = [frontier(found[0]), frontier(found[1])];
  groupMemo.set(key, out);
  return out;
}

/** Regular-hand shanten (−1 = complete) for closed counts with `melds` sets already made. */
function regularShanten(counts: readonly number[], melds: number): number {
  const groups = [
    groupOptions(counts.slice(0, 9), true),
    groupOptions(counts.slice(9, 18), true),
    groupOptions(counts.slice(18, 27), true),
    groupOptions(counts.slice(27, 34), false),
  ];
  let best = 8;
  const rec = (g: number, sets: number, partials: number, pair: number) => {
    if (g === 4) {
      const s = sets + melds;
      best = Math.min(best, 8 - 2 * s - Math.min(partials, 4 - s) - pair);
      return;
    }
    for (const [m, p] of groups[g]![0]) rec(g + 1, sets + m, partials + p, pair);
    if (!pair) for (const [m, p] of groups[g]![1]) rec(g + 1, sets + m, partials + p, 1);
  };
  rec(0, 0, 0, 0);
  return best;
}

/** Shanten over the three shapes (seven pairs and thirteen orphans only with a closed hand). */
export function shanten(counts: readonly number[], melds: number): number {
  let s = regularShanten(counts, melds);
  if (melds === 0) {
    const pairs = counts.filter((x) => x >= 2).length;
    const kinds = counts.filter((x) => x >= 1).length;
    s = Math.min(s, 6 - pairs + Math.max(0, 7 - kinds));
    const orphans = YAOCHU.filter((k) => counts[k]! >= 1).length;
    const orphanPair = YAOCHU.some((k) => counts[k]! >= 2) ? 1 : 0;
    s = Math.min(s, 13 - orphans - orphanPair);
  }
  return s;
}

/** The kinds that would complete a 13-tile (or 13 − 3·melds) hand. */
export function waits(counts: readonly number[], melds: number): number[] {
  const out: number[] = [];
  const c = [...counts];
  for (let k = 0; k < KINDS; k++) {
    if (c[k]! >= 4) continue;
    c[k]!++;
    if (isComplete(c, melds)) out.push(k);
    c[k]!--;
  }
  return out;
}
