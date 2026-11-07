/**
 * Crazy Eights opponents. They see their own hand, the pile, the hand sizes and which suits each
 * player could not follow when they drew.
 *
 * - Easy plays its first playable card (keeping eights for last), names its most common suit, and
 *   plays a drawn card whenever it can.
 * - Medium plays from its longest suit first, keeps eights until it has nothing else (or to go out),
 *   names its longest suit — or, when an opponent is close to going out, a suit that player could
 *   not follow — and prefers shedding high cards.
 * - Hard adds pressure on the next player: it keeps or switches play (by matching rank) to the
 *   suit that player could not follow at their latest draw, and names that suit with its eights.
 *   (Playing options out over sampled deals did not beat these rules: the draws decide too much.)
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { suitOf } from '../shared/cards/cards';
import { isEight, legalEightsActions, penalty, type EightsState } from './engine';

type Level = 'easy' | 'medium' | 'hard';

const suitCounts = (hand: readonly number[]) => {
  const out = [0, 0, 0, 0];
  for (const c of hand) if (!isEight(c)) out[suitOf(c)]!++;
  return out;
};
const longestSuit = (hand: readonly number[]) => {
  const counts = suitCounts(hand);
  return counts.indexOf(Math.max(...counts));
};

export function easyAction(s: EightsState): string {
  const legal = legalEightsActions(s);
  const plays = legal.filter((a) => a.startsWith('play:'));
  if (!plays.length) return legal[0]!;
  const plain = plays.filter((a) => a.split(':').length === 2);
  if (plain.length) return plain[0]!;
  const eight = plays[0]!.split(':')[1];
  return `play:${eight}:${longestSuit(s.hands[s.toAct]!.filter((c) => c !== Number(eight)))}`;
}

export function mediumAction(s: EightsState): string {
  const legal = legalEightsActions(s);
  const plays = legal.filter((a) => a.startsWith('play:'));
  if (!plays.length) return legal[0]!;
  const me = s.toAct;
  const hand = s.hands[me]!;
  const plain = plays.filter((a) => a.split(':').length === 2).map((a) => Number(a.slice(5)));
  const counts = suitCounts(hand);
  if (plain.length && !(hand.length === 1)) {
    // Longest suit first, then the highest penalty.
    const best = plain.reduce((a, b) => {
      const ka = counts[suitOf(a)]! * 100 + penalty(a);
      const kb = counts[suitOf(b)]! * 100 + penalty(b);
      return kb > ka ? b : a;
    });
    return `play:${best}`;
  }
  const eight = Number(plays.find((a) => a.split(':').length === 3)?.split(':')[1] ?? plain[0]);
  if (!isEight(eight)) return `play:${eight}`;
  const rest = hand.filter((c) => c !== eight);
  // Name a suit a close opponent could not follow, if we hold some of it.
  const danger = s.hands
    .map((h, p) => ({ p, n: h.length }))
    .filter((x) => x.p !== me && x.n <= 2)
    .sort((a, b) => a.n - b.n)[0];
  let suit = longestSuit(rest.length ? rest : hand);
  if (danger) {
    const lacked = s.lacked[danger.p]!.filter((st) => suitCounts(rest)[st]! > 0);
    if (lacked.length) suit = lacked[0]!;
  }
  return `play:${eight}:${suit}`;
}

/**
 * Hard's rules: Medium's, plus pressure on the next player — prefer leaving (or switching to,
 * by matching rank) a suit they could not follow at their latest draw, and name that suit with an
 * eight whenever we hold some of it.
 */
export function hardRuleAction(s: EightsState): string {
  const legal = legalEightsActions(s);
  const plays = legal.filter((a) => a.startsWith('play:'));
  if (!plays.length) return legal[0]!;
  const me = s.toAct;
  const next = (me + 1) % s.players;
  const gap = s.lacked[next]!;
  const hand = s.hands[me]!;
  const counts = suitCounts(hand);
  const plain = plays.filter((a) => a.split(':').length === 2).map((a) => Number(a.slice(5)));
  if (plain.length && hand.length > 1) {
    const score = (c: number) =>
      (gap.includes(suitOf(c)) ? 1000 : 0) + counts[suitOf(c)]! * 100 + penalty(c);
    return `play:${plain.reduce((a, b) => (score(b) > score(a) ? b : a))}`;
  }
  const eight = Number(plays.find((a) => a.split(':').length === 3)?.split(':')[1] ?? plain[0]);
  if (!isEight(eight)) return `play:${eight}`;
  const rest = hand.filter((c) => c !== eight);
  const restCounts = suitCounts(rest);
  const target = gap.find((st) => restCounts[st]! > 0);
  return `play:${eight}:${target ?? longestSuit(rest.length ? rest : hand)}`;
}

export function levelAction(s: EightsState, level: Level): string {
  if (s.result) return 'next';
  if (level === 'easy') return easyAction(s);
  if (level === 'medium') return mediumAction(s);
  return hardRuleAction(s);
}

export class EightsAgent implements Agent<EightsState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<EightsState, string>,
    s: EightsState,
    _player: PlayerId,
    _ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level);
  }
}

export const AGENT_PRESETS: AgentPreset<EightsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Plays the first card it can and keeps its eights for last.',
      es: 'Juega la primera carta que puede y guarda los ochos para el final.',
    },
    create: () => new EightsAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Plays its longest suit, sheds high cards and names suits you could not follow.',
      es: 'Juega su palo más largo, suelta cartas altas y nombra palos que no pudiste seguir.',
    },
    create: () => new EightsAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'heuristic',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Remembers which suit you could not follow and keeps you on it.',
      es: 'Recuerda qué palo no pudiste seguir y te lo mantiene.',
    },
    create: () => new EightsAgent('hard', 'Hard', 'hard'),
  },
];
