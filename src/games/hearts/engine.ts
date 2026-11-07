/**
 * Hearts (#093) for four players, each for themselves. Every hand: deal 13 cards each, pass three
 * cards (left, right, across, then no pass, in turn), and play 13 tricks. The two of clubs leads
 * the first trick; players must follow suit; nobody may play a heart or the queen of spades on the
 * first trick unless they have nothing else; hearts may not be led until a heart has been played
 * (unless the leader has only hearts). Each heart taken scores 1 point and the queen of spades 13.
 * Taking all 26 points "shoots the moon": the others score 26 instead. When someone reaches 100
 * points at the end of a hand, the lowest score wins (a tie for lowest plays another hand).
 *
 * Actions: "pass:c1.c2.c3" (each seat in turn, from seat 0), "play:c", "next" (deal the next hand).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { CLUBS, HEARTS, SPADES, makeCard, shuffledDeck, suitOf } from '../shared/cards/cards';
import { followSuit, trickWinner, type Play } from '../shared/tricks/cards';

export const TARGET = 100;
export const TWO_OF_CLUBS = makeCard(CLUBS, 2);
export const QUEEN_OF_SPADES = makeCard(SPADES, 12);
/** Pass directions by hand: left, right, across, none. */
export const PASS_OFFSETS = [1, 3, 2, 0] as const;

export const cardPoints = (c: number) =>
  c === QUEEN_OF_SPADES ? 13 : suitOf(c) === HEARTS ? 1 : 0;

export interface HeartsState {
  seed: number;
  handNo: number;
  scores: number[];
  hands: number[][];
  phase: 'pass' | 'play' | 'done';
  /** Cards each seat chose to pass (null until chosen), and the cards each seat received. */
  passes: (number[] | null)[];
  received: number[][];
  trick: Play[];
  toAct: number;
  heartsBroken: boolean;
  /** Suits each seat has shown out of this hand (public information). */
  shownOut: number[][];
  /** Cards each seat has taken this hand, and the trick count. */
  taken: number[][];
  tricks: number;
  lastTrick: Play[] | null;
  /** Points of the hand once it is over (after a moon is shot). */
  handPoints: number[] | null;
  moon: number | null;
  history: string[];
  /** The game's winner, once over. */
  winner: number | null;
}

export const passOffset = (handNo: number) => PASS_OFFSETS[(handNo - 1) % 4]!;

function deal(s: HeartsState) {
  const deck = shuffledDeck((s.seed * 9973 + s.handNo * 7919) >>> 0);
  s.hands = [0, 1, 2, 3].map((p) => deck.slice(p * 13, p * 13 + 13));
  s.passes = [null, null, null, null];
  s.received = [[], [], [], []];
  s.trick = [];
  s.heartsBroken = false;
  s.shownOut = [[], [], [], []];
  s.taken = [[], [], [], []];
  s.tricks = 0;
  s.lastTrick = null;
  s.handPoints = null;
  s.moon = null;
  if (passOffset(s.handNo) === 0) startPlay(s);
  else {
    s.phase = 'pass';
    s.toAct = 0;
  }
}

function startPlay(s: HeartsState) {
  s.phase = 'play';
  s.toAct = s.hands.findIndex((h) => h.includes(TWO_OF_CLUBS));
}

export function createHearts(seed: number): HeartsState {
  const s: HeartsState = {
    seed,
    handNo: 1,
    scores: [0, 0, 0, 0],
    hands: [],
    phase: 'pass',
    passes: [],
    received: [],
    trick: [],
    toAct: 0,
    heartsBroken: false,
    shownOut: [],
    taken: [],
    tricks: 0,
    lastTrick: null,
    handPoints: null,
    moon: null,
    history: [],
    winner: null,
  };
  deal(s);
  return s;
}

/** Cards the seat to act may play. */
export function playableCards(s: HeartsState): number[] {
  const hand = s.hands[s.toAct]!;
  if (s.trick.length === 0) {
    if (s.tricks === 0) return hand.includes(TWO_OF_CLUBS) ? [TWO_OF_CLUBS] : [];
    const nonHearts = hand.filter((c) => suitOf(c) !== HEARTS);
    return s.heartsBroken || nonHearts.length === 0 ? [...hand] : nonHearts;
  }
  const options = followSuit(hand, suitOf(s.trick[0]!.card));
  if (s.tricks === 0) {
    // No points on the first trick unless there is no choice.
    const clean = options.filter((c) => cardPoints(c) === 0);
    if (clean.length) return clean;
  }
  return options;
}

export function legalHeartsActions(s: HeartsState): string[] {
  if (s.winner !== null) return [];
  if (s.phase === 'done') return ['next'];
  if (s.phase === 'play') return playableCards(s).map((c) => `play:${c}`);
  return []; // passing: any three cards, see isLegalHeartsAction (too many to list)
}

/** Every three-card pass for agents that want a list (286 options). */
export function passOptions(hand: readonly number[]): string[] {
  const out: string[] = [];
  const sorted = [...hand].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length; j++)
      for (let k = j + 1; k < sorted.length; k++)
        out.push(`pass:${sorted[i]}.${sorted[j]}.${sorted[k]}`);
  return out;
}

export function isLegalHeartsAction(s: HeartsState, a: string): boolean {
  if (typeof a !== 'string' || s.winner !== null) return false;
  if (s.phase === 'pass') {
    const m = /^pass:(\d+)\.(\d+)\.(\d+)$/.exec(a);
    if (!m) return false;
    const cards = [m[1], m[2], m[3]].map(Number);
    const hand = s.hands[s.toAct]!;
    return cards[0]! < cards[1]! && cards[1]! < cards[2]! && cards.every((c) => hand.includes(c));
  }
  return legalHeartsActions(s).includes(a);
}

function endHand(s: HeartsState) {
  const points = s.taken.map((cards) => cards.reduce((a, c) => a + cardPoints(c), 0));
  const shooter = points.findIndex((p) => p === 26);
  s.moon = shooter >= 0 ? shooter : null;
  s.handPoints = shooter >= 0 ? points.map((_, i) => (i === shooter ? 0 : 26)) : points;
  s.scores = s.scores.map((x, i) => x + s.handPoints![i]!);
  s.phase = 'done';
  s.toAct = -1;
  if (Math.max(...s.scores) >= TARGET) {
    const low = Math.min(...s.scores);
    const leaders = s.scores.flatMap((x, i) => (x === low ? [i] : []));
    if (leaders.length === 1) s.winner = leaders[0]!;
  }
}

export function applyHeartsAction(s: HeartsState, a: string): HeartsState {
  if (!isLegalHeartsAction(s, a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: HeartsState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    deal(n);
    return n;
  }
  if (n.phase === 'pass') {
    n.passes[n.toAct] = a.slice(5).split('.').map(Number);
    if (n.toAct < 3) {
      n.toAct++;
      return n;
    }
    const offset = passOffset(n.handNo);
    for (let p = 0; p < 4; p++) {
      const cards = n.passes[p]!;
      const to = (p + offset) % 4;
      n.hands[p] = n.hands[p]!.filter((c) => !cards.includes(c));
      n.received[to] = cards;
    }
    for (let p = 0; p < 4; p++) n.hands[p]!.push(...n.received[p]!);
    startPlay(n);
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
  if (suitOf(card) === HEARTS) n.heartsBroken = true;
  if (n.trick.length < 4) {
    n.toAct = (seat + 1) % 4;
    return n;
  }
  const winner = trickWinner(n.trick).seat;
  n.taken[winner]!.push(...n.trick.map((p) => p.card));
  n.lastTrick = n.trick;
  n.trick = [];
  n.tricks++;
  n.toAct = winner;
  if (n.tricks === 13) endHand(n);
  return n;
}

export function replayHearts(seed: number, history: readonly string[]): HeartsState {
  return history.reduce((s, a) => applyHeartsAction(s, a), createHearts(seed));
}

export function isValidHeartsState(data: unknown): data is HeartsState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayHearts(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
