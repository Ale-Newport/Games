/**
 * Poker opponents. They only know their own cards and the board: equity is estimated by Monte Carlo,
 * dealing hands to the opponents still in and random cards to complete the board, then compared
 * with the pot odds. Medium and Hard read ranges: an opponent who has put many of their chips in
 * is dealt only hands strong enough for it (rejection sampling on a pre-flop strength percentile
 * and, after the flop, on whether the hand connects with the board). Three styles:
 *
 * - Easy ("calling station"): equity against random hands, calls far too much, raises only very
 *   strong hands, never bluffs.
 * - Medium: folds when the equity is below the pot odds, bets or raises any hand with an edge (80%
 *   of the pot), seldom bluffs. Thin value bets are what beat players who call too much.
 * - Hard: more samples, thinner pot-sized value bets, a position allowance, slow-plays in big-bet
 *   games and a few more bluffs.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import type { Rng } from '../../../core/game-engine/random';
import { suitOf } from '../cards/cards';
import { CATEGORIES, bestScore, categoryOf, omahaScore, pokerRank } from './hands';
import { bestDiscard, drawEquity, simpleDiscard } from './draw-ai';
import { legalPokerActions, potSize, raiseRange, toCall, type PokerState } from './engine';

/** A Chen-style pre-flop score of two cards (−1 … 20). */
function chen(a: number, b: number): number {
  const hi = Math.max(pokerRank(a), pokerRank(b));
  const lo = Math.min(pokerRank(a), pokerRank(b));
  const face = (r: number) => (r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2);
  if (hi === lo) return Math.max(5, face(hi) * 2);
  let pts = face(hi);
  if (suitOf(a) === suitOf(b)) pts += 2;
  const gap = hi - lo - 1;
  pts -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && hi < 12) pts += 1;
  return pts;
}

/** Share of the 1326 starting hands with a lower Chen score, by score. */
const CHEN_PERCENTILE: Map<number, number> = (() => {
  const scores: number[] = [];
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) scores.push(chen(a, b));
  scores.sort((x, y) => x - y);
  const m = new Map<number, number>();
  scores.forEach((v, i) => {
    if (!m.has(v)) m.set(v, i / scores.length);
  });
  return m;
})();

/** Rough strength in [0, 1) of a holding: its pre-flop percentile, or how it connects with the board. */
export function holdingStrength(hole: readonly number[], board: readonly number[]): number {
  let pre = 0;
  for (let i = 0; i < hole.length; i++)
    for (let j = i + 1; j < hole.length; j++)
      pre = Math.max(pre, CHEN_PERCENTILE.get(chen(hole[i]!, hole[j]!))!);
  if (board.length < 3) return pre;
  const score = hole.length === 4 ? omahaScore(hole, board) : bestScore([...hole, ...board]);
  const cat = CATEGORIES.indexOf(categoryOf(score));
  // A pair or better that uses a hole card (pocket pair or pairing the board).
  const ranks = board.map(pokerRank);
  const pairs = hole.some((c) => ranks.includes(pokerRank(c))) || cat >= 2;
  const suited = [0, 1, 2, 3].some(
    (st) => [...hole, ...board].filter((c) => suitOf(c) === st).length >= 4,
  );
  const made = pairs && cat >= 1 ? Math.min(0.97, 0.55 + 0.1 * cat) : suited ? 0.6 : 0;
  return Math.max(pre * 0.8, made);
}

/** How strong an opponent's range is, from the share of their chips already in the pot. */
export function rangeFloor(s: PokerState, seat: number): number {
  const x = s.seats[seat]!;
  const committed = x.total / (x.total + x.stack);
  // The big blind's forced chips say nothing.
  const forced = s.street === 'preflop' && x.bet <= s.blinds[1] ? x.bet : 0;
  const voluntary = Math.max(0, x.total - forced) / (x.total + x.stack);
  return Math.min(0.85, 0.9 * Math.sqrt(Math.max(0, Math.min(committed, voluntary))));
}

/**
 * Share of the pot this seat's hand wins against the other contenders, whose hands are drawn at
 * random (or, with `ranges`, from hands as strong as their betting suggests).
 */
export function estimateEquity(
  s: PokerState,
  seat: number,
  samples: number,
  rng: Rng,
  ranges = false,
): number {
  const me = s.seats[seat]!;
  const omaha = s.variant === 'omaha';
  const holeSize = me.hole.length;
  const opponents = s.seats.flatMap((x, i) => (i !== seat && !x.out && !x.folded ? [i] : []));
  const floors = opponents.map((i) => (ranges ? rangeFloor(s, i) : 0));
  if (s.variant === 'draw') {
    const plan = s.street === 'preflop' ? `draw:${simpleDiscard(me.hole).join('')}` : 'draw:';
    return drawEquity(s, seat, samples, rng, floors, plan);
  }
  const known = new Set([...me.hole, ...s.board]);
  const unknown: number[] = [];
  for (let c = 0; c < 52; c++) if (!known.has(c)) unknown.push(c);
  const score = (hole: readonly number[], board: readonly number[]) =>
    omaha ? omahaScore(hole, board) : bestScore([...hole, ...board]);
  let total = 0;
  const pool = unknown.slice();
  for (let k = 0; k < samples; k++) {
    // Deal each opponent from the front of the pool (a partial Fisher–Yates shuffle), redrawing a
    // hand that is too weak for their betting a few times.
    let used = 0;
    const hands: number[][] = [];
    for (const floor of floors) {
      let hand: number[] = [];
      for (let attempt = 0; attempt < 12; attempt++) {
        for (let i = used; i < used + holeSize; i++) {
          const j = i + rng.int(pool.length - i);
          [pool[i], pool[j]] = [pool[j]!, pool[i]!];
        }
        hand = pool.slice(used, used + holeSize);
        if (floor === 0 || holdingStrength(hand, s.board) >= floor) break;
      }
      hands.push(hand);
      used += holeSize;
    }
    const need = 5 - s.board.length;
    for (let i = used; i < used + need; i++) {
      const j = i + rng.int(pool.length - i);
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    const board = [...s.board, ...pool.slice(used, used + need)];
    const mine = score(me.hole, board);
    let best = 0;
    let ties = 0;
    for (const hand of hands) {
      const v = score(hand, board);
      if (v > best) {
        best = v;
        ties = 0;
      }
      if (v === best) ties++;
    }
    if (mine > best) total += 1;
    else if (mine === best) total += 1 / (ties + 1);
  }
  return total / samples;
}

export interface PokerStyle {
  id: string;
  label: string;
  samples: number;
  /** Deal opponents hands that fit their betting. */
  ranges: boolean;
  /**
   * Edge needed to bet or raise for value, as a share of the way from a fair share of the pot
   * (1 / players in the hand) to a sure win: 0.12 means 56% heads-up, 27% six-handed.
   */
  valueAt: number;
  /** Extra equity demanded over the pot odds before calling (negative = loose). */
  callMargin: number;
  /** Chance to bluff when checked to with weak hands. */
  bluff: number;
  /** Raise size as a share of the pot. */
  sizing: number;
}

export const STYLES: Record<'easy' | 'medium' | 'hard', PokerStyle> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    samples: 60,
    ranges: false,
    valueAt: 0.6,
    callMargin: -0.2,
    bluff: 0,
    sizing: 0.5,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    samples: 160,
    ranges: true,
    valueAt: 0.12,
    callMargin: 0.02,
    bluff: 0.02,
    sizing: 0.8,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    samples: 320,
    ranges: true,
    valueAt: 0.06,
    callMargin: 0,
    bluff: 0.04,
    sizing: 1,
  },
};

/** Chooses an action for the seat to act. */
export function styleAction(s: PokerState, style: PokerStyle, rng: Rng): string {
  const legal = legalPokerActions(s);
  if (legal[0] === 'next') return 'next';
  const seat = s.toAct;
  const contenders = s.seats.filter((x) => !x.out && !x.folded).length;
  if (s.street === 'draw') {
    const hole = s.seats[seat]!.hole;
    return style.id === 'easy'
      ? `draw:${simpleDiscard(hole).join('')}`
      : bestDiscard(s, seat, style.samples, rng);
  }
  let equity = estimateEquity(s, seat, style.samples, rng, style.ranges);
  // Strength relative to a fair share against this many opponents.
  const fair = 1 / contenders;
  const edge = () => (equity - fair) / (1 - fair);
  const owe = toCall(s, seat);
  const pot = potSize(s);
  const odds = owe / (pot + owe);
  const range = raiseRange(s);
  const raiseTo = (share: number) => {
    if (!range) return null;
    const target = s.currentBet + Math.round((pot + owe) * share);
    return `raise:${Math.min(range[1], Math.max(range[0], target))}`;
  };
  // Late position plays a little looser (Hard only).
  if (style.id === 'hard') {
    const n = s.seats.length;
    const fromButton = (seat - s.button + n) % n;
    if (fromButton === 0) equity += 0.03;
  }
  // Fixed-limit bets are small next to the pot: slow-plays and bluffs (which rarely make anyone
  // fold for one more small bet) do not pay.
  const fixed = s.variant === 'draw';
  // There, betting very thin hands into several callers costs more than it earns.
  const valueAt = fixed ? Math.max(style.valueAt, 0.1) : style.valueAt;
  if (edge() >= valueAt && range) {
    // Very strong hands go bigger; Hard sometimes slow-plays by just calling or checking.
    if (style.id === 'hard' && !fixed && edge() > 0.7 && rng.chance(0.25))
      return owe > 0 ? 'call' : 'check';
    const raise = raiseTo(edge() > 0.7 ? style.sizing * 1.5 : style.sizing);
    if (raise) return raise;
  }
  if (owe === 0) {
    const bluff = fixed ? style.bluff / 4 : style.bluff;
    if (range && rng.chance(bluff) && equity < fair) return raiseTo(style.sizing) ?? 'check';
    return 'check';
  }
  if (equity >= odds + style.callMargin) return 'call';
  return 'fold';
}

export class PokerStyleAgent implements Agent<PokerState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  constructor(private readonly style: PokerStyle) {
    this.id = style.id;
    this.label = style.label;
  }
  selectAction(
    _env: GameEnvironment<PokerState, string>,
    s: PokerState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return styleAction(s, this.style, ctx.rng);
  }
}

export function pokerPresets(): AgentPreset<PokerState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Picks any legal action.', es: 'Elige cualquier acción legal.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'heuristic',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: 'A calling station: calls with most hands, raises only big ones, never bluffs.',
        es: 'Un “pagador”: iguala casi todo, solo sube con manos muy fuertes y nunca farolea.',
      },
      create: () => new PokerStyleAgent(STYLES.easy),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: 'Estimates its equity and plays the pot odds; bets strong hands, bluffs rarely.',
        es: 'Estima su equidad y juega según las probabilidades del bote; apuesta fuerte y farolea poco.',
      },
      create: () => new PokerStyleAgent(STYLES.medium),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: 'More precise equity, position, bigger value bets, slow-plays and bluffs.',
        es: 'Equidad más precisa, posición, apuestas de valor mayores, juego lento y faroles.',
      },
      create: () => new PokerStyleAgent(STYLES.hard),
    },
  ];
}
