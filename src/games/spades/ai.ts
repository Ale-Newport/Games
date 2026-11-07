/**
 * Spades opponents. They see their own hand, the bids, the cards played and the suits each player
 * has shown out of.
 *
 * - Easy bids its aces, kings and spades loosely and plays its lowest card, or its lowest winner
 *   when its side still needs tricks.
 * - Medium bids from an estimate of its tricks (high cards by suit length, long spades, short side
 *   suits it can trump), bids nil with a hand of low cards, and plays as a partner: never over a
 *   partner who is winning, wins tricks its side needs with the cheapest winning card, ducks once
 *   the contract is made (bags cost), protects a nil partner and hides from tricks when nil itself.
 * - Hard bids the tricks it takes on average over sampled deals played out by Medium, and in play
 *   picks the card with the best average hand score (its side minus the other) over sampled deals.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { SPADES, suitOf } from '../shared/cards/cards';
import { highRank, trickWinner } from '../shared/tricks/cards';
import { applySpadesAction, playableCards, scoreHand, teamOf, type SpadesState } from './engine';

/** The cheapest card: side suits before spades, then the lowest rank. */
const cost = (c: number) => (suitOf(c) === SPADES ? 100 : 0) + highRank(c);
const lowest = (cards: readonly number[]) => cards.reduce((a, b) => (cost(b) < cost(a) ? b : a));
const highest = (cards: readonly number[]) =>
  cards.reduce((a, b) => (highRank(b) > highRank(a) ? b : a));

/** Expected tricks of a hand (a quick count). */
export function estimateTricks(hand: readonly number[]): number {
  let t = 0;
  const bySuit = [0, 1, 2, 3].map((st) =>
    hand
      .filter((c) => suitOf(c) === st)
      .map(highRank)
      .sort((a, b) => b - a),
  );
  const spades = bySuit[SPADES]!;
  for (const st of [1, 2, 3]) {
    const ranks = bySuit[st]!;
    const len = ranks.length;
    if (ranks.includes(14) && len <= 6) t += 1;
    if (ranks.includes(13) && len >= 2 && len <= 5) t += 0.8;
    if (ranks.includes(12) && len >= 3 && len <= 4) t += 0.35;
  }
  if (spades.includes(14)) t += 1;
  if (spades.includes(13) && spades.length >= 2) t += 0.9;
  if (spades.includes(12) && spades.length >= 3) t += 0.6;
  t += Math.max(0, spades.length - 3) * 0.85;
  // Short side suits let spare spades ruff.
  const spare = Math.max(0, spades.length - 2);
  const shortness = [1, 2, 3].reduce((a, st) => a + Math.max(0, 2 - bySuit[st]!.length), 0);
  t += Math.min(spare, shortness) * 0.6;
  return t;
}

/** A hand fit to bid nil: no high spades, few spades, no aces or kings. */
export function nilWorthy(hand: readonly number[]): boolean {
  const spades = hand.filter((c) => suitOf(c) === SPADES);
  if (spades.length > 3 || spades.some((c) => highRank(c) >= 10)) return false;
  return !hand.some((c) => highRank(c) >= 13) && hand.filter((c) => highRank(c) >= 11).length <= 2;
}

export function mediumBid(s: SpadesState): number {
  const hand = s.hands[s.toAct]!;
  const partner = s.bids[(s.toAct + 2) % 4];
  if (nilWorthy(hand) && partner !== 0) return 0;
  return Math.max(1, Math.round(estimateTricks(hand)));
}

export function easyBid(s: SpadesState): number {
  const hand = s.hands[s.toAct]!;
  const big = hand.filter((c) => highRank(c) >= 13).length;
  const spades = hand.filter((c) => suitOf(c) === SPADES).length;
  return Math.max(1, Math.min(13, big + Math.floor(spades / 3)));
}

/** What the side of `seat` still needs (its contract minus the tricks of its non-nil bidders). */
function need(s: SpadesState, seat: number): number {
  const seats = [teamOf(seat), teamOf(seat) + 2];
  const contract = seats.reduce((a, i) => a + (s.bids[i] ?? 0), 0);
  const taken = seats.reduce((a, i) => a + (s.bids[i] === 0 ? 0 : s.tricks[i]!), 0);
  return contract - taken;
}

/** The cheapest card that would win the trick as it stands, if any. */
function cheapestWinner(s: SpadesState, legal: readonly number[]): number | null {
  const seat = s.toAct;
  const winners = legal.filter(
    (c) => trickWinner([...s.trick, { seat, card: c }], SPADES).seat === seat,
  );
  if (!winners.length) return null;
  return winners.reduce((a, b) => {
    const sa = suitOf(a) === SPADES ? 1 : 0;
    const sb = suitOf(b) === SPADES ? 1 : 0;
    return sb < sa || (sb === sa && highRank(b) < highRank(a)) ? b : a;
  });
}

/** The highest card that still loses the trick (to dump safely), if any. */
function highestLoser(s: SpadesState, legal: readonly number[]): number | null {
  const seat = s.toAct;
  const losers = legal.filter(
    (c) => s.trick.length > 0 && trickWinner([...s.trick, { seat, card: c }], SPADES).seat !== seat,
  );
  return losers.length ? highest(losers) : null;
}

export function easyPlay(s: SpadesState): number {
  const legal = playableCards(s);
  if (need(s, s.toAct) > 0 && s.trick.length) {
    const w = cheapestWinner(s, legal);
    if (w !== null) return w;
  }
  return lowest(legal);
}

export function mediumPlay(s: SpadesState): number {
  const legal = playableCards(s);
  if (legal.length === 1) return legal[0]!;
  const seat = s.toAct;
  const partner = (seat + 2) % 4;
  const nil = s.bids[seat] === 0;
  const partnerNil = s.bids[partner] === 0 && s.tricks[partner] === 0;
  const needed = need(s, seat);
  if (s.trick.length === 0) {
    if (nil) return lowest(legal);
    // Lead winners while tricks are needed; otherwise low from the longest side suit.
    const aces = legal.filter((c) => highRank(c) === 14 && suitOf(c) !== SPADES);
    if ((needed > 0 || partnerNil) && aces.length) return aces[0]!;
    const side = legal.filter((c) => suitOf(c) !== SPADES);
    const pool = side.length ? side : legal;
    const length = (c: number) => s.hands[seat]!.filter((x) => suitOf(x) === suitOf(c)).length;
    return pool.reduce((a, b) =>
      length(b) > length(a) || (length(b) === length(a) && highRank(b) < highRank(a)) ? b : a,
    );
  }
  const current = trickWinner(s.trick, SPADES);
  const partnerWinning = current.seat === partner;
  if (nil) return highestLoser(s, legal) ?? lowest(legal);
  if (partnerNil && partnerWinning) {
    // Take the trick off a nil partner.
    const w = cheapestWinner(s, legal);
    if (w !== null) return w;
  }
  if (partnerWinning && !partnerNil) {
    // Partner has it: stay out of the way (but a later opponent may still overtake).
    return lowest(legal);
  }
  if (needed > 0 || partnerNil) {
    const w = cheapestWinner(s, legal);
    if (w !== null) return w;
    return lowest(legal);
  }
  // Contract made: avoid bags.
  return highestLoser(s, legal) ?? lowest(legal);
}

/** A deal of the unseen cards consistent with what `me` knows. */
export function sampleWorld(s: SpadesState, me: number, rng: Rng): SpadesState {
  const seen = new Set<number>([...s.hands[me]!, ...s.trick.map((p) => p.card), ...playedCards(s)]);
  const unknown: number[] = [];
  for (let c = 0; c < 52; c++) if (!seen.has(c)) unknown.push(c);
  const capacity = s.hands.map((h) => h.length);
  const eligible = (c: number) =>
    [0, 1, 2, 3].filter((p) => p !== me && !s.shownOut[p]!.includes(suitOf(c))).length;
  for (let attempt = 0; attempt <= 30; attempt++) {
    const hands: number[][] = [[], [], [], []];
    hands[me] = [...s.hands[me]!];
    const order = rng.shuffle([...unknown]).sort((a, b) => eligible(a) - eligible(b));
    let ok = true;
    for (const c of order) {
      const options = [0, 1, 2, 3].filter(
        (p) =>
          p !== me &&
          hands[p]!.length < capacity[p]! &&
          (attempt === 30 || !s.shownOut[p]!.includes(suitOf(c))),
      );
      if (!options.length) {
        ok = false;
        break;
      }
      hands[options[rng.int(options.length)]!]!.push(c);
    }
    if (ok) return { ...s, hands };
  }
  return s;
}

/** Cards already played this hand (the completed tricks are not stored, so rebuild them). */
function playedCards(s: SpadesState): number[] {
  const out: number[] = [];
  const first = s.history.lastIndexOf('next') + 1;
  for (const a of s.history.slice(first)) if (a.startsWith('play:')) out.push(Number(a.slice(5)));
  return out;
}

/** Plays the hand out with Medium; returns the score difference for `seat`'s side. */
function playOut(s: SpadesState, seat: number): number {
  let x = s;
  while (x.phase === 'play') x = applySpadesAction(x, `play:${mediumPlay(x)}`);
  const r = x.result ?? scoreHand(x.bids as number[], x.tricks, x.bags);
  const team = teamOf(seat);
  return r.points[team] - r.points[(1 - team) as 0 | 1];
}

export const HARD_SAMPLES = 20;

export function searchPlay(
  s: SpadesState,
  samples: number,
  rng: Rng,
): { card: number; nodes: number } {
  const legal = playableCards(s);
  if (legal.length === 1) return { card: legal[0]!, nodes: 0 };
  const me = s.toAct;
  const totals = legal.map(() => 0);
  for (let k = 0; k < samples; k++) {
    const world = sampleWorld(s, me, rng);
    legal.forEach((card, i) => {
      totals[i]! += playOut(applySpadesAction(world, `play:${card}`), me);
    });
  }
  let best = 0;
  totals.forEach((v, i) => {
    if (v > totals[best]!) best = i;
  });
  return { card: legal[best]!, nodes: samples * legal.length };
}

/** Hard's bid: the tricks it takes on average when sampled deals are played out by Medium. */
export function searchBid(s: SpadesState, samples: number, rng: Rng): number {
  const me = s.toAct;
  const hand = s.hands[me]!;
  if (nilWorthy(hand) && s.bids[(me + 2) % 4] !== 0) return 0;
  let tricks = 0;
  for (let k = 0; k < samples; k++) {
    let x = sampleWorld(s, me, rng);
    // Everyone still to bid bids like Medium; then the hand is played out.
    while (x.phase === 'bid') {
      const b = x.toAct === me ? Math.max(1, Math.round(estimateTricks(hand))) : mediumBid(x);
      x = applySpadesAction(x, `bid:${b}`);
    }
    while (x.phase === 'play') x = applySpadesAction(x, `play:${mediumPlay(x)}`);
    tricks += x.tricks[me]!;
  }
  // Shade the average down a little: a set costs more than a bag.
  return Math.max(1, Math.round(tricks / samples - 0.25));
}

type Level = 'easy' | 'medium' | 'hard';

export function levelAction(s: SpadesState, level: Level, rng: Rng): string {
  if (s.phase === 'done') return 'next';
  if (s.phase === 'bid')
    return `bid:${level === 'easy' ? easyBid(s) : level === 'medium' ? mediumBid(s) : searchBid(s, 12, rng)}`;
  if (level === 'easy') return `play:${easyPlay(s)}`;
  if (level === 'medium') return `play:${mediumPlay(s)}`;
  return `play:${searchPlay(s, HARD_SAMPLES, rng).card}`;
}

export class SpadesAgent implements Agent<SpadesState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<SpadesState, string>,
    s: SpadesState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<SpadesState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal bid and card.', es: 'Cualquier puja y carta legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Bids its aces, kings and spades roughly; plays low unless its side needs the trick.',
      es: 'Puja a ojo sus ases, reyes y picas; juega bajo salvo que su pareja necesite la baza.',
    },
    create: () => new SpadesAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Counts its tricks to bid (nil with weak hands) and plays as a partner, avoiding bags.',
      es: 'Cuenta sus bazas para pujar (nil con manos flojas) y juega en pareja evitando sacos.',
    },
    create: () => new SpadesAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Bids and plays by simulating sampled deals of the cards it cannot see.',
      es: 'Puja y juega simulando repartos posibles de las cartas que no ve.',
    },
    create: () => new SpadesAgent('hard', 'Hard', 'hard'),
  },
];
