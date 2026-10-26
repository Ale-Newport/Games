/**
 * Cribbage opponents. They see their own cards, the starter once cut, and the cards laid.
 *
 * - Easy throws its two highest cards to the crib and lays its lowest playable card.
 * - Medium keeps the four cards that score best on their own (plus a bonus for fives and pairs it
 *   throws into its own crib, minus the same for the opponent's crib) and pegs greedily: the most
 *   points now, avoiding counts of 5 and 21 (a ten makes 15 or 31) and cards that invite a pair.
 * - Hard keeps the four cards with the best average over every possible starter, including an
 *   estimate of the two cards' worth in the crib, and pegs by points now minus the opponent's
 *   average best reply over the cards it has not seen.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { rankOf } from '../shared/cards/cards';
import { countOf, cribOptions, playable, type CribbageState } from './engine';
import { pegPoints, pipValue, scoreShow } from './scoring';

/** A rough worth of two cards in a crib (fives, pairs, fifteens, neighbours). */
export function cribWorth(a: number, b: number): number {
  let w = 0;
  if (rankOf(a) === 5) w += 1.5;
  if (rankOf(b) === 5) w += 1.5;
  if (rankOf(a) === rankOf(b)) w += 2;
  if (pipValue(a) + pipValue(b) === 15) w += 2;
  if (Math.abs(rankOf(a) - rankOf(b)) <= 2 && rankOf(a) !== rankOf(b)) w += 1;
  return w + 3.5;
}

/** Points of four cards without a starter (fifteens, pairs, runs, a flush). */
const fourCardScore = (hand: readonly number[]) => scoreShow(hand.slice(0, 3), hand[3]!).total;

export function chooseCrib(s: CribbageState, level: 'easy' | 'medium' | 'hard'): string {
  const hand = s.hands[s.toAct]!;
  const own = s.toAct === s.dealer;
  if (level === 'easy') {
    const two = [...hand].sort((a, b) => pipValue(b) - pipValue(a) || b - a).slice(0, 2);
    return `crib:${two.sort((a, b) => a - b).join('.')}`;
  }
  const seen = new Set(hand);
  let best = '';
  let bestValue = -Infinity;
  for (const option of cribOptions(hand)) {
    const thrown = option.slice(5).split('.').map(Number);
    const kept = hand.filter((c) => !thrown.includes(c));
    let value: number;
    if (level === 'hard') {
      let total = 0;
      let n = 0;
      for (let starter = 0; starter < 52; starter++) {
        if (seen.has(starter)) continue;
        total += scoreShow(kept, starter).total;
        n++;
      }
      value = total / n;
    } else value = fourCardScore(kept);
    const crib = cribWorth(thrown[0]!, thrown[1]!);
    value += own ? crib : -crib;
    if (value > bestValue) {
      bestValue = value;
      best = option;
    }
  }
  return best;
}

/** Cards the player to act has not seen (not in its hand, not laid, not the starter). */
function unseen(s: CribbageState): number[] {
  const seen = new Set([...s.hands[s.toAct]!, ...s.kept[s.toAct]!, ...s.played.map((p) => p.card)]);
  if (s.starter !== null) seen.add(s.starter);
  const out: number[] = [];
  for (let c = 0; c < 52; c++) if (!seen.has(c)) out.push(c);
  return out;
}

export function choosePlay(s: CribbageState, level: 'easy' | 'medium' | 'hard'): number {
  const cards = playable(s);
  if (cards.length === 1 || level === 'easy')
    return cards.reduce((a, b) => (pipValue(b) < pipValue(a) ? b : a));
  const pile = s.pile.map((p) => p.card);
  const count = countOf(s.pile);
  const pool = level === 'hard' ? unseen(s) : [];
  let best = cards[0]!;
  let bestValue = -Infinity;
  for (const card of cards) {
    const after = [...pile, card];
    const total = count + pipValue(card);
    let value = pegPoints(after) * 1.0;
    if (level === 'medium') {
      if (total === 5 || total === 21) value -= 1.2;
      if (total < 15 && total + 10 >= 15 && total !== 5) value -= 0.2;
      value -= 0.15; // a pair invited by any card
      if (after.length === 1 && rankOf(card) <= 4) value += 0.4; // lead low
      value += pipValue(card) * 0.02;
    } else if (pool.length) {
      // The opponent's average best reply over the cards we have not seen.
      let reply = 0;
      for (const c of pool) if (total + pipValue(c) <= 31) reply += pegPoints([...after, c]);
      value -= (reply / pool.length) * 4;
      value += pipValue(card) * 0.02;
    }
    if (value > bestValue) {
      bestValue = value;
      best = card;
    }
  }
  return best;
}

type Level = 'easy' | 'medium' | 'hard';

export function levelAction(s: CribbageState, level: Level): string {
  if (s.phase === 'show' || s.phase === 'done') return 'next';
  if (s.phase === 'crib') return chooseCrib(s, level);
  return `play:${choosePlay(s, level)}`;
}

export class CribbageAgent implements Agent<CribbageState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<CribbageState, string>,
    s: CribbageState,
    _player: PlayerId,
    _ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level);
  }
}

export const AGENT_PRESETS: AgentPreset<CribbageState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal throw and card.', es: 'Cualquier descarte y carta legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Throws its two highest cards and lays its lowest.',
      es: 'Echa sus dos cartas más altas a la cuna y juega la más baja.',
    },
    create: () => new CribbageAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Keeps its best four cards, minds the crib and pegs greedily but safely.',
      es: 'Guarda sus cuatro mejores cartas, piensa en la cuna y anota con cuidado.',
    },
    create: () => new CribbageAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'search',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Averages every possible starter for its throw and weighs your replies when pegging.',
      es: 'Promedia todos los cortes posibles para su descarte y sopesa tus respuestas al anotar.',
    },
    create: () => new CribbageAgent('hard', 'Hard', 'hard'),
  },
];
