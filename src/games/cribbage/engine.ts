/**
 * Cribbage (#097) for two players, to 121 points.
 *
 * - Each hand: six cards each; both players throw two face down into the dealer's **crib**. The
 *   non-dealer cuts the **starter**; a jack starter gives the dealer 2 ("his heels").
 * - **Pegging**: starting with the non-dealer, players alternately lay a card and announce the
 *   running count, which may not pass 31; points come from 15s, 31, pairs and runs (see
 *   `scoring.ts`). A player who cannot play says **go** (the table does this for them); the other
 *   keeps playing while they can, and the last to play scores 1 for the go (31 already scores 2).
 *   The count then restarts with the player who did not play last; the last card of all scores 1.
 * - **The show**: the non-dealer's hand, then the dealer's hand and the dealer's crib, each with the
 *   starter.
 * - The first to 121 wins at once (pegging points count as they are made). The deal alternates.
 *
 * Actions: "crib:a.b" (non-dealer first), "play:c", "next" (to the next hand).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';
import { rankOf, shuffledDeck } from '../shared/cards/cards';
import { pegPoints, pipValue, scoreShow, type ShowBreakdown } from './scoring';

export const TARGET = 121;

export interface ShowResult {
  pone: ShowBreakdown;
  dealer: ShowBreakdown;
  crib: ShowBreakdown;
}

export interface CribbageState {
  seed: number;
  handNo: number;
  dealer: number;
  scores: [number, number];
  /** Cards still in each hand (during pegging, the cards not yet laid). */
  hands: number[][];
  /** The four cards each player keeps (for the show). */
  kept: number[][];
  crib: number[];
  /** The card the starter will be cut from (hidden until it is turned up). */
  cut: number;
  starter: number | null;
  phase: 'crib' | 'peg' | 'show' | 'done';
  toAct: number;
  /** The cards laid since the count last restarted, and who laid each. */
  pile: { seat: number; card: number }[];
  /** Every card laid this hand, in order. */
  played: { seat: number; card: number }[];
  /** The latest points scored, for display: who, how many, why. */
  events: { seat: number; points: number; reason: string }[];
  show: ShowResult | null;
  history: string[];
  winner: number | null;
}

export const countOf = (pile: readonly { card: number }[]) =>
  pile.reduce((a, p) => a + pipValue(p.card), 0);
export const pone = (s: CribbageState) => 1 - s.dealer;

function deal(s: CribbageState) {
  const deck = shuffledDeck((s.seed * 5413 + s.handNo * 7919) >>> 0);
  s.hands = [deck.slice(0, 6), deck.slice(6, 12)];
  s.cut = deck[12]!;
  s.kept = [[], []];
  s.crib = [];
  s.starter = null;
  s.phase = 'crib';
  s.toAct = pone(s);
  s.pile = [];
  s.played = [];
  s.events = [];
  s.show = null;
}

export function createCribbage(seed: number): CribbageState {
  const s: CribbageState = {
    seed,
    handNo: 1,
    dealer: 1,
    scores: [0, 0],
    hands: [],
    kept: [],
    crib: [],
    starter: null,
    phase: 'crib' as const,
    toAct: 0,
    pile: [],
    played: [],
    events: [],
    show: null,
    history: [],
    winner: null,
    cut: -1,
  };
  deal(s);
  return s;
}

/** Cards the player to act may lay without passing 31. */
export function playable(s: CribbageState): number[] {
  const count = countOf(s.pile);
  return s.hands[s.toAct]!.filter((c) => count + pipValue(c) <= 31);
}

export function cribOptions(hand: readonly number[]): string[] {
  const sorted = [...hand].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length; j++) out.push(`crib:${sorted[i]}.${sorted[j]}`);
  return out;
}

export function legalCribbageActions(s: CribbageState): string[] {
  if (s.winner !== null) return [];
  if (s.phase === 'done' || s.phase === 'show') return ['next'];
  if (s.phase === 'crib') return cribOptions(s.hands[s.toAct]!);
  // The turn always passes to a player who can lay a card (goes are automatic).
  return playable(s).map((c) => `play:${c}`);
}

function award(s: CribbageState, seat: number, points: number, reason: string) {
  if (points <= 0 || s.winner !== null) return;
  s.scores[seat as 0 | 1] += points;
  s.events.push({ seat, points, reason });
  if (s.scores[seat as 0 | 1] >= TARGET) {
    s.winner = seat;
    s.phase = 'done';
    s.toAct = -1;
  }
}

/** Ends the pegging: the show is scored in order, stopping if someone reaches 121. */
function theShow(s: CribbageState) {
  const starter = s.starter!;
  const p = pone(s);
  const show: ShowResult = {
    pone: scoreShow(s.kept[p]!, starter),
    dealer: scoreShow(s.kept[s.dealer]!, starter),
    crib: scoreShow(s.crib, starter, true),
  };
  s.show = show;
  s.phase = 'show';
  s.toAct = -1;
  award(s, p, show.pone.total, 'hand');
  award(s, s.dealer, show.dealer.total, 'hand');
  award(s, s.dealer, show.crib.total, 'crib');
}

/** After a go or a card: restarts the count or moves the turn on. */
function advance(s: CribbageState, last: number) {
  const other = 1 - last;
  const done = s.hands[0]!.length === 0 && s.hands[1]!.length === 0;
  const count = countOf(s.pile);
  const otherCan = s.hands[other]!.some((c) => count + pipValue(c) <= 31);
  const lastCan = s.hands[last]!.some((c) => count + pipValue(c) <= 31);
  if (count === 31 || done || (!otherCan && !lastCan)) {
    // The count is over: the go point (31 already scored), then a restart.
    if (count !== 31) award(s, last, 1, done ? 'last' : 'go');
    s.pile = [];
    if (s.winner !== null) return;
    if (done) return theShow(s);
    s.toAct = s.hands[other]!.length ? other : last;
    return;
  }
  s.toAct = otherCan ? other : last;
}

export function applyCribbageAction(s: CribbageState, a: string): CribbageState {
  const legal =
    s.phase === 'crib'
      ? /^crib:\d+\.\d+$/.test(a) && cribOptions(s.hands[s.toAct]!).includes(a)
      : legalCribbageActions(s).includes(a);
  if (!legal) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n = structuredClone(s);
  n.history.push(a);
  if (a === 'next') {
    n.handNo++;
    n.dealer = 1 - n.dealer;
    deal(n);
    return n;
  }
  const p = n.toAct;
  if (a.startsWith('crib:')) {
    const cards = a.slice(5).split('.').map(Number);
    n.hands[p] = n.hands[p]!.filter((c) => !cards.includes(c));
    n.crib.push(...cards);
    n.kept[p] = [...n.hands[p]!];
    if (n.crib.length < 4) {
      n.toAct = n.dealer;
      return n;
    }
    n.starter = n.cut;
    n.phase = 'peg';
    n.toAct = pone(n);
    if (rankOf(n.starter) === 11) award(n, n.dealer, 2, 'heels');
    return n;
  }
  n.events = [];
  const card = Number(a.slice(5));
  n.hands[p] = n.hands[p]!.filter((c) => c !== card);
  n.pile.push({ seat: p, card });
  n.played.push({ seat: p, card });
  award(n, p, pegPoints(n.pile.map((x) => x.card)), 'peg');
  if (n.winner !== null) return n;
  advance(n, p);
  return n;
}

export function replayCribbage(seed: number, history: readonly string[]): CribbageState {
  return history.reduce((s, a) => applyCribbageAction(s, a), createCribbage(seed));
}

export function isValidCribbageState(data: unknown): data is CribbageState {
  if (!isRecord(data) || typeof data.seed !== 'number' || !Array.isArray(data.history))
    return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return (
      JSON.stringify(replayCribbage(data.seed, data.history as string[])) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
