/**
 * Take-away games on heaps of counters (catalog #041 Nim, #042 Misère Nim, #043 Wythoff's Game,
 * #044 Subtraction Game). A move removes counters from one heap — any positive number, or only an
 * allowed amount — and in Wythoff's game it may instead remove the same number from both heaps.
 * Normal play: whoever takes the last counter wins. Misère: whoever takes the last counter loses.
 * Every move removes at least one counter, so games always end and there are no draws.
 *
 * Actions: "2:3" (take 3 from heap 2) or "b:4" (Wythoff: take 4 from both heaps).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { Rng } from '../../../core/game-engine/random';
import { isRecord } from '../../../core/persistence/versioned';

export interface HeapsVariant {
  id: string;
  /** Last counter loses instead of wins. */
  misere: boolean;
  /** Wythoff's extra move: the same amount from both heaps. */
  both: boolean;
  /** Allowed amounts per move; undefined = any positive number. */
  takes?: readonly number[];
  /** Starting heaps for a seed (rounds draw a fresh setup). */
  setup: (rng: Rng) => number[];
}

export interface HeapsState {
  start: number[];
  heaps: number[];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

export const NIM: HeapsVariant = {
  id: 'nim',
  misere: false,
  both: false,
  setup: (rng) => Array.from({ length: rng.range(3, 5) }, () => rng.range(1, 9)),
};

export const MISERE_NIM: HeapsVariant = { ...NIM, id: 'misere-nim', misere: true };

export const WYTHOFF: HeapsVariant = {
  id: 'wythoff',
  misere: false,
  both: true,
  setup: (rng) => [rng.range(4, 15), rng.range(4, 15)],
};

export const SUBTRACTION: HeapsVariant = {
  id: 'subtraction',
  misere: false,
  both: false,
  takes: [1, 2, 3],
  setup: (rng) => [rng.range(15, 30)],
};

export function createHeapsState(start: readonly number[], first: 0 | 1 = 0): HeapsState {
  return { start: [...start], heaps: [...start], first, toMove: first, history: [], result: null };
}

/** Amounts that may be taken from a heap of `n`. */
export function amounts(v: HeapsVariant, n: number): number[] {
  if (v.takes) return v.takes.filter((k) => k <= n);
  return Array.from({ length: n }, (_, i) => i + 1);
}

export function legalHeapsActions(v: HeapsVariant, s: HeapsState): string[] {
  if (s.result) return [];
  const out: string[] = [];
  s.heaps.forEach((n, h) => {
    for (const k of amounts(v, n)) out.push(`${h}:${k}`);
  });
  if (v.both && s.heaps.length === 2)
    for (let k = 1; k <= Math.min(s.heaps[0]!, s.heaps[1]!); k++) out.push(`b:${k}`);
  return out;
}

/** Heaps after an action (no legality check). */
export function takeFrom(heaps: readonly number[], a: string): number[] {
  const [where, amount] = a.split(':');
  const k = Number(amount);
  const next = heaps.slice();
  if (where === 'b') {
    next[0]! -= k;
    next[1]! -= k;
  } else next[Number(where)]! -= k;
  return next;
}

export function applyHeapsAction(v: HeapsVariant, s: HeapsState, a: string): HeapsState {
  if (s.result || !legalHeapsActions(v, s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const heaps = takeFrom(s.heaps, a);
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  const done = heaps.every((n) => n === 0);
  return {
    ...s,
    heaps,
    toMove,
    history: [...s.history, a],
    result: done ? { winner: v.misere ? toMove : me } : null,
  };
}

export function replayHeaps(
  v: HeapsVariant,
  start: readonly number[],
  first: 0 | 1,
  history: readonly string[],
): HeapsState {
  return history.reduce((s, a) => applyHeapsAction(v, s, a), createHeapsState(start, first));
}

export const setupFor = (v: HeapsVariant, seed: number) => v.setup(new Rng(seed));

export function isValidHeapsState(v: HeapsVariant, data: unknown): data is HeapsState {
  if (!isRecord(data) || !Array.isArray(data.history) || !Array.isArray(data.start)) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.start.every((n) => Number.isInteger(n) && n >= 0 && n <= 99)) return false;
  if (data.start.length === 0 || data.start.length > 8) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replayHeaps(v, data.start as number[], data.first, data.history as string[]);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
