/**
 * Crazy Eights (#099) for 2–4 players (the player and 1–3 AI opponents), to 100 points.
 *
 * - Each hand: seven cards each with two players, five with three or four; the next card starts
 *   the discard pile (its suit is the suit to follow).
 * - A turn: play a card of the current suit or the same rank as the top card, or an **eight** (wild:
 *   the player names the next suit). A player with no such card draws one; if the drawn card can be
 *   played, they may play it, otherwise they pass. When the stock runs out the discards (all but the
 *   top) are shuffled into a new stock; with nothing left to draw, a player who cannot play passes.
 * - The first to empty their hand wins the hand and scores the cards left in the other hands: eight
 *   50, face cards 10, ace 1, other cards their value. If every player passes in a row with no cards
 *   to draw, the hand is blocked and the lowest hand (by those points) wins the difference sum.
 * - The first to 100 wins the match. The deal passes to the left.
 *
 * Actions: "play:c" (or "play:c:S" for an eight, naming suit S), "draw", "pass", "next".
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck, suitOf } from '../shared/cards/cards';

export const TARGET = 100;
export const isEight = (c: number) => rankOf(c) === 8;
export const penalty = (c: number) => (isEight(c) ? 50 : rankOf(c) >= 11 ? 10 : rankOf(c));

export interface EightsResult {
  winner: number;
  points: number;
  blocked: boolean;
}

export interface EightsState {
  seed: number;
  players: number;
  handNo: number;
  dealer: number;
  scores: number[];
  hands: number[][];
  stock: number[];
  /** The discard pile, its top last. */
  discard: number[];
  /** The suit to follow (the top card's, or the one named with an eight). */
  suit: number;
  toAct: number;
  /** The card just drawn this turn (the only card that may still be played). */
  drawn: number | null;
  /** Consecutive passes with nothing to draw (a blocked hand when everyone passes). */
  passes: number;
  /** The suit each player could not follow at their latest draw (public; empty before any draw). */
  lacked: number[][];
  reshuffles: number;
  result: EightsResult | null;
  history: string[];
  winner: number | null;
}

const handSize = (players: number) => (players === 2 ? 7 : 5);

function deal(s: EightsState) {
  const deck = shuffledDeck((s.seed * 9311 + s.handNo * 7919) >>> 0);
  const n = handSize(s.players);
  s.hands = Array.from({ length: s.players }, (_, p) => deck.slice(p * n, p * n + n));
  s.discard = [deck[s.players * n]!];
  s.stock = deck.slice(s.players * n + 1);
  s.suit = suitOf(s.discard[0]!);
  s.toAct = (s.dealer + 1) % s.players;
  s.drawn = null;
  s.passes = 0;
  s.lacked = Array.from({ length: s.players }, () => []);
  s.reshuffles = 0;
  s.result = null;
}

export function createEights(seed: number, players = 2): EightsState {
  const s: EightsState = {
    seed,
    players: Math.min(4, Math.max(2, players)),
    handNo: 1,
    dealer: 0,
    scores: [],
    hands: [],
    stock: [],
    discard: [],
    suit: 0,
    toAct: 0,
    drawn: null,
    passes: 0,
    lacked: [],
    reshuffles: 0,
    result: null,
    history: [],
    winner: null,
  };
  s.dealer = s.players - 1;
  s.scores = Array<number>(s.players).fill(0);
  deal(s);
  return s;
}

export const topCard = (s: EightsState) => s.discard[s.discard.length - 1]!;

/** Whether a card may be played on the pile. */
export function canPlay(s: EightsState, card: number): boolean {
  return isEight(card) || suitOf(card) === s.suit || rankOf(card) === rankOf(topCard(s));
}

export function playableCards(s: EightsState): number[] {
  if (s.drawn !== null) return canPlay(s, s.drawn) ? [s.drawn] : [];
  return s.hands[s.toAct]!.filter((c) => canPlay(s, c));
}

/** Whether a card can be drawn (after reshuffling the discards if needed). */
const canDraw = (s: EightsState) => s.stock.length > 0 || s.discard.length > 1;

export function legalEightsActions(s: EightsState): string[] {
  if (s.winner !== null) return [];
  if (s.result) return ['next'];
  const out: string[] = [];
  for (const c of playableCards(s)) {
    if (isEight(c)) for (let suit = 0; suit < 4; suit++) out.push(`play:${c}:${suit}`);
    else out.push(`play:${c}`);
  }
  if (s.drawn !== null) out.push('pass');
  else if (!out.length) out.push(canDraw(s) ? 'draw' : 'pass');
  return out;
}

function endHand(s: EightsState, winner: number, blocked: boolean) {
  const totals = s.hands.map((h) => h.reduce((a, c) => a + penalty(c), 0));
  const points = blocked
    ? totals.reduce((a, x) => a + x, 0) - totals[winner]! * s.players
    : totals.reduce((a, x) => a + x, 0);
  s.result = { winner, points: Math.max(0, points), blocked };
  s.scores[winner]! += Math.max(0, points);
  s.toAct = -1;
  if (Math.max(...s.scores) >= TARGET) s.winner = s.scores.indexOf(Math.max(...s.scores));
}

export function applyEightsAction(s: EightsState, a: string): EightsState {
  if (!legalEightsActions(s).includes(a))
    throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n: EightsState = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    n.dealer = (n.dealer + 1) % n.players;
    deal(n);
    return n;
  }
  const p = n.toAct;
  if (a === 'draw') {
    if (!n.stock.length) {
      // Shuffle the discards (all but the top) into a new stock.
      const top = n.discard.pop()!;
      n.reshuffles++;
      n.stock = new Rng((n.seed * 31 + n.handNo * 977 + n.reshuffles) >>> 0).shuffle(n.discard);
      n.discard = [top];
    }
    // Drawing shows the player had nothing of the suit (nor an eight) — until this draw; earlier
    // gaps may have been filled by the cards drawn since, so only the latest is kept.
    n.lacked[p] = [n.suit];
    const card = n.stock.shift()!;
    n.hands[p]!.push(card);
    n.drawn = card;
    n.passes = 0;
    return n;
  }
  if (a === 'pass') {
    n.drawn = null;
    if (!canDraw(n) && !playableCards(n).length) n.passes++;
    if (n.passes >= n.players) {
      // Blocked: the lowest hand wins.
      const totals = n.hands.map((h) => h.reduce((x, c) => x + penalty(c), 0));
      endHand(n, totals.indexOf(Math.min(...totals)), true);
      return n;
    }
    n.toAct = (p + 1) % n.players;
    return n;
  }
  const [, cardText, suitText] = a.split(':');
  const card = Number(cardText);
  n.hands[p] = n.hands[p]!.filter((c) => c !== card);
  n.discard.push(card);
  n.suit = suitText !== undefined ? Number(suitText) : suitOf(card);
  n.drawn = null;
  n.passes = 0;
  if (!n.hands[p]!.length) {
    endHand(n, p, false);
    return n;
  }
  n.toAct = (p + 1) % n.players;
  return n;
}

export function replayEights(
  seed: number,
  players: number,
  history: readonly string[],
): EightsState {
  return history.reduce((s, a) => applyEightsAction(s, a), createEights(seed, players));
}

export function isValidEightsState(data: unknown): data is EightsState {
  if (!isRecord(data) || typeof data.seed !== 'number' || typeof data.players !== 'number')
    return false;
  if (!Array.isArray(data.history) || !data.history.every((a) => typeof a === 'string'))
    return false;
  try {
    return (
      JSON.stringify(replayEights(data.seed, data.players, data.history as string[])) ===
      JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
