/**
 * Gin rummy opponents. They see their own hand, the discard pile and which cards the opponent took
 * from it or threw away.
 *
 * - Easy takes the discard only when it lowers its deadwood, throws its highest deadwood card and
 *   knocks as soon as it may.
 * - Medium throws the card that leaves the least deadwood, avoiding cards that fit what the
 *   opponent has picked up, and knocks with 7 or less (any legal knock once the stock runs low).
 * - Hard rates each throw by the deadwood it expects after its next draw (averaged over the cards
 *   it has not seen) plus that danger, and before knocking samples the opponent's possible hands
 *   (with the cards they picked up) to estimate the undercut risk; it holds on for gin when the
 *   risk is high and the stock allows.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { rankOf, suitOf } from '../shared/cards/cards';
import { canKnockWith, discardable, type GinState } from './engine';
import { bestMelds, cardValue, deadwoodOf, layOff } from './melds';

/** Deadwood after throwing the best card from a hand of eleven. */
const bestAfterThrow = (hand: readonly number[], keep: number | null = null) =>
  Math.min(...hand.filter((c) => c !== keep).map((c) => deadwoodOf(hand.filter((x) => x !== c))));

/** How much a card would help the opponent: same rank or a suit neighbour of a card they took. */
function danger(s: GinState, card: number): number {
  const theirs = s.picks[1 - s.toAct]!;
  let d = 0;
  for (const c of theirs) {
    if (rankOf(c) === rankOf(card)) d += 3;
    else if (suitOf(c) === suitOf(card) && Math.abs(rankOf(c) - rankOf(card)) <= 2) d += 2;
  }
  return d;
}

/** Cards the player to act has not seen (not in its hand, the pile, or thrown). */
function unseen(s: GinState): number[] {
  const seen = new Set([...s.hands[s.toAct]!, ...s.discard, ...s.picks[1 - s.toAct]!]);
  const out: number[] = [];
  for (let c = 0; c < 52; c++) if (!seen.has(c)) out.push(c);
  return out;
}

export function easyDraw(s: GinState): string {
  const top = s.discard[s.discard.length - 1];
  if (top === undefined) return 'draw:stock';
  const hand = s.hands[s.toAct]!;
  return bestAfterThrow([...hand, top], top) < deadwoodOf(hand) ? 'draw:discard' : 'draw:stock';
}

export function mediumDraw(s: GinState): string {
  const top = s.discard[s.discard.length - 1];
  if (top === undefined) return 'draw:stock';
  const hand = s.hands[s.toAct]!;
  // Take the discard when it joins a meld (it then cannot be thrown straight back).
  const melded = bestMelds([...hand, top]).melds.some((m) => m.includes(top));
  return melded && bestAfterThrow([...hand, top], top) < deadwoodOf(hand)
    ? 'draw:discard'
    : 'draw:stock';
}

export function easyThrow(s: GinState): string {
  const options = discardable(s);
  const knock = options.find((c) => canKnockWith(s, c));
  if (knock !== undefined)
    return `knock:${options.filter((c) => canKnockWith(s, c)).reduce((a, b) => (deadwoodOf(s.hands[s.toAct]!.filter((x) => x !== b)) < deadwoodOf(s.hands[s.toAct]!.filter((x) => x !== a)) ? b : a))}`;
  const { deadwood } = bestMelds(s.hands[s.toAct]!);
  const pool = deadwood.filter((c) => options.includes(c));
  const pick = (pool.length ? pool : options).reduce((a, b) =>
    cardValue(b) > cardValue(a) ? b : a,
  );
  return `discard:${pick}`;
}

function throwScores(
  s: GinState,
  lookahead: boolean,
): { card: number; score: number; after: number }[] {
  const hand = s.hands[s.toAct]!;
  const pool = lookahead ? unseen(s) : [];
  return discardable(s).map((card) => {
    const rest = hand.filter((c) => c !== card);
    const after = deadwoodOf(rest);
    let score = after + danger(s, card) * 1.5;
    if (lookahead && pool.length) {
      // Expected deadwood after drawing one unseen card and throwing the best.
      const sample =
        pool.length > 24 ? pool.filter((_, i) => i % Math.ceil(pool.length / 24) === 0) : pool;
      const expected =
        sample.reduce((a, c) => a + Math.min(after, bestAfterThrow([...rest, c])), 0) /
        sample.length;
      score = expected + danger(s, card) * 1.5 + after * 0.25;
    }
    return { card, score, after };
  });
}

export function mediumThrow(s: GinState): string {
  const scores = throwScores(s, false);
  const best = scores.reduce((a, b) =>
    b.score < a.score || (b.score === a.score && cardValue(b.card) > cardValue(a.card)) ? b : a,
  );
  const lateGame = s.stock.length < 14;
  if (canKnockWith(s, best.card) && (best.after <= 7 || lateGame)) return `knock:${best.card}`;
  return `discard:${best.card}`;
}

/** The chance that the opponent undercuts (or ties) a knock with `rest`, over sampled hands. */
export function undercutRisk(
  s: GinState,
  rest: readonly number[],
  samples: number,
  rng: Rng,
): number {
  const mine = bestMelds(rest);
  if (mine.points === 0) return 0;
  const known = s.picks[1 - s.toAct]!;
  const pool = unseen(s).filter((c) => !rest.includes(c));
  const size = s.hands[1 - s.toAct]!.length;
  let under = 0;
  for (let k = 0; k < samples; k++) {
    const hand = [...known, ...rng.shuffle([...pool]).slice(0, size - known.length)];
    const theirs = bestMelds(hand);
    const off = layOff(mine.melds, theirs.deadwood);
    const left = theirs.deadwood
      .filter((c) => !off.laid.includes(c))
      .reduce((a, c) => a + cardValue(c), 0);
    if (left <= mine.points) under++;
  }
  return under / samples;
}

export function hardThrow(s: GinState, rng: Rng): string {
  const scores = throwScores(s, true);
  const best = scores.reduce((a, b) => (b.score < a.score ? b : a));
  // The best knock, if any: the lowest deadwood after the throw.
  const knocks = scores.filter((x) => canKnockWith(s, x.card));
  if (knocks.length) {
    const k = knocks.reduce((a, b) => (b.after < a.after ? b : a));
    const rest = s.hands[s.toAct]!.filter((c) => c !== k.card);
    if (k.after === 0) return `knock:${k.card}`;
    const risk = undercutRisk(s, rest, 30, rng);
    if (risk < 0.2 || s.stock.length < 12 || (risk < 0.35 && k.after <= 4))
      return `knock:${k.card}`;
  }
  return `discard:${best.card}`;
}

type Level = 'easy' | 'medium' | 'hard';

export function levelAction(s: GinState, level: Level, rng: Rng): string {
  if (s.phase === 'done') return 'next';
  if (s.phase === 'draw') return level === 'easy' ? easyDraw(s) : mediumDraw(s);
  if (level === 'easy') return easyThrow(s);
  if (level === 'medium') return mediumThrow(s);
  return hardThrow(s, rng);
}

export class GinAgent implements Agent<GinState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<GinState, string>,
    s: GinState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<GinState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any legal draw, throw or knock.',
      es: 'Cualquier robo, descarte o llamada legal.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Throws its highest loose card and knocks as soon as it may.',
      es: 'Descarta su carta suelta más alta y llama en cuanto puede.',
    },
    create: () => new GinAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Keeps its deadwood lowest, avoids feeding your melds, knocks with 7 or less.',
      es: 'Mantiene la menor madera, evita darte cartas útiles y llama con 7 o menos.',
    },
    create: () => new GinAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Looks one draw ahead and weighs the undercut risk before knocking.',
      es: 'Mira un robo por delante y sopesa el riesgo de undercut antes de llamar.',
    },
    create: () => new GinAgent('hard', 'Hard', 'hard'),
  },
];
