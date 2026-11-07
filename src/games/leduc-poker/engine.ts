/**
 * Leduc poker (#092): a six-card deck (two jacks, two queens, two kings), two players, an ante of
 * one chip each and one private card each, then two betting rounds around one public card:
 *
 * - Round 1 (before the public card): bets and raises of 2 chips; round 2: of 4 chips.
 * - In each round a player checks or bets; facing a bet, folds, calls or raises; facing a raise,
 *   folds or calls (at most a bet and one raise a round).
 * - Showdown: a private card that pairs the public card wins; otherwise the higher private card;
 *   equal ranks split the pot.
 *
 * A match: both start with 50 chips, the first player alternates every hand, and the match ends
 * when a player can no longer cover a hand (13 chips: the ante, 2 + 2 and 4 + 4).
 *
 * Actions: "check", "bet", "call", "raise", "fold", "next" (deal the next hand).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const START_CHIPS = 50;
export const HAND_COST = 13;
export const BET_SIZES = [2, 4] as const;
/** Card 0–5: rank ⌊c/2⌋ (0 jack, 1 queen, 2 king), suit c % 2. */
export const rankOf = (c: number) => Math.floor(c / 2);

export interface LeducResult {
  /** Null when equal hands split the pot. */
  winner: 0 | 1 | null;
  won: number;
  showdown: boolean;
}

export interface LeducState {
  seed: number;
  chips: [number, number];
  handNo: number;
  first: 0 | 1;
  /** Private cards, then the public card (dealt face down until round 2). */
  cards: [number, number, number];
  round: 0 | 1;
  /** Betting in each round. */
  betting: [string[], string[]];
  /** Chips each player has put in this hand (antes included). */
  paid: [number, number];
  toAct: 0 | 1 | -1;
  result: LeducResult | null;
  history: string[];
  winner: 0 | 1 | null;
}

export function dealLeduc(seed: number, handNo: number): [number, number, number] {
  const deck = new Rng((seed * 7919 + handNo * 104729) >>> 0).shuffle([0, 1, 2, 3, 4, 5]);
  return [deck[0]!, deck[1]!, deck[2]!];
}

/** Legal actions after a round's betting so far. */
export function leducOptions(round: readonly string[]): string[] {
  const seq = round.join(' ');
  if (seq === '' || seq === 'check') return ['check', 'bet'];
  if (seq === 'bet' || seq === 'check bet') return ['fold', 'call', 'raise'];
  if (seq === 'bet raise' || seq === 'check bet raise') return ['fold', 'call'];
  return [];
}

/** How a round's betting ended, if it did. */
export function roundEnd(round: readonly string[]): 'fold' | 'done' | null {
  const last = round[round.length - 1];
  if (last === 'fold') return 'fold';
  if (last === 'call' || round.join(' ') === 'check check') return 'done';
  return null;
}

/** Showdown strength: a pair with the public card beats any unpaired rank. */
export const leducStrength = (card: number, pub: number) =>
  rankOf(card) === rankOf(pub) ? 10 + rankOf(card) : rankOf(card);

export function createLeduc(seed: number): LeducState {
  return {
    seed,
    chips: [START_CHIPS - 1, START_CHIPS - 1],
    handNo: 1,
    first: 0,
    cards: dealLeduc(seed, 1),
    round: 0,
    betting: [[], []],
    paid: [1, 1],
    toAct: 0,
    result: null,
    history: [],
    winner: null,
  };
}

export function legalLeducActions(s: LeducState): string[] {
  if (s.winner !== null) return [];
  if (s.result) return ['next'];
  return leducOptions(s.betting[s.round]);
}

/** Who acts k-th in a round: the first player opens both rounds. */
const actor = (s: LeducState, k: number) => (k % 2 === 0 ? s.first : 1 - s.first) as 0 | 1;

function finish(s: LeducState, winner: 0 | 1 | null, showdown: boolean) {
  const pot = s.paid[0] + s.paid[1];
  if (winner === null) {
    s.chips[0] += pot / 2;
    s.chips[1] += pot / 2;
    s.result = { winner: null, won: 0, showdown };
  } else {
    s.chips[winner] += pot;
    s.result = { winner, won: pot - s.paid[winner], showdown };
  }
  s.toAct = -1;
  if (s.chips[0] < HAND_COST) s.winner = 1;
  else if (s.chips[1] < HAND_COST) s.winner = 0;
}

export function applyLeducAction(s: LeducState, a: string): LeducState {
  if (!legalLeducActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: LeducState = {
    ...s,
    chips: [...s.chips],
    cards: [...s.cards],
    betting: [[...s.betting[0]], [...s.betting[1]]],
    paid: [...s.paid],
    result: s.result ? { ...s.result } : null,
    history: [...s.history, a],
  };
  if (a === 'next') {
    n.handNo++;
    n.first = (1 - n.first) as 0 | 1;
    n.cards = dealLeduc(n.seed, n.handNo);
    n.round = 0;
    n.betting = [[], []];
    n.paid = [1, 1];
    n.chips = [n.chips[0] - 1, n.chips[1] - 1];
    n.result = null;
    n.toAct = n.first;
    return n;
  }
  const p = n.toAct as 0 | 1;
  const other = (1 - p) as 0 | 1;
  const size = BET_SIZES[n.round];
  const owe = n.paid[other] - n.paid[p];
  const put = a === 'call' ? owe : a === 'bet' ? size : a === 'raise' ? owe + size : 0;
  n.paid[p] += put;
  n.chips[p] -= put;
  const round = n.betting[n.round];
  round.push(a);
  const end = roundEnd(round);
  if (end === 'fold') finish(n, other, false);
  else if (end === 'done' && n.round === 0) {
    n.round = 1;
    n.toAct = n.first;
  } else if (end === 'done') {
    const [a0, a1] = [leducStrength(n.cards[0], n.cards[2]), leducStrength(n.cards[1], n.cards[2])];
    finish(n, a0 > a1 ? 0 : a1 > a0 ? 1 : null, true);
  } else n.toAct = actor(n, round.length);
  return n;
}

export function replayLeduc(seed: number, history: readonly string[]): LeducState {
  return history.reduce((s, a) => applyLeducAction(s, a), createLeduc(seed));
}

export function isValidLeducState(data: unknown): data is LeducState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayLeduc(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
