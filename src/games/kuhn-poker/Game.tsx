import type { GameProps } from '../../core/game-engine/types';
import { SPADES, makeCard } from '../shared/cards/cards';
import { HeadsUpTable, type HeadsUpDefinition } from '../shared/heads-up-poker/HeadsUpTable';
import { easyPolicy, mediumPolicy, nashPolicy } from './ai';
import {
  START_CHIPS,
  applyKuhnAction,
  createKuhn,
  isValidKuhnState,
  kuhnOptions,
  legalKuhnActions,
  type KuhnState,
} from './engine';
import { STRINGS } from './i18n';

/** Jack, queen and king of spades stand for the three cards. */
const cardId = (c: number) => makeCard(SPADES, 11 + c);

/** Who made the k-th action of the hand. */
const actor = (s: KuhnState, k: number) => (k % 2 === 0 ? s.first : 1 - s.first) as 0 | 1;

export const KUHN_TABLE: HeadsUpDefinition<KuhnState> = {
  strings: STRINGS,
  startChips: START_CHIPS,
  create: createKuhn,
  apply: applyKuhnAction,
  legal: legalKuhnActions,
  isValid: isValidKuhnState,
  view: (s) => {
    const paid: [number, number] = [1, 1];
    s.betting.forEach((a, k) => {
      if (a === 'bet' || a === 'call') paid[actor(s, k)]++;
    });
    return {
      chips: s.chips,
      handNo: s.handNo,
      hole: [cardId(s.cards[0]), cardId(s.cards[1])],
      board: [],
      boardSlots: 0,
      pot: paid[0] + paid[1],
      paid,
      toAct: s.toAct,
      result: s.result,
      matchWinner: s.winner,
      log: s.betting.map((action, k) => ({ player: actor(s, k), action })),
    };
  },
  policy: (difficulty, s) => {
    const policy =
      difficulty === 'hard' ? nashPolicy : difficulty === 'medium' ? mediumPolicy : easyPolicy;
    return { options: kuhnOptions(s.betting), probs: policy(s.cards[s.toAct as 0 | 1], s.betting) };
  },
  onHandEnd: (s, unlock) => {
    const r = s.result!;
    if (r.winner !== 0) return;
    const mine = s.betting.filter((_, k) => actor(s, k) === 0);
    if (!r.showdown && s.cards[0] === 0 && mine.includes('bet')) unlock('bluff');
    if (r.showdown && s.cards[0] === 1 && mine.includes('call')) unlock('hero-call');
  },
};

export function Game({ services }: GameProps) {
  return <HeadsUpTable def={KUHN_TABLE} services={services} />;
}
