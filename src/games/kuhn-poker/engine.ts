/**
 * Kuhn poker (#091): a three-card deck (Jack, Queen, King), two players, an ante of one chip each,
 * one card each and a single round of betting with bets of one chip:
 *
 * - The first player checks or bets.
 * - After a check, the second player checks (showdown for 2) or bets; facing that bet the first
 *   player folds or calls (showdown for 4).
 * - After a bet, the second player folds or calls (showdown for 4).
 *
 * The higher card wins at showdown. A match: both start with 12 chips, the first player alternates
 * every hand, and the match ends when a player can no longer cover a hand (two chips).
 *
 * Actions: "check", "bet", "call", "fold", "next" (deal the next hand).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const START_CHIPS = 12;
/** The most a hand can cost: the ante and one bet. */
export const HAND_COST = 2;
export const CARD_NAMES = ['J', 'Q', 'K'] as const;

export interface KuhnResult {
  winner: 0 | 1;
  /** Net chips for the winner. */
  won: number;
  showdown: boolean;
}

export interface KuhnState {
  seed: number;
  chips: [number, number];
  handNo: number;
  /** Who acts first this hand. */
  first: 0 | 1;
  /** Cards this hand: 0 Jack, 1 Queen, 2 King. */
  cards: [number, number];
  /** This hand's betting so far, e.g. ['check', 'bet']. */
  betting: string[];
  toAct: 0 | 1 | -1;
  result: KuhnResult | null;
  /** Hands won and chips won per player over the match. */
  history: string[];
  winner: 0 | 1 | null;
}

/** The two cards of a hand, from the seed and the hand number. */
export function dealKuhn(seed: number, handNo: number): [number, number] {
  const deck = new Rng((seed * 7919 + handNo * 104729) >>> 0).shuffle([0, 1, 2]);
  return [deck[0]!, deck[1]!];
}

export function createKuhn(seed: number): KuhnState {
  return {
    seed,
    chips: [START_CHIPS - 1, START_CHIPS - 1],
    handNo: 1,
    first: 0,
    cards: dealKuhn(seed, 1),
    betting: [],
    toAct: 0,
    result: null,
    history: [],
    winner: null,
  };
}

/** Legal actions after a betting sequence (the player to act is implied). */
export function kuhnOptions(betting: readonly string[]): string[] {
  const seq = betting.join(' ');
  if (seq === '') return ['check', 'bet'];
  if (seq === 'check') return ['check', 'bet'];
  if (seq === 'bet' || seq === 'check bet') return ['fold', 'call'];
  return [];
}

/** Whether a betting sequence has ended the hand, and how. */
export function kuhnEnd(betting: readonly string[]): 'fold' | 'showdown' | null {
  const seq = betting.join(' ');
  if (seq === 'check check' || seq === 'bet call' || seq === 'check bet call') return 'showdown';
  if (seq === 'bet fold' || seq === 'check bet fold') return 'fold';
  return null;
}

/** Chips each player has put in after a betting sequence (antes included). */
export function kuhnPot(betting: readonly string[]): number {
  return 2 + betting.filter((a) => a === 'bet' || a === 'call').length;
}

export function legalKuhnActions(s: KuhnState): string[] {
  if (s.winner !== null) return [];
  if (s.result) return ['next'];
  return kuhnOptions(s.betting);
}

function settle(s: KuhnState) {
  const end = kuhnEnd(s.betting);
  if (!end) {
    s.toAct = (s.betting.length % 2 === 0 ? s.first : 1 - s.first) as 0 | 1;
    return;
  }
  const pot = kuhnPot(s.betting);
  let winner: 0 | 1;
  if (end === 'fold') {
    // The player who folded is the one who acted last.
    const folder = ((s.betting.length - 1) % 2 === 0 ? s.first : 1 - s.first) as 0 | 1;
    winner = (1 - folder) as 0 | 1;
  } else winner = s.cards[0] > s.cards[1] ? 0 : 1;
  // Each player's share of the pot: the antes plus their own bets and calls.
  const paid = [1, 1];
  s.betting.forEach((a, k) => {
    if (a === 'bet' || a === 'call') paid[k % 2 === 0 ? s.first : 1 - s.first]!++;
  });
  s.chips[winner] += pot;
  s.result = { winner, won: pot - paid[winner]!, showdown: end === 'showdown' };
  s.toAct = -1;
  // The ante was taken when the hand was dealt; a player who cannot cover another hand loses.
  if (s.chips[0] < HAND_COST) s.winner = 1;
  else if (s.chips[1] < HAND_COST) s.winner = 0;
}

export function applyKuhnAction(s: KuhnState, a: string): KuhnState {
  if (!legalKuhnActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: KuhnState = {
    ...s,
    chips: [...s.chips],
    cards: [...s.cards],
    betting: [...s.betting],
    history: [...s.history, a],
    result: s.result ? { ...s.result } : null,
  };
  if (a === 'next') {
    n.handNo++;
    n.first = (1 - n.first) as 0 | 1;
    n.cards = dealKuhn(n.seed, n.handNo);
    n.betting = [];
    n.result = null;
    n.chips = [n.chips[0] - 1, n.chips[1] - 1];
    n.toAct = n.first;
    return n;
  }
  const player = n.toAct as 0 | 1;
  if (a === 'bet' || a === 'call') n.chips[player]--;
  n.betting.push(a);
  settle(n);
  return n;
}

export function replayKuhn(seed: number, history: readonly string[]): KuhnState {
  return history.reduce((s, a) => applyKuhnAction(s, a), createKuhn(seed));
}

export function isValidKuhnState(data: unknown): data is KuhnState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayKuhn(data.seed, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
