/**
 * Poker as a sit-and-go tournament (#087 Texas Hold'em, #088 Five Card Draw, #089 Omaha): every
 * seat starts with the same stack, the blinds rise every ten hands, busted seats leave, and the
 * tournament ends when one seat holds every chip — or, for the human player, when they bust.
 *
 * A hand: the button moves, the small and big blinds are posted (heads-up the button posts the
 * small blind) and every seat gets its hole cards (2 in Hold'em, 4 in Omaha, 5 in Draw). The first
 * betting round ("preflop") is followed by the variant's streets: the flop of three, the turn and
 * the river in the community games; in Draw a discard round (each player in turn throws away up to
 * three cards and is dealt as many) and a final betting round. Betting is no-limit (Hold'em),
 * pot-limit (Omaha) or fixed-limit (Draw: bets and raises of one big blind before the draw and two
 * after it, at most four bets a round). A no-limit or pot-limit raise is at least the size of the
 * last bet or raise; an all-in for less does not reopen the betting for players who already acted.
 * When all but one player fold, the last one takes the pot; otherwise the best hands share the pots
 * at showdown, side pots for players all-in for less, odd chips going to the first winner left of
 * the button.
 *
 * Actions: "fold", "check", "call", "raise:N" (raise the street's bet to N), "draw:024" (throw away
 * the cards at those positions; "draw:" stands pat), "next" (deal the next hand once a hand is over).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';
import { shuffledDeck } from '../cards/cards';
import { bestScore, omahaScore } from './hands';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'draw' | 'final' | 'done';

export interface PokerVariant {
  id: 'holdem' | 'omaha' | 'draw';
  hole: 2 | 4 | 5;
  limit: 'no-limit' | 'pot-limit' | 'fixed-limit';
  /** The streets after the first betting round, in order. */
  streets: readonly Street[];
}

const COMMUNITY: readonly Street[] = ['flop', 'turn', 'river'];
export const HOLDEM: PokerVariant = {
  id: 'holdem',
  hole: 2,
  limit: 'no-limit',
  streets: COMMUNITY,
};
export const OMAHA: PokerVariant = { id: 'omaha', hole: 4, limit: 'pot-limit', streets: COMMUNITY };
export const DRAW: PokerVariant = {
  id: 'draw',
  hole: 5,
  limit: 'fixed-limit',
  streets: ['draw', 'final'],
};
/** Draw: the most cards a player may exchange; fixed limit: the most bets in a round. */
export const MAX_DRAW = 3;
export const BET_CAP = 4;

export const BLIND_LEVELS: readonly [number, number][] = [
  [10, 20],
  [15, 30],
  [25, 50],
  [50, 100],
  [75, 150],
  [100, 200],
  [150, 300],
  [200, 400],
  [300, 600],
  [500, 1000],
];
export const HANDS_PER_LEVEL = 10;

export interface Seat {
  stack: number;
  hole: number[];
  /** Chips put in on this street and in the whole hand. */
  bet: number;
  total: number;
  folded: boolean;
  allIn: boolean;
  /** Out of the tournament. */
  out: boolean;
  /** Still owes an action on this street. */
  pending: boolean;
  /** Already acted, then faced a short all-in: may only call or fold. */
  capped: boolean;
  /** Draw: cards exchanged this hand (−1 before the draw). */
  drew: number;
}

export interface HandResult {
  /** Chips won by each seat in this hand (pots collected). */
  won: number[];
  /** Seats whose cards were shown at showdown. */
  shown: number[];
  /** Showdown scores (0 when not shown). */
  scores: number[];
}

export interface PokerState {
  seed: number;
  variant: PokerVariant['id'];
  seats: Seat[];
  button: number;
  handNo: number;
  deck: number[];
  dealt: number;
  board: number[];
  street: Street;
  toAct: number;
  /** The street's highest bet, the size of the last full raise and the number of bets made. */
  currentBet: number;
  minRaise: number;
  bets: number;
  blinds: [number, number];
  history: string[];
  result: HandResult | null;
  /** Set when the tournament is over: the seat holding every chip (or −1 when seat 0 busted). */
  champion: number | null;
}

export const variantOf = (id: PokerVariant['id']) =>
  id === 'omaha' ? OMAHA : id === 'draw' ? DRAW : HOLDEM;

/** The showdown score of a seat's hand. */
export function handScore(
  id: PokerVariant['id'],
  hole: readonly number[],
  board: readonly number[],
): number {
  if (id === 'omaha') return omahaScore(hole, board);
  return bestScore([...hole, ...board]);
}

export function createPoker(
  variant: PokerVariant,
  seed: number,
  players: number,
  stack = 1500,
): PokerState {
  const s: PokerState = {
    seed,
    variant: variant.id,
    seats: Array.from({ length: players }, () => ({
      stack,
      hole: [],
      bet: 0,
      total: 0,
      folded: false,
      allIn: false,
      out: false,
      pending: false,
      capped: false,
      drew: -1,
    })),
    button: players - 1,
    handNo: 0,
    deck: [],
    dealt: 0,
    board: [],
    street: 'done',
    toAct: -1,
    currentBet: 0,
    minRaise: 0,
    bets: 0,
    blinds: BLIND_LEVELS[0]!,
    history: [],
    result: null,
    champion: null,
  };
  startHand(s);
  return s;
}

const live = (s: PokerState) => s.seats.map((_, i) => i).filter((i) => !s.seats[i]!.out);
const nextSeat = (s: PokerState, from: number, ok: (i: number) => boolean) => {
  const n = s.seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (ok(i)) return i;
  }
  return -1;
};
const inHand = (s: PokerState, i: number) => !s.seats[i]!.out && !s.seats[i]!.folded;
const canBet = (s: PokerState, i: number) => inHand(s, i) && !s.seats[i]!.allIn;
/** Whoever is still in draws, all-in or not; only players with chips bet. */
const canAct = (s: PokerState, i: number) => (s.street === 'draw' ? inHand(s, i) : canBet(s, i));

/** Fixed limit: the bet size of the street (doubled after the draw). */
const betSize = (s: PokerState) => (s.street === 'final' ? 2 : 1) * s.blinds[1];

function post(s: PokerState, i: number, amount: number) {
  const seat = s.seats[i]!;
  const paid = Math.min(amount, seat.stack);
  seat.stack -= paid;
  seat.bet += paid;
  seat.total += paid;
  if (seat.stack === 0) seat.allIn = true;
}

function startHand(s: PokerState) {
  const players = live(s);
  s.handNo++;
  s.blinds =
    BLIND_LEVELS[Math.min(BLIND_LEVELS.length - 1, Math.floor((s.handNo - 1) / HANDS_PER_LEVEL))]!;
  s.button = nextSeat(s, s.button, (i) => !s.seats[i]!.out);
  s.deck = shuffledDeck((s.seed * 31 + s.handNo * 7919) >>> 0);
  s.dealt = 0;
  s.board = [];
  s.result = null;
  for (const seat of s.seats)
    Object.assign(seat, {
      hole: [],
      bet: 0,
      total: 0,
      folded: false,
      allIn: false,
      pending: false,
      capped: false,
      drew: -1,
    });
  const headsUp = players.length === 2;
  const sb = headsUp ? s.button : nextSeat(s, s.button, (i) => !s.seats[i]!.out);
  const bb = nextSeat(s, sb, (i) => !s.seats[i]!.out);
  post(s, sb, s.blinds[0]);
  post(s, bb, s.blinds[1]);
  const hole = variantOf(s.variant).hole;
  for (let k = 0; k < hole; k++) for (const i of players) s.seats[i]!.hole.push(s.deck[s.dealt++]!);
  s.street = 'preflop';
  s.currentBet = s.blinds[1];
  s.minRaise = s.blinds[1];
  s.bets = 1;
  for (const i of players) s.seats[i]!.pending = canAct(s, i);
  s.toAct = nextSeat(s, bb, (i) => canAct(s, i));
  settleIfDone(s);
}

export const toCall = (s: PokerState, i = s.toAct) => Math.max(0, s.currentBet - s.seats[i]!.bet);

/** Raise limits for the seat to act: the smallest and largest "raise to" amounts. */
export function raiseRange(s: PokerState): [number, number] | null {
  if (s.street === 'done' || s.street === 'draw' || s.toAct < 0) return null;
  const seat = s.seats[s.toAct]!;
  const allIn = seat.bet + seat.stack;
  if (allIn <= s.currentBet) return null; // can only call (all-in) or fold
  // Nobody else could call a raise: raising is pointless.
  if (!s.seats.some((_, i) => i !== s.toAct && canBet(s, i))) return null;
  // Facing only an all-in for less than a full raise after acting: call or fold.
  if (seat.capped) return null;
  if (variantOf(s.variant).limit === 'fixed-limit') {
    if (s.bets >= BET_CAP) return null;
    const to = Math.min(allIn, s.currentBet + betSize(s));
    return [to, to];
  }
  const min = Math.min(allIn, s.currentBet + s.minRaise);
  let max = allIn;
  if (variantOf(s.variant).limit === 'pot-limit') {
    // Pot-limit: call first, then raise by the whole pot.
    const pot = s.seats.reduce((a, x) => a + x.total, 0);
    max = Math.min(allIn, s.currentBet + pot + toCall(s));
  }
  return [min, Math.max(min, max)];
}

/** Draw: every choice of up to three positions to throw away ("draw:" stands pat). */
export function drawOptions(cards: number): string[] {
  const out: string[] = [];
  for (let mask = 0; mask < 1 << cards; mask++) {
    const picked = [...Array(cards).keys()].filter((k) => mask & (1 << k));
    if (picked.length <= MAX_DRAW) out.push(`draw:${picked.join('')}`);
  }
  return out.sort((a, b) => a.length - b.length || a.localeCompare(b));
}

/** Discrete choices for agents: fold / check / call, minimum, half-pot, pot and all-in raises. */
export function legalPokerActions(s: PokerState): string[] {
  if (s.champion !== null) return [];
  if (s.street === 'done') return ['next'];
  if (s.street === 'draw') return drawOptions(s.seats[s.toAct]!.hole.length);
  const out: string[] = [];
  if (toCall(s) > 0) out.push('fold', 'call');
  else out.push('check');
  const range = raiseRange(s);
  if (range) {
    const pot = s.seats.reduce((a, x) => a + x.total, 0) + toCall(s);
    const sizes = new Set<number>([range[0], range[1]]);
    for (const f of [0.5, 1]) {
      const to = s.currentBet + Math.round(pot * f);
      if (to > range[0] && to < range[1]) sizes.add(to);
    }
    for (const to of [...sizes].sort((a, b) => a - b)) out.push(`raise:${to}`);
  }
  return out;
}

export function isLegalPokerAction(s: PokerState, a: string): boolean {
  if (typeof a !== 'string' || s.champion !== null) return false;
  if (s.street === 'done') return a === 'next';
  if (s.street === 'draw') {
    const d = /^draw:(\d*)$/.exec(a);
    if (!d) return false;
    const idx = d[1]!.split('').map(Number);
    return (
      idx.length <= MAX_DRAW &&
      idx.every((k, j) => k < s.seats[s.toAct]!.hole.length && (j === 0 || k > idx[j - 1]!))
    );
  }
  if (a === 'fold' || a === 'call') return toCall(s) > 0;
  if (a === 'check') return toCall(s) === 0;
  const m = /^raise:(\d+)$/.exec(a);
  if (!m) return false;
  const range = raiseRange(s);
  const to = Number(m[1]);
  return !!range && to >= range[0] && to <= range[1];
}

/** Ends the street (or the hand) when nobody owes an action. */
function settleIfDone(s: PokerState) {
  const contenders = s.seats.map((_, i) => i).filter((i) => inHand(s, i));
  if (contenders.length === 1) return award(s, false);
  if (s.seats.some((x, i) => x.pending && canAct(s, i))) {
    if (!s.seats[s.toAct]?.pending || !canAct(s, s.toAct))
      s.toAct = nextSeat(s, s.toAct, (i) => s.seats[i]!.pending && canAct(s, i));
    return;
  }
  // The street is over: collect bets, deal on.
  for (const seat of s.seats) {
    seat.bet = 0;
    seat.capped = false;
  }
  s.currentBet = 0;
  s.bets = 0;
  const v = variantOf(s.variant);
  const order: Street[] = ['preflop', ...v.streets, 'done'];
  const next = order[order.indexOf(s.street) + 1]!;
  if (next === 'done') return award(s, true);
  s.street = next;
  s.minRaise = v.limit === 'fixed-limit' ? betSize(s) : s.blinds[1];
  const count = next === 'flop' ? 3 : next === 'turn' || next === 'river' ? 1 : 0;
  for (let k = 0; k < count; k++) s.board.push(s.deck[s.dealt++]!);
  const actors = contenders.filter((i) => canBet(s, i));
  // Everyone still in draws; with at most one player able to bet, the hand runs out.
  for (const i of contenders)
    s.seats[i]!.pending = next === 'draw' || (actors.length > 1 && canBet(s, i));
  s.toAct = nextSeat(s, s.button, (i) => s.seats[i]!.pending);
  if (s.toAct === -1) s.toAct = s.button;
  settleIfDone(s);
}

/** Pays out the pots: to the last player standing, or at showdown with side pots. */
function award(s: PokerState, showdown: boolean) {
  const n = s.seats.length;
  const won = Array<number>(n).fill(0);
  const scores = Array<number>(n).fill(0);
  const contenders = s.seats.map((_, i) => i).filter((i) => inHand(s, i));
  if (!showdown) {
    won[contenders[0]!] = s.seats.reduce((a, x) => a + x.total, 0);
  } else {
    for (const i of contenders) scores[i] = handScore(s.variant, s.seats[i]!.hole, s.board);
    // Side pots: layer the contributions by the all-in levels of the players still in.
    const levels = [...new Set(contenders.map((i) => s.seats[i]!.total))].sort((a, b) => a - b);
    let floor = 0;
    for (const level of levels) {
      let pot = 0;
      for (const seat of s.seats) pot += Math.max(0, Math.min(seat.total, level) - floor);
      const eligible = contenders.filter((i) => s.seats[i]!.total >= level);
      const best = Math.max(...eligible.map((i) => scores[i]!));
      const winners = eligible.filter((i) => scores[i] === best);
      // Odd chips go to the first winner left of the button.
      const ordered = [...winners].sort(
        (a, b) => ((a - s.button + n) % n) - ((b - s.button + n) % n),
      );
      const share = Math.floor(pot / winners.length);
      let rest = pot - share * winners.length;
      for (const w of ordered) {
        won[w]! += share + (rest > 0 ? 1 : 0);
        rest--;
      }
      floor = level;
    }
  }
  won.forEach((w, i) => (s.seats[i]!.stack += w));
  s.result = { won, shown: showdown ? contenders : [], scores };
  s.street = 'done';
  s.toAct = -1;
  for (const seat of s.seats) {
    seat.bet = 0;
    seat.pending = false;
    if (seat.stack === 0 && !seat.out) seat.out = true;
  }
  const left = live(s);
  if (left.length === 1) s.champion = left[0]!;
  else if (s.seats[0]!.out) s.champion = -1;
}

function shift(s: PokerState, a: string) {
  if (a === 'next') return startHand(s);
  const i = s.toAct;
  const seat = s.seats[i]!;
  if (a === 'fold') seat.folded = true;
  else if (a === 'call') post(s, i, toCall(s, i));
  else if (a.startsWith('draw:')) {
    const picked = a.slice(5).split('').map(Number);
    for (const k of picked) seat.hole[k] = s.deck[s.dealt++]!;
    seat.drew = picked.length;
  } else if (a.startsWith('raise:')) {
    const to = Number(a.slice(6));
    const raiseBy = to - s.currentBet;
    s.bets++;
    post(s, i, to - seat.bet);
    // A full raise reopens the betting; an all-in for less does not.
    if (raiseBy >= s.minRaise) {
      s.minRaise = raiseBy;
      for (const [k, x] of s.seats.entries())
        if (k !== i && canAct(s, k)) {
          x.pending = true;
          x.capped = false;
        }
    } else
      for (const [k, x] of s.seats.entries())
        if (k !== i && canAct(s, k) && x.bet < to) {
          if (!x.pending) x.capped = true;
          x.pending = true;
        }
    s.currentBet = Math.max(s.currentBet, to);
  }
  seat.pending = false;
  s.toAct = nextSeat(s, i, (k) => s.seats[k]!.pending && canAct(s, k));
  if (s.toAct === -1) s.toAct = i;
  settleIfDone(s);
}

const clone = (s: PokerState): PokerState => ({
  ...s,
  seats: s.seats.map((x) => ({ ...x, hole: x.hole.slice() })),
  board: s.board.slice(),
  history: s.history.slice(),
  result: s.result
    ? { won: s.result.won.slice(), shown: s.result.shown.slice(), scores: s.result.scores.slice() }
    : null,
});

export function applyPokerAction(s: PokerState, a: string): PokerState {
  if (!isLegalPokerAction(s, a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const n = clone(s);
  n.history.push(a);
  shift(n, a);
  return n;
}

export function replayPoker(
  variant: PokerVariant,
  seed: number,
  players: number,
  stack: number,
  history: readonly string[],
): PokerState {
  return history.reduce(
    (s, a) => applyPokerAction(s, a),
    createPoker(variant, seed, players, stack),
  );
}

export function isValidPokerState(
  variant: PokerVariant,
  data: unknown,
  stack = 1500,
): data is PokerState {
  if (!isRecord(data) || !Array.isArray(data.history) || !Array.isArray(data.seats)) return false;
  if (typeof data.seed !== 'number' || data.variant !== variant.id) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replayPoker(
      variant,
      data.seed,
      data.seats.length,
      stack,
      data.history as string[],
    );
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}

export const potSize = (s: PokerState) => s.seats.reduce((a, x) => a + x.total, 0);
