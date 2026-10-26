/**
 * Spades (#094): four players in two partnerships (seats 0 and 2 against 1 and 3). Every hand: deal
 * 13 cards each, bid, and play 13 tricks with spades always trump.
 *
 * - Bidding: starting left of the dealer, each player bids the number of tricks they expect to take
 *   (0–13); a bid of 0 is **nil**. A partnership's contract is the sum of its non-nil bids.
 * - Play: the player left of the dealer leads; players must follow suit; spades may not be led
 *   until a spade has been played ("broken"), unless the leader holds only spades.
 * - Scoring: a partnership that takes at least its contract scores 10 points per trick bid plus 1
 *   per extra trick (a "bag"); every 10 bags cost 100 points. Falling short scores −10 per trick
 *   bid. A nil scores +100 if that player takes no trick and −100 otherwise; a nil bidder's tricks
 *   count as bags and never toward the partner's contract.
 * - The game ends when a partnership reaches 500 (the higher score wins; a tie plays on) or falls
 *   to −200 (the other partnership wins).
 *
 * Actions: "bid:N", "play:c", "next" (deal the next hand).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { SPADES, shuffledDeck, suitOf } from '../shared/cards/cards';
import { followSuit, trickWinner, type Play } from '../shared/tricks/cards';

export const TARGET = 500;
export const FLOOR = -200;
export const BAG_LIMIT = 10;

export interface SpadesHandResult {
  /** Score change and bags gained for each partnership. */
  points: [number, number];
  bags: [number, number];
  /** Whether each partnership made its contract; whether each nil succeeded (null: no nil). */
  made: [boolean, boolean];
  nil: (boolean | null)[];
}

export interface SpadesState {
  seed: number;
  handNo: number;
  dealer: number;
  /** Partnership scores and bags carried (0: seats 0 and 2, 1: seats 1 and 3). */
  scores: [number, number];
  bags: [number, number];
  hands: number[][];
  phase: 'bid' | 'play' | 'done';
  bids: (number | null)[];
  trick: Play[];
  toAct: number;
  spadesBroken: boolean;
  /** Tricks taken by each seat this hand. */
  tricks: number[];
  played: number;
  lastTrick: Play[] | null;
  /** Suits each seat has shown out of this hand (public). */
  shownOut: number[][];
  result: SpadesHandResult | null;
  history: string[];
  /** The winning partnership, once the game is over. */
  winner: 0 | 1 | null;
}

export const teamOf = (seat: number) => (seat % 2) as 0 | 1;

function deal(s: SpadesState) {
  const deck = shuffledDeck((s.seed * 6151 + s.handNo * 7919) >>> 0);
  s.hands = [0, 1, 2, 3].map((p) => deck.slice(p * 13, p * 13 + 13));
  s.phase = 'bid';
  s.bids = [null, null, null, null];
  s.trick = [];
  s.spadesBroken = false;
  s.tricks = [0, 0, 0, 0];
  s.played = 0;
  s.lastTrick = null;
  s.shownOut = [[], [], [], []];
  s.result = null;
  s.toAct = (s.dealer + 1) % 4;
}

export function createSpades(seed: number): SpadesState {
  const s: SpadesState = {
    seed,
    handNo: 1,
    dealer: 3,
    scores: [0, 0],
    bags: [0, 0],
    hands: [],
    phase: 'bid',
    bids: [],
    trick: [],
    toAct: 0,
    spadesBroken: false,
    tricks: [],
    played: 0,
    lastTrick: null,
    shownOut: [],
    result: null,
    history: [],
    winner: null,
  };
  deal(s);
  return s;
}

/** Cards the seat to act may play. */
export function playableCards(s: SpadesState): number[] {
  const hand = s.hands[s.toAct]!;
  if (s.trick.length === 0) {
    const nonSpades = hand.filter((c) => suitOf(c) !== SPADES);
    return s.spadesBroken || nonSpades.length === 0 ? [...hand] : nonSpades;
  }
  return followSuit(hand, suitOf(s.trick[0]!.card));
}

export function legalSpadesActions(s: SpadesState): string[] {
  if (s.winner !== null) return [];
  if (s.phase === 'done') return ['next'];
  if (s.phase === 'bid') return Array.from({ length: 14 }, (_, n) => `bid:${n}`);
  return playableCards(s).map((c) => `play:${c}`);
}

/** Scores a finished hand for both partnerships. */
export function scoreHand(
  bids: readonly number[],
  tricks: readonly number[],
  bagsBefore: readonly number[],
): SpadesHandResult {
  const points: [number, number] = [0, 0];
  const bags: [number, number] = [0, 0];
  const made: [boolean, boolean] = [false, false];
  const nil = bids.map((b, i) => (b === 0 ? tricks[i] === 0 : null));
  for (const team of [0, 1] as const) {
    const seats = [team, team + 2];
    const contract = seats.reduce((a, i) => a + (bids[i] ?? 0), 0);
    const counted = seats.reduce((a, i) => a + (bids[i] === 0 ? 0 : tricks[i]!), 0);
    const nilTricks = seats.reduce((a, i) => a + (bids[i] === 0 ? tricks[i]! : 0), 0);
    let p = 0;
    let b = nilTricks;
    if (contract > 0) {
      if (counted >= contract) {
        made[team] = true;
        p += 10 * contract + (counted - contract);
        b += counted - contract;
      } else p -= 10 * contract;
    } else {
      made[team] = true;
      b += counted;
    }
    for (const i of seats) if (bids[i] === 0) p += tricks[i] === 0 ? 100 : -100;
    // Every ten bags carried cost 100 points.
    const total = bagsBefore[team]! + b;
    p -= 100 * Math.floor(total / BAG_LIMIT);
    points[team] = p;
    bags[team] = b;
  }
  return { points, bags, made, nil };
}

function endHand(s: SpadesState) {
  const r = scoreHand(s.bids as number[], s.tricks, s.bags);
  s.result = r;
  for (const team of [0, 1] as const) {
    s.scores[team] += r.points[team];
    s.bags[team] = (s.bags[team] + r.bags[team]) % BAG_LIMIT;
  }
  s.phase = 'done';
  s.toAct = -1;
  const [a, b] = s.scores;
  if (a <= FLOOR || b <= FLOOR) s.winner = a > b ? 0 : b > a ? 1 : null;
  else if ((a >= TARGET || b >= TARGET) && a !== b) s.winner = a > b ? 0 : 1;
}

export function applySpadesAction(s: SpadesState, a: string): SpadesState {
  if (!legalSpadesActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: SpadesState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    n.dealer = (n.dealer + 1) % 4;
    deal(n);
    return n;
  }
  if (a.startsWith('bid:')) {
    n.bids[n.toAct] = Number(a.slice(4));
    n.toAct = (n.toAct + 1) % 4;
    if (n.bids.every((b) => b !== null)) {
      n.phase = 'play';
      n.toAct = (n.dealer + 1) % 4;
    }
    return n;
  }
  const card = Number(a.slice(5));
  const seat = n.toAct;
  n.hands[seat] = n.hands[seat]!.filter((c) => c !== card);
  if (n.trick.length) {
    const led = suitOf(n.trick[0]!.card);
    if (suitOf(card) !== led && !n.shownOut[seat]!.includes(led)) n.shownOut[seat]!.push(led);
  }
  n.trick.push({ seat, card });
  if (suitOf(card) === SPADES) n.spadesBroken = true;
  if (n.trick.length < 4) {
    n.toAct = (seat + 1) % 4;
    return n;
  }
  const winner = trickWinner(n.trick, SPADES).seat;
  n.tricks[winner]!++;
  n.lastTrick = n.trick;
  n.trick = [];
  n.played++;
  n.toAct = winner;
  if (n.played === 13) endHand(n);
  return n;
}

export function replaySpades(seed: number, history: readonly string[]): SpadesState {
  return history.reduce((s, a) => applySpadesAction(s, a), createSpades(seed));
}

export function isValidSpadesState(data: unknown): data is SpadesState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replaySpades(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
