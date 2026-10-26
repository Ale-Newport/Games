/**
 * Euchre (#098) for four players in two partnerships (seats 0 and 2 against 1 and 3), to 10 points.
 *
 * - A 24-card deck (nine to ace). Five cards each; the next card is turned up.
 * - **Making trump**, round one: from the dealer's left, each player passes or orders the dealer to
 *   take the upcard (its suit becomes trump; the dealer takes it and throws a card). Round two: each
 *   passes or names another suit; the dealer may not pass ("stick the dealer"). The maker may go
 *   **alone**: their partner sits the hand out.
 * - Trump ranks: the jack of trump (right bower), the jack of the same colour (left bower, which
 *   belongs to the trump suit), then ace, king, queen, ten, nine. Other suits rank ace high.
 * - Play: the player left of the dealer leads (skipping a partner who sits out); follow the led suit
 *   if possible; the highest trump, else the highest card of the led suit, wins.
 * - Scoring: the makers take three or four tricks: 1 point; all five: 2 (4 when alone). Taking fewer
 *   than three ("euchred"): the defenders score 2.
 *
 * Actions: "pass", "order", "order-alone", "name:S" / "name-alone:S" (S a suit index), "throw:c"
 * (the dealer's discard), "play:c", "next".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { Rng } from '../../core/game-engine/random';
import { DIAMONDS, HEARTS, rankOf, suitOf, type Suit } from '../shared/cards/cards';
import type { Play } from '../shared/tricks/cards';

export const TARGET = 10;
/** The 24 cards: nine, ten, jack, queen, king and ace of each suit. */
export const EUCHRE_DECK: readonly number[] = [0, 1, 2, 3].flatMap((s) =>
  [9, 10, 11, 12, 13, 1].map((r) => s * 13 + r - 1),
);

export const teamOf = (seat: number) => (seat % 2) as 0 | 1;
const sameColour = (suit: number) =>
  suit === HEARTS ? DIAMONDS : suit === DIAMONDS ? HEARTS : suit === 0 ? 3 : 0;

/** The suit a card plays as: the left bower belongs to trump. */
export function effectiveSuit(card: number, trump: number | null): number {
  if (trump !== null && rankOf(card) === 11 && suitOf(card) === sameColour(trump)) return trump;
  return suitOf(card);
}

/** A comparable strength: right bower 100, left bower 99, trumps 80+, others by rank. */
export function cardPower(card: number, trump: number | null, led: number | null): number {
  const r = rankOf(card) === 1 ? 14 : rankOf(card);
  if (trump !== null) {
    if (rankOf(card) === 11 && suitOf(card) === trump) return 100;
    if (rankOf(card) === 11 && suitOf(card) === sameColour(trump)) return 99;
    if (suitOf(card) === trump) return 80 + r;
  }
  if (led !== null && effectiveSuit(card, trump) === led) return 40 + r;
  return r;
}

export interface EuchreResult {
  makers: 0 | 1;
  tricks: number;
  points: [number, number];
  euchred: boolean;
  march: boolean;
}

export interface EuchreState {
  seed: number;
  handNo: number;
  dealer: number;
  scores: [number, number];
  hands: number[][];
  upcard: number;
  phase: 'round1' | 'round2' | 'throw' | 'play' | 'done';
  toAct: number;
  trump: number | null;
  maker: number;
  alone: boolean;
  /** Who has passed in the current bidding round. */
  passes: number;
  trick: Play[];
  leader: number;
  tricks: [number, number];
  played: number;
  lastTrick: Play[] | null;
  shownOut: number[][];
  /** The dealer's discard (known only to the dealer). */
  buried: number | null;
  result: EuchreResult | null;
  history: string[];
  winner: 0 | 1 | null;
}

/** The seat sitting out (the lone maker's partner), or −1. */
export const sittingOut = (s: EuchreState) => (s.alone ? (s.maker + 2) % 4 : -1);
const nextActive = (s: EuchreState, seat: number) => {
  let n = (seat + 1) % 4;
  if (n === sittingOut(s)) n = (n + 1) % 4;
  return n;
};

function deal(s: EuchreState) {
  const deck = new Rng((s.seed * 6007 + s.handNo * 7919) >>> 0).shuffle([...EUCHRE_DECK]);
  s.hands = [0, 1, 2, 3].map((p) => deck.slice(p * 5, p * 5 + 5));
  s.upcard = deck[20]!;
  s.phase = 'round1';
  s.toAct = (s.dealer + 1) % 4;
  s.trump = null;
  s.maker = -1;
  s.alone = false;
  s.passes = 0;
  s.trick = [];
  s.leader = -1;
  s.tricks = [0, 0];
  s.played = 0;
  s.lastTrick = null;
  s.shownOut = [[], [], [], []];
  s.buried = null;
  s.result = null;
}

export function createEuchre(seed: number): EuchreState {
  const s: EuchreState = {
    seed,
    handNo: 1,
    dealer: 3,
    scores: [0, 0],
    hands: [],
    upcard: -1,
    phase: 'round1',
    toAct: 0,
    trump: null,
    maker: -1,
    alone: false,
    passes: 0,
    trick: [],
    leader: -1,
    tricks: [0, 0],
    played: 0,
    lastTrick: null,
    shownOut: [],
    buried: null,
    result: null,
    history: [],
    winner: null,
  };
  deal(s);
  return s;
}

export function playableCards(s: EuchreState): number[] {
  const hand = s.hands[s.toAct]!;
  if (!s.trick.length) return [...hand];
  const led = effectiveSuit(s.trick[0]!.card, s.trump);
  const same = hand.filter((c) => effectiveSuit(c, s.trump) === led);
  return same.length ? same : [...hand];
}

export function legalEuchreActions(s: EuchreState): string[] {
  if (s.winner !== null) return [];
  switch (s.phase) {
    case 'done':
      return ['next'];
    case 'round1':
      return ['pass', 'order', 'order-alone'];
    case 'round2': {
      const out = s.toAct === s.dealer ? [] : ['pass'];
      for (let suit = 0; suit < 4; suit++)
        if (suit !== suitOf(s.upcard)) out.push(`name:${suit}`, `name-alone:${suit}`);
      return out;
    }
    case 'throw':
      return s.hands[s.dealer]!.map((c) => `throw:${c}`);
    case 'play':
      return playableCards(s).map((c) => `play:${c}`);
  }
}

function startPlay(s: EuchreState) {
  s.phase = 'play';
  s.leader = nextActive(s, s.dealer);
  s.toAct = s.leader;
}

function endHand(s: EuchreState) {
  const makers = teamOf(s.maker);
  const tricks = s.tricks[makers];
  const points: [number, number] = [0, 0];
  const euchred = tricks < 3;
  const march = tricks === 5;
  if (euchred) points[(1 - makers) as 0 | 1] = 2;
  else points[makers] = march ? (s.alone ? 4 : 2) : 1;
  s.result = { makers, tricks, points, euchred, march };
  s.scores = [s.scores[0] + points[0], s.scores[1] + points[1]];
  s.phase = 'done';
  s.toAct = -1;
  if (s.scores[0] >= TARGET || s.scores[1] >= TARGET) s.winner = s.scores[0] >= TARGET ? 0 : 1;
}

export function applyEuchreAction(s: EuchreState, a: string): EuchreState {
  if (!legalEuchreActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: EuchreState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    n.dealer = (n.dealer + 1) % 4;
    deal(n);
    return n;
  }
  const p = n.toAct;
  if (a === 'pass') {
    n.passes++;
    if (n.phase === 'round1' && n.passes === 4) {
      n.phase = 'round2';
      n.passes = 0;
    }
    n.toAct = (p + 1) % 4;
    return n;
  }
  if (a === 'order' || a === 'order-alone') {
    n.trump = suitOf(n.upcard);
    n.maker = p;
    n.alone = a === 'order-alone';
    // The dealer picks the upcard up and throws one card (unless the dealer sits out).
    if (sittingOut(n) === n.dealer) startPlay(n);
    else {
      n.hands[n.dealer]!.push(n.upcard);
      n.phase = 'throw';
      n.toAct = n.dealer;
    }
    return n;
  }
  if (a.startsWith('name')) {
    n.trump = Number(a.slice(a.indexOf(':') + 1));
    n.maker = p;
    n.alone = a.startsWith('name-alone');
    startPlay(n);
    return n;
  }
  if (a.startsWith('throw:')) {
    const card = Number(a.slice(6));
    n.hands[p] = n.hands[p]!.filter((c) => c !== card);
    n.buried = card;
    startPlay(n);
    return n;
  }
  const card = Number(a.slice(5));
  n.hands[p] = n.hands[p]!.filter((c) => c !== card);
  if (n.trick.length) {
    const led = effectiveSuit(n.trick[0]!.card, n.trump);
    if (effectiveSuit(card, n.trump) !== led && !n.shownOut[p]!.includes(led))
      n.shownOut[p]!.push(led);
  }
  n.trick.push({ seat: p, card });
  const players = n.alone ? 3 : 4;
  if (n.trick.length < players) {
    n.toAct = nextActive(n, p);
    return n;
  }
  const led = effectiveSuit(n.trick[0]!.card, n.trump);
  const winner = n.trick.reduce((best, x) =>
    cardPower(x.card, n.trump, led) > cardPower(best.card, n.trump, led) ? x : best,
  ).seat;
  n.tricks[teamOf(winner)]++;
  n.lastTrick = n.trick;
  n.trick = [];
  n.played++;
  n.toAct = winner;
  if (n.played === 5) endHand(n);
  return n;
}

export function replayEuchre(seed: number, history: readonly string[]): EuchreState {
  return history.reduce((s, a) => applyEuchreAction(s, a), createEuchre(seed));
}

export function isValidEuchreState(data: unknown): data is EuchreState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayEuchre(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}

export type { Suit };
