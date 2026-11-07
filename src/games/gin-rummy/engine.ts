/**
 * Gin rummy (#096) for two players. Each hand: ten cards each, the next card face up starts the
 * discard pile; the non-dealer plays first. A turn: draw the top of the stock or of the discard
 * pile, then discard one card (not the card just taken from the discard pile). Instead of
 * discarding normally a player may **knock** — discard and lay down — when the hand's deadwood
 * (cards outside melds; ace 1, face cards 10) is 10 or less.
 *
 * - **Gin** (no deadwood): 25 points plus the opponent's deadwood; no lay-offs.
 * - **Knock**: the defender lays off deadwood onto the knocker's melds; the knocker scores the
 *   difference in deadwood — unless the defender's is equal or lower (an **undercut**): the
 *   defender scores 25 plus the difference.
 * - When only two cards are left in the stock without a knock, the hand is void.
 * - The first to 100 points wins the match; the loser of a hand deals the next.
 *
 * Actions: "draw:stock", "draw:discard", "discard:c", "knock:c", "next".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { shuffledDeck } from '../shared/cards/cards';
import { bestMelds, cardValue, deadwoodOf, layOff } from './melds';

export const TARGET = 100;
export const GIN_BONUS = 25;
export const UNDERCUT_BONUS = 25;
export const KNOCK_LIMIT = 10;

export interface GinResult {
  kind: 'gin' | 'knock' | 'undercut' | 'void';
  knocker: number;
  /** Who scores the hand (null for a void hand). */
  winner: number | null;
  points: number;
  melds: number[][][];
  deadwood: number[][];
  /** Deadwood points after lay-offs. */
  counts: number[];
  laid: number[];
}

export interface GinState {
  seed: number;
  handNo: number;
  dealer: number;
  scores: [number, number];
  hands: number[][];
  stock: number[];
  /** The discard pile, its top last. */
  discard: number[];
  phase: 'draw' | 'discard' | 'done';
  toAct: number;
  /** The card just taken from the discard pile (it may not be thrown back this turn). */
  takenFromDiscard: number | null;
  /** Cards each player has taken from the discard pile and still holds (public). */
  picks: number[][];
  /** Cards each player has discarded this hand (public). */
  thrown: number[][];
  result: GinResult | null;
  history: string[];
  winner: number | null;
}

function deal(s: GinState) {
  const deck = shuffledDeck((s.seed * 3571 + s.handNo * 7919) >>> 0);
  s.hands = [deck.slice(0, 10), deck.slice(10, 20)];
  s.discard = [deck[20]!];
  s.stock = deck.slice(21);
  s.phase = 'draw';
  s.toAct = 1 - s.dealer;
  s.takenFromDiscard = null;
  s.picks = [[], []];
  s.thrown = [[], []];
  s.result = null;
}

export function createGin(seed: number): GinState {
  const s: GinState = {
    seed,
    handNo: 1,
    dealer: 1,
    scores: [0, 0],
    hands: [],
    stock: [],
    discard: [],
    phase: 'draw',
    toAct: 0,
    takenFromDiscard: null,
    picks: [],
    thrown: [],
    result: null,
    history: [],
    winner: null,
  };
  deal(s);
  return s;
}

/** Cards the player to act may discard (or knock with). */
export function discardable(s: GinState): number[] {
  return s.hands[s.toAct]!.filter((c) => c !== s.takenFromDiscard);
}

/** Whether discarding `card` leaves a hand that may knock. */
export function canKnockWith(s: GinState, card: number): boolean {
  const rest = s.hands[s.toAct]!.filter((c) => c !== card);
  return deadwoodOf(rest) <= KNOCK_LIMIT;
}

export function legalGinActions(s: GinState): string[] {
  if (s.winner !== null) return [];
  if (s.phase === 'done') return ['next'];
  if (s.phase === 'draw') return s.discard.length ? ['draw:stock', 'draw:discard'] : ['draw:stock'];
  const out: string[] = [];
  for (const c of discardable(s)) {
    out.push(`discard:${c}`);
    if (canKnockWith(s, c)) out.push(`knock:${c}`);
  }
  return out;
}

function settle(s: GinState, knocker: number) {
  const defender = 1 - knocker;
  const k = bestMelds(s.hands[knocker]!);
  const d = bestMelds(s.hands[defender]!);
  let kind: GinResult['kind'];
  let winner: number;
  let points: number;
  let laid: number[] = [];
  let defenderDeadwood = d.deadwood;
  let knockerMelds = k.melds;
  if (k.points === 0) {
    kind = 'gin';
    winner = knocker;
    points = GIN_BONUS + d.points;
  } else {
    const off = layOff(k.melds, d.deadwood);
    laid = off.laid;
    knockerMelds = off.melds;
    defenderDeadwood = d.deadwood.filter((c) => !laid.includes(c));
    const dCount = defenderDeadwood.reduce((a, c) => a + cardValue(c), 0);
    if (dCount <= k.points) {
      kind = 'undercut';
      winner = defender;
      points = UNDERCUT_BONUS + (k.points - dCount);
    } else {
      kind = 'knock';
      winner = knocker;
      points = dCount - k.points;
    }
  }
  const counts = [0, 0];
  counts[knocker] = k.points;
  counts[defender] = defenderDeadwood.reduce((a, c) => a + cardValue(c), 0);
  const melds: number[][][] = [[], []];
  melds[knocker] = knockerMelds;
  melds[defender] = d.melds;
  const deadwood: number[][] = [[], []];
  deadwood[knocker] = k.deadwood;
  deadwood[defender] = defenderDeadwood;
  s.result = { kind, knocker, winner, points, melds, deadwood, counts, laid };
  s.scores[winner as 0 | 1] += points;
  finish(s, winner);
}

function finish(s: GinState, loserDealsAfter: number | null) {
  s.phase = 'done';
  s.toAct = -1;
  // The loser of the hand deals the next one (the same dealer after a void hand).
  if (loserDealsAfter !== null) s.dealer = 1 - loserDealsAfter;
  if (s.scores[0] >= TARGET || s.scores[1] >= TARGET) s.winner = s.scores[0] >= s.scores[1] ? 0 : 1;
}

export function applyGinAction(s: GinState, a: string): GinState {
  if (!legalGinActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: GinState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    deal(n);
    return n;
  }
  const p = n.toAct;
  if (a === 'draw:stock') {
    n.hands[p]!.push(n.stock.shift()!);
    n.takenFromDiscard = null;
    n.phase = 'discard';
    return n;
  }
  if (a === 'draw:discard') {
    const card = n.discard.pop()!;
    n.hands[p]!.push(card);
    n.picks[p]!.push(card);
    n.takenFromDiscard = card;
    n.phase = 'discard';
    return n;
  }
  const card = Number(a.slice(a.indexOf(':') + 1));
  n.hands[p] = n.hands[p]!.filter((c) => c !== card);
  n.picks[p] = n.picks[p]!.filter((c) => c !== card);
  n.thrown[p]!.push(card);
  n.discard.push(card);
  n.takenFromDiscard = null;
  if (a.startsWith('knock:')) {
    settle(n, p);
    return n;
  }
  if (n.stock.length <= 2) {
    n.result = {
      kind: 'void',
      knocker: -1,
      winner: null,
      points: 0,
      melds: [bestMelds(n.hands[0]!).melds, bestMelds(n.hands[1]!).melds],
      deadwood: [bestMelds(n.hands[0]!).deadwood, bestMelds(n.hands[1]!).deadwood],
      counts: [deadwoodOf(n.hands[0]!), deadwoodOf(n.hands[1]!)],
      laid: [],
    };
    finish(n, null);
    return n;
  }
  n.phase = 'draw';
  n.toAct = 1 - p;
  return n;
}

export function replayGin(seed: number, history: readonly string[]): GinState {
  return history.reduce((s, a) => applyGinAction(s, a), createGin(seed));
}

export function isValidGinState(data: unknown): data is GinState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayGin(data.seed, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
