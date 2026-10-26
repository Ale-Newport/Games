/**
 * Euchre opponents. They see their own hand, the upcard, the bidding and the cards played.
 *
 * - Bidding: a hand is valued for a trump suit (right bower 3, left 2.5, trump ace 1.8, king 1.4,
 *   queen 1.1, ten 0.9, nine 0.8, side aces 1, a void with two or more trumps 0.5); in round one the
 *   upcard counts for the dealer's side (in the dealer's own hand, or half for the partner, minus
 *   half for the other side). A player orders or names trump above a threshold (Easy 6.5, Medium
 *   5.5, Hard 5.2) and goes alone above 9 holding the right bower. A stuck dealer names its best suit.
 * - The dealer throws its lowest side card, preferring to make a void.
 * - Medium plays: the makers lead trump with the right bower or two trumps, otherwise side aces;
 *   stays low under a winning partner, wins as cheaply as it can, trumps in when void, discards low.
 * - Hard plays each legal card out over sampled deals of the unseen cards (respecting shown-out
 *   suits and the dealer's upcard) with Medium for everyone, keeping the best average hand score.
 * - Easy plays its lowest legal card unless it can win the trick cheaply.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { rankOf, suitOf } from '../shared/cards/cards';
import {
  EUCHRE_DECK,
  applyEuchreAction,
  cardPower,
  effectiveSuit,
  playableCards,
  sittingOut,
  teamOf,
  type EuchreState,
} from './engine';

type Level = 'easy' | 'medium' | 'hard';
const THRESHOLD: Record<Level, number> = { easy: 6.5, medium: 5.5, hard: 5.2 };

/** The value of a hand with `trump` as trump. */
export function handValue(hand: readonly number[], trump: number): number {
  let v = 0;
  let trumps = 0;
  for (const c of hand) {
    const p = cardPower(c, trump, null);
    if (p === 100) v += 3;
    else if (p === 99) v += 2.5;
    else if (p >= 80) {
      const r = p - 80;
      v += r === 14 ? 1.8 : r === 13 ? 1.4 : r === 12 ? 1.1 : r === 10 ? 0.9 : 0.8;
    } else if (rankOf(c) === 1) v += 1;
    if (effectiveSuit(c, trump) === trump) trumps++;
  }
  if (trumps >= 2)
    for (let suit = 0; suit < 4; suit++)
      if (suit !== trump && !hand.some((c) => effectiveSuit(c, trump) === suit)) v += 0.5;
  return v;
}

/** The weakest card of a hand for a trump suit (the dealer's throw). */
export function worstCard(hand: readonly number[], trump: number): number {
  const sideCount = (c: number) =>
    hand.filter((x) => effectiveSuit(x, trump) === effectiveSuit(c, trump)).length;
  const score = (c: number) => {
    if (effectiveSuit(c, trump) === trump) return 1000 + cardPower(c, trump, null);
    if (rankOf(c) === 1) return 500;
    // Lower cards and singletons go first (they make a void).
    return cardPower(c, trump, null) + (sideCount(c) === 1 ? -20 : 0);
  };
  return hand.reduce((a, b) => (score(b) < score(a) ? b : a));
}

export function bidAction(s: EuchreState, level: Level): string {
  const me = s.toAct;
  const hand = s.hands[me]!;
  const threshold = THRESHOLD[level];
  if (s.phase === 'round1') {
    const trump = suitOf(s.upcard);
    let value: number;
    if (me === s.dealer) {
      const seven = [...hand, s.upcard];
      const thrown = worstCard(seven, trump);
      value = handValue(
        seven.filter((c) => c !== thrown),
        trump,
      );
    } else {
      value = handValue(hand, trump);
      const upcard = cardPower(s.upcard, trump, null) >= 99 ? 1.5 : 0.6;
      value += teamOf(s.dealer) === teamOf(me) ? upcard / 2 : -upcard / 2;
    }
    if (value >= threshold) return value >= 9 && hasRight(hand, trump) ? 'order-alone' : 'order';
    return 'pass';
  }
  let best = -1;
  let bestValue = -Infinity;
  for (let suit = 0; suit < 4; suit++) {
    if (suit === suitOf(s.upcard)) continue;
    const v = handValue(hand, suit);
    if (v > bestValue) {
      bestValue = v;
      best = suit;
    }
  }
  if (bestValue >= threshold || me === s.dealer)
    return bestValue >= 9 && hasRight(hand, best) ? `name-alone:${best}` : `name:${best}`;
  return 'pass';
}

const hasRight = (hand: readonly number[], trump: number) =>
  hand.some((c) => cardPower(c, trump, null) === 100);

const lowest = (cards: readonly number[], trump: number | null) =>
  cards.reduce((a, b) => (cardPower(b, trump, null) < cardPower(a, trump, null) ? b : a));
const highest = (cards: readonly number[], trump: number | null) =>
  cards.reduce((a, b) => (cardPower(b, trump, null) > cardPower(a, trump, null) ? b : a));

function currentWinner(s: EuchreState) {
  const led = effectiveSuit(s.trick[0]!.card, s.trump);
  return s.trick.reduce((best, x) =>
    cardPower(x.card, s.trump, led) > cardPower(best.card, s.trump, led) ? x : best,
  );
}

function cheapestWinner(s: EuchreState, legal: readonly number[]): number | null {
  const led = effectiveSuit(s.trick[0]!.card, s.trump);
  const top = cardPower(currentWinner(s).card, s.trump, led);
  const winners = legal.filter((c) => cardPower(c, s.trump, led) > top);
  if (!winners.length) return null;
  return winners.reduce((a, b) =>
    cardPower(b, s.trump, led) < cardPower(a, s.trump, led) ? b : a,
  );
}

export function easyPlay(s: EuchreState): number {
  const legal = playableCards(s);
  if (s.trick.length) {
    const w = cheapestWinner(s, legal);
    if (w !== null && currentWinner(s).seat % 2 !== s.toAct % 2) return w;
  }
  return lowest(legal, s.trump);
}

export function mediumPlay(s: EuchreState): number {
  const legal = playableCards(s);
  if (legal.length === 1) return legal[0]!;
  const me = s.toAct;
  const trump = s.trump;
  const makers = teamOf(s.maker) === teamOf(me);
  if (!s.trick.length) {
    const trumps = legal.filter((c) => effectiveSuit(c, trump) === trump);
    if (makers && (trumps.length >= 2 || (trump !== null && hasRight(trumps, trump))))
      return highest(trumps, trump);
    const aces = legal.filter((c) => rankOf(c) === 1 && effectiveSuit(c, trump) !== trump);
    if (aces.length) return aces[0]!;
    const side = legal.filter((c) => effectiveSuit(c, trump) !== trump);
    return lowest(side.length ? side : legal, trump);
  }
  const winner = currentWinner(s);
  const partnerWinning = teamOf(winner.seat) === teamOf(me);
  const last = s.trick.length === (s.alone ? 2 : 3);
  if (
    partnerWinning &&
    (last || cardPower(winner.card, trump, null) >= 80 || rankOf(winner.card) === 1)
  )
    return lowest(legal, trump);
  const w = cheapestWinner(s, legal);
  if (w !== null) return w;
  return lowest(legal, trump);
}

/** Unseen cards dealt to the other active seats, consistent with what the seat to act knows. */
export function sampleWorld(s: EuchreState, rng: Rng): EuchreState {
  const me = s.toAct;
  const out = sittingOut(s);
  const known = new Set<number>([...s.hands[me]!]);
  const played: number[] = [];
  const first = s.history.lastIndexOf('next') + 1;
  for (const a of s.history.slice(first))
    if (a.startsWith('play:')) played.push(Number(a.slice(5)));
  for (const c of played) known.add(c);
  if (me === s.dealer && s.buried !== null) known.add(s.buried);
  // The upcard went to the dealer when trump was ordered (and is still there unless played).
  const ordered =
    s.trump === suitOf(s.upcard) && s.history.slice(first).some((a) => a.startsWith('order'));
  const others = [0, 1, 2, 3].filter((p) => p !== me && p !== out);
  const base = s.hands.map((h, p) => (p === me ? [...h] : []));
  if (ordered && s.dealer !== me && s.dealer !== out && !played.includes(s.upcard)) {
    base[s.dealer]!.push(s.upcard);
    known.add(s.upcard);
  }
  if (!ordered) known.add(s.upcard); // turned down: out of play
  const pool = EUCHRE_DECK.filter((c) => !known.has(c));
  const capacity = s.hands.map((h) => h.length);
  for (let attempt = 0; attempt <= 20; attempt++) {
    const hands = base.map((h) => [...h]);
    const order = rng.shuffle([...pool]);
    for (const c of order) {
      const options = others.filter(
        (p) =>
          hands[p]!.length < capacity[p]! &&
          (attempt === 20 || !s.shownOut[p]!.includes(effectiveSuit(c, s.trump))),
      );
      if (!options.length) continue; // the rest of the pool is the kitty
      hands[options[rng.int(options.length)]!]!.push(c);
    }
    if (others.every((p) => hands[p]!.length === capacity[p])) return { ...s, hands };
  }
  return s;
}

export const HARD_SAMPLES = 24;

export function searchPlay(s: EuchreState, rng: Rng): { card: number; nodes: number } {
  const legal = playableCards(s);
  if (legal.length === 1) return { card: legal[0]!, nodes: 0 };
  const team = teamOf(s.toAct);
  const totals = legal.map(() => 0);
  for (let k = 0; k < HARD_SAMPLES; k++) {
    const world = sampleWorld(s, rng);
    legal.forEach((card, i) => {
      let x = applyEuchreAction(world, `play:${card}`);
      while (x.phase === 'play') x = applyEuchreAction(x, `play:${mediumPlay(x)}`);
      const r = x.result!;
      totals[i]! += r.points[team] - r.points[(1 - team) as 0 | 1] + x.tricks[team] * 0.1;
    });
  }
  let best = 0;
  totals.forEach((v, i) => {
    if (v > totals[best]!) best = i;
  });
  return { card: legal[best]!, nodes: HARD_SAMPLES * legal.length };
}

export function levelAction(s: EuchreState, level: Level, rng: Rng): string {
  if (s.phase === 'done') return 'next';
  if (s.phase === 'round1' || s.phase === 'round2') return bidAction(s, level);
  if (s.phase === 'throw') return `throw:${worstCard(s.hands[s.dealer]!, s.trump!)}`;
  if (level === 'easy') return `play:${easyPlay(s)}`;
  if (level === 'medium') return `play:${mediumPlay(s)}`;
  return `play:${searchPlay(s, rng).card}`;
}

export class EuchreAgent implements Agent<EuchreState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<EuchreState, string>,
    s: EuchreState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<EuchreState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal call and card.', es: 'Cualquier voz y carta legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Calls trump only with strong hands and plays its lowest card unless it can win cheaply.',
      es: 'Solo hace triunfo con manos fuertes y juega su carta más baja salvo que pueda ganar barato.',
    },
    create: () => new EuchreAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Values its hand for each trump, leads trump as maker, and plays as a partner.',
      es: 'Valora su mano para cada triunfo, arrastra cuando lo hizo y juega en pareja.',
    },
    create: () => new EuchreAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Bids a little bolder and plays by simulating deals of the cards it cannot see.',
      es: 'Puja algo más atrevido y juega simulando repartos de las cartas que no ve.',
    },
    create: () => new EuchreAgent('hard', 'Hard', 'hard'),
  },
];
