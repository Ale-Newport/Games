/**
 * Word Groups agents. The clusterer reads word meaning from the shared vectors: it submits the
 * four remaining words with the highest average pairwise similarity that it has not tried, the way
 * NLP baselines attack this puzzle. Words the English vectors do not know count as neutral, so it
 * is weak on Spanish puzzles and on wordplay groups — like the baselines.
 */
import { lookup, similarity, type Vectors } from '../shared/semantic/semantic';
import type { GroupsState } from './engine';

export type GroupsAction = `g:${string}`;

export const actionOf = (words: readonly string[]): GroupsAction =>
  `g:${[...words].sort().join('+')}`;
export const wordsOf = (a: GroupsAction) => a.slice(2).split('+');

export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i++) rec(i + 1, [...acc, items[i]!]);
  };
  rec(0, []);
  return out;
}

/** Vector rows for a word (multi-word entries use their known words). */
function rows(v: Vectors, word: string): number[] {
  return word
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => lookup(v, w))
    .filter((x): x is number => x !== null);
}

function pairScore(v: Vectors, a: string, b: string): number {
  const ra = rows(v, a);
  const rb = rows(v, b);
  if (!ra.length || !rb.length) return 0;
  let s = 0;
  for (const x of ra) for (const y of rb) s += similarity(v, x, y);
  return s / (ra.length * rb.length);
}

export function clusterMove(v: Vectors, s: GroupsState): GroupsAction {
  const tried = new Set(s.history.map((h) => actionOf(h)));
  const pair = new Map<string, number>();
  const sc = (a: string, b: string) => {
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    let x = pair.get(k);
    if (x === undefined) {
      x = pairScore(v, a, b);
      pair.set(k, x);
    }
    return x;
  };
  let best: string[] | null = null;
  let bestScore = -Infinity;
  for (const c of combinations(s.board, 4)) {
    const a = actionOf(c);
    if (tried.has(a)) continue;
    const score =
      sc(c[0]!, c[1]!) +
      sc(c[0]!, c[2]!) +
      sc(c[0]!, c[3]!) +
      sc(c[1]!, c[2]!) +
      sc(c[1]!, c[3]!) +
      sc(c[2]!, c[3]!);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return actionOf(best ?? s.board.slice(0, 4));
}
