/**
 * Clock patience. A shuffled deck is dealt face down into 13 piles of four: one for each hour of a
 * clock (ace at one o'clock … queen at twelve) and the kings' pile in the middle.
 *
 * The first card is turned from the kings' pile. Each turned card is placed face up under the pile
 * of its own hour (kings in the middle), and the next card is turned from that same pile. The game
 * ends when the fourth king is turned up: it is won if every other card is already face up.
 * There are no choices — it is a game of pure chance — but each card must be turned and placed.
 *
 * Moves: "turn" (take the top face-down card of the current pile), "place" (put the card in hand
 * under its hour). Pile index = rank − 1 (12 is the kings' pile).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../shared/cards/cards';

export const KINGS = 12;

export interface ClockState {
  seed: number;
  /** Face-down cards of each pile (top is last). */
  down: number[][];
  /** Face-up cards placed under each pile. */
  up: number[][];
  /** Pile the next card is turned from. */
  current: number;
  hand: number | null;
  history: string[];
  result: 'won' | 'lost' | null;
}

export function dealClock(seed: number): ClockState {
  const deck = shuffledDeck(seed);
  return {
    seed,
    down: Array.from({ length: 13 }, (_, i) => deck.slice(i * 4, i * 4 + 4)),
    up: Array.from({ length: 13 }, () => []),
    current: KINGS,
    hand: null,
    history: [],
    result: null,
  };
}

export const legalClockMoves = (s: ClockState): string[] =>
  s.result ? [] : s.hand === null ? ['turn'] : ['place'];

export const isLegalClockMove = (s: ClockState, m: string) => legalClockMoves(s).includes(m);

export const faceUpCount = (s: ClockState) => s.up.reduce((a, p) => a + p.length, 0);

function shift(n: ClockState, m: string) {
  if (m === 'turn') {
    n.hand = n.down[n.current]!.pop()!;
    return;
  }
  const card = n.hand!;
  const pile = rankOf(card) - 1;
  n.up[pile]!.push(card);
  n.hand = null;
  n.current = pile;
  if (n.up[KINGS]!.length === 4) n.result = faceUpCount(n) === 52 ? 'won' : 'lost';
}

const clone = (s: ClockState): ClockState => ({
  ...s,
  down: s.down.map((p) => p.slice()),
  up: s.up.map((p) => p.slice()),
  history: s.history.slice(),
});

export function applyClockMove(s: ClockState, m: string): ClockState {
  if (!isLegalClockMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
  const n = clone(s);
  n.history.push(m);
  shift(n, m);
  return n;
}

export function replayClock(seed: number, history: readonly string[]): ClockState {
  const s = dealClock(seed);
  for (const m of history) {
    if (!isLegalClockMove(s, m)) throw new IllegalActionError(`Illegal move ${String(m)}`);
    s.history.push(m);
    shift(s, m);
  }
  return s;
}

export function isValidClockState(data: unknown): data is ClockState {
  if (!isRecord(data) || !Array.isArray(data.history) || typeof data.seed !== 'number')
    return false;
  if (!data.history.every((m) => typeof m === 'string')) return false;
  try {
    return (
      JSON.stringify(replayClock(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

/** The outcome of a deal is fixed by the shuffle: true when it comes out. */
export function comesOut(seed: number): boolean {
  let s = dealClock(seed);
  while (!s.result) s = applyClockMove(s, legalClockMoves(s)[0]!);
  return s.result === 'won';
}
