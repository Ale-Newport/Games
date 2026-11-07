/**
 * Blackjack players. Basic strategy is the textbook best play for these rules (six decks, dealer
 * stands on soft 17, double after split, no surrender) from the player's cards and the dealer's
 * up card only; it never takes insurance. The "dealer mimic" plays like the house (hits below 17,
 * never doubles or splits). Neither looks at the hole card or the shoe.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { rankOf } from '../shared/cards/cards';
import {
  canDouble,
  canSplit,
  cardValue,
  handValue,
  legalBlackjackActions,
  type BlackjackState,
} from './engine';

type Advice = 'hit' | 'stand' | 'double' | 'split';

/** The dealer's up card as 2–11 (ace = 11). */
const upValue = (c: number) => (rankOf(c) === 1 ? 11 : cardValue(c));

export function basicStrategy(
  cards: readonly number[],
  dealerUp: number,
  splittable: boolean,
): Advice {
  const up = upValue(dealerUp);
  const between = (lo: number, hi: number) => up >= lo && up <= hi;
  if (splittable && cards.length === 2 && cardValue(cards[0]!) === cardValue(cards[1]!)) {
    const p = rankOf(cards[0]!) === 1 ? 11 : cardValue(cards[0]!);
    if (p === 11 || p === 8) return 'split';
    if ((p === 2 || p === 3 || p === 7) && between(2, 7)) return 'split';
    if (p === 4 && between(5, 6)) return 'split';
    if (p === 6 && between(2, 6)) return 'split';
    if (p === 9 && (between(2, 6) || between(8, 9))) return 'split';
  }
  const { total, soft } = handValue(cards);
  const two = cards.length === 2;
  if (soft) {
    if (total >= 20) return 'stand';
    if (total === 19) return two && up === 6 ? 'double' : 'stand';
    if (total === 18) {
      if (between(2, 6)) return two ? 'double' : 'stand';
      return between(7, 8) ? 'stand' : 'hit';
    }
    if (total === 17) return two && between(3, 6) ? 'double' : 'hit';
    if (total >= 15) return two && between(4, 6) ? 'double' : 'hit';
    return two && between(5, 6) ? 'double' : 'hit';
  }
  if (total >= 17) return 'stand';
  if (total >= 13) return between(2, 6) ? 'stand' : 'hit';
  if (total === 12) return between(4, 6) ? 'stand' : 'hit';
  if (total === 11) return two ? 'double' : 'hit';
  if (total === 10) return two && between(2, 9) ? 'double' : 'hit';
  if (total === 9) return two && between(3, 6) ? 'double' : 'hit';
  return 'hit';
}

/** Basic strategy's move in a state (never insurance). */
export function basicStrategyAction(s: BlackjackState): string {
  const legal = legalBlackjackActions(s);
  if (s.phase === 'insurance') return 'no-insure';
  if (s.phase !== 'play') return legal[0]!;
  const h = s.hands[s.active]!;
  const advice = basicStrategy(h.cards, s.dealer[0]!, canSplit(s));
  if (advice === 'double' && !canDouble(s)) return 'hit';
  if (advice === 'split' && !canSplit(s)) return 'hit';
  return advice;
}

export class BasicStrategyAgent implements Agent<BlackjackState, string> {
  readonly id = 'basic';
  readonly label = 'Basic strategy';
  selectAction(_env: GameEnvironment<BlackjackState, string>, s: BlackjackState): string {
    return basicStrategyAction(s);
  }
}

export class DealerMimicAgent implements Agent<BlackjackState, string> {
  readonly id = 'mimic';
  readonly label = 'Dealer mimic';
  selectAction(_env: GameEnvironment<BlackjackState, string>, s: BlackjackState): string {
    if (s.phase === 'insurance') return 'no-insure';
    if (s.phase !== 'play') return legalBlackjackActions(s)[0]!;
    return handValue(s.hands[s.active]!.cards).total < 17 ? 'hit' : 'stand';
  }
}

export const AGENT_PRESETS: AgentPreset<BlackjackState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Picks any legal action.', es: 'Elige cualquier acción legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'mimic',
    kind: 'heuristic',
    label: { en: 'Dealer mimic', es: 'Imita a la banca' },
    description: {
      en: 'Plays like the dealer: hits below 17, never doubles or splits.',
      es: 'Juega como la banca: pide por debajo de 17, nunca dobla ni separa.',
    },
    create: () => new DealerMimicAgent(),
  },
  {
    id: 'basic',
    kind: 'heuristic',
    label: { en: 'Basic strategy', es: 'Estrategia básica' },
    description: {
      en: 'The textbook best play for these rules, from your cards and the dealer’s up card.',
      es: 'La mejor jugada de manual para estas reglas, según tus cartas y la carta visible de la banca.',
    },
    create: () => new BasicStrategyAgent(),
  },
];
