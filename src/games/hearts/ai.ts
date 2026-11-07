/**
 * Hearts opponents. They see only their own hand, the cards played so far and the cards they
 * passed. Easy plays its lowest card (dumping its highest when void) and passes its three highest.
 * Medium ducks under the winning card, dumps the queen of spades and high hearts when void, leads
 * low from short suits and flushes the queen with low spades. Hard samples deals of the unseen
 * cards consistent with what it knows (suits players showed out of, cards it passed), plays each
 * of its options to the end of the hand with Medium for everyone, and picks the card that gives it
 * the fewest points on average.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { HEARTS, SPADES, makeCard, suitOf } from '../shared/cards/cards';
import { highRank, trickWinner } from '../shared/tricks/cards';
import {
  QUEEN_OF_SPADES,
  applyHeartsAction,
  passOffset,
  playableCards,
  type HeartsState,
} from './engine';

const ACE_OF_SPADES = makeCard(SPADES, 1);
const KING_OF_SPADES = makeCard(SPADES, 13);

const lowest = (cards: readonly number[]) =>
  cards.reduce((a, b) => (highRank(b) < highRank(a) ? b : a));
const highest = (cards: readonly number[]) =>
  cards.reduce((a, b) => (highRank(b) > highRank(a) ? b : a));

/** Cards played so far this hand (taken in tricks and in the current trick). */
export function playedCards(s: HeartsState): Set<number> {
  return new Set([...s.taken.flat(), ...s.trick.map((p) => p.card)]);
}

export function easyPlay(s: HeartsState): number {
  const legal = playableCards(s);
  if (s.trick.length && legal.some((c) => suitOf(c) === suitOf(s.trick[0]!.card)))
    return lowest(legal);
  return s.trick.length ? highest(legal) : lowest(legal);
}

export function mediumPlay(s: HeartsState): number {
  const legal = playableCards(s);
  if (legal.length === 1) return legal[0]!;
  const hand = s.hands[s.toAct]!;
  const played = playedCards(s);
  const queenOut = !played.has(QUEEN_OF_SPADES) && !hand.includes(QUEEN_OF_SPADES);
  if (s.trick.length === 0) {
    // Flush the queen with low spades when we do not hold it or the cards above it.
    const lowSpades = legal.filter((c) => suitOf(c) === SPADES && highRank(c) < 12);
    if (
      queenOut &&
      lowSpades.length &&
      !hand.includes(ACE_OF_SPADES) &&
      !hand.includes(KING_OF_SPADES)
    )
      return lowest(lowSpades);
    // Otherwise lead low from the shortest suit, keeping away from hearts and high spades.
    const safe = legal.filter(
      (c) => suitOf(c) !== HEARTS && !(suitOf(c) === SPADES && highRank(c) >= 12 && queenOut),
    );
    const pool = safe.length ? safe : legal;
    const count = (c: number) => hand.filter((x) => suitOf(x) === suitOf(c)).length;
    return pool.reduce((a, b) =>
      count(b) < count(a) || (count(b) === count(a) && highRank(b) < highRank(a)) ? b : a,
    );
  }
  const led = suitOf(s.trick[0]!.card);
  const following = legal.some((c) => suitOf(c) === led);
  if (!following) {
    if (legal.includes(QUEEN_OF_SPADES)) return QUEEN_OF_SPADES;
    // While the queen is still out, the ace and king of spades are liabilities.
    if (queenOut) {
      const bigSpade = legal.find((c) => c === ACE_OF_SPADES || c === KING_OF_SPADES);
      if (bigSpade !== undefined) return bigSpade;
    }
    const hearts = legal.filter((c) => suitOf(c) === HEARTS);
    return highest(hearts.length ? hearts : legal);
  }
  const winning = highRank(trickWinner(s.trick).card);
  // Spades led and someone above the queen is already in the trick: drop the queen on them.
  if (led === SPADES && legal.includes(QUEEN_OF_SPADES) && winning > 12) return QUEEN_OF_SPADES;
  const under = legal.filter((c) => highRank(c) < winning);
  if (under.length) return highest(under);
  if (s.trick.length === 3) {
    // We take this trick anyway: take it with our highest card, but never with the queen.
    const notQueen = legal.filter((c) => c !== QUEEN_OF_SPADES);
    return highest(notQueen.length ? notQueen : legal);
  }
  const notQueen = legal.filter((c) => c !== QUEEN_OF_SPADES);
  return lowest(notQueen.length ? notQueen : legal);
}

/** Three cards to pass: Easy the highest; others the dangerous spades, high hearts, a short suit. */
export function choosePass(hand: readonly number[], smart: boolean): number[] {
  if (!smart)
    return [...hand]
      .sort((a, b) => highRank(b) - highRank(a))
      .slice(0, 3)
      .sort((a, b) => a - b);
  const out: number[] = [];
  const add = (c: number) => {
    if (out.length < 3 && !out.includes(c)) out.push(c);
  };
  const spades = hand.filter((c) => suitOf(c) === SPADES);
  if (spades.length < 5)
    for (const c of [QUEEN_OF_SPADES, ACE_OF_SPADES, KING_OF_SPADES]) if (hand.includes(c)) add(c);
  hand
    .filter((c) => suitOf(c) === HEARTS && highRank(c) >= 11)
    .sort((a, b) => highRank(b) - highRank(a))
    .forEach(add);
  // Try to empty the shortest minor suit.
  const minors = [2, 3].map((st) => hand.filter((c) => suitOf(c) === st));
  minors.sort((a, b) => a.length - b.length);
  for (const suit of minors)
    if (suit.length && suit.length <= 3 - out.length)
      [...suit].sort((a, b) => highRank(b) - highRank(a)).forEach(add);
  [...hand].sort((a, b) => highRank(b) - highRank(a)).forEach(add);
  return out.sort((a, b) => a - b);
}

/** A deal of the unseen cards to the other seats consistent with what `me` knows. */
export function sampleWorld(s: HeartsState, me: number, rng: Rng): HeartsState {
  const played = playedCards(s);
  const capacity = s.hands.map((h) => h.length);
  const base: number[][] = [[], [], [], []];
  base[me] = [...s.hands[me]!];
  // The cards we passed are still with their receiver unless played.
  const offset = passOffset(s.handNo);
  const known = new Set<number>(s.hands[me]);
  if (offset !== 0 && s.passes[me] && s.phase === 'play')
    for (const c of s.passes[me]!)
      if (!played.has(c)) {
        base[(me + offset) % 4]!.push(c);
        known.add(c);
      }
  const unknown: number[] = [];
  for (let c = 0; c < 52; c++) if (!played.has(c) && !known.has(c)) unknown.push(c);
  for (let attempt = 0; attempt <= 30; attempt++) {
    const hands = base.map((h) => [...h]);
    // Deal the most constrained cards first (suits that more players have shown out of).
    const eligible = (c: number) =>
      [0, 1, 2, 3].filter((p) => p !== me && !s.shownOut[p]!.includes(suitOf(c))).length;
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

/** Plays the rest of the hand with Medium for everyone; returns each seat's points. */
export function playOut(s: HeartsState): number[] {
  let x = s;
  while (x.phase === 'play') x = applyHeartsAction(x, `play:${mediumPlay(x)}`);
  return x.handPoints ?? [0, 0, 0, 0];
}

/** Hard: the card with the fewest expected points over sampled deals. */
export function searchPlay(
  s: HeartsState,
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
      const points = playOut(applyHeartsAction(world, `play:${card}`));
      // Points relative to the others: a moon shot by us scores best.
      totals[i]! += points[me]! - (points.reduce((a, b) => a + b, 0) - points[me]!) / 3;
    });
  }
  let best = 0;
  totals.forEach((v, i) => {
    if (v < totals[best]!) best = i;
  });
  return { card: legal[best]!, nodes: samples * legal.length };
}

type Level = 'easy' | 'medium' | 'hard';

/** The move a level makes in a state (pass or play). */
export function levelAction(s: HeartsState, level: Level, rng: Rng): string {
  if (s.phase === 'done') return 'next';
  if (s.phase === 'pass')
    return `pass:${choosePass(s.hands[s.toAct]!, level !== 'easy').join('.')}`;
  if (level === 'easy') return `play:${easyPlay(s)}`;
  if (level === 'medium') return `play:${mediumPlay(s)}`;
  return `play:${searchPlay(s, HARD_SAMPLES, rng).card}`;
}

export const HARD_SAMPLES = 24;

export class HeartsAgent implements Agent<HeartsState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<HeartsState, string>,
    s: HeartsState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (this.level === 'hard' && s.phase === 'play') {
      const found = searchPlay(s, HARD_SAMPLES, ctx.rng);
      this.lastStats = { nodes: found.nodes };
      return `play:${found.card}`;
    }
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<HeartsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal card.', es: 'Cualquier carta legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Plays its lowest card, dumps its highest when void, passes its three highest.',
      es: 'Juega su carta más baja, suelta la más alta cuando falla y pasa sus tres más altas.',
    },
    create: () => new HeartsAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Ducks tricks, dumps the queen of spades and high hearts, flushes the queen.',
      es: 'Esquiva bazas, suelta la reina de picas y los corazones altos y caza la reina.',
    },
    create: () => new HeartsAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Simulates the rest of the hand over sampled deals of the cards it cannot see.',
      es: 'Simula el resto de la mano sobre repartos posibles de las cartas que no ve.',
    },
    create: () => new HeartsAgent('hard', 'Hard', 'hard'),
  },
];
