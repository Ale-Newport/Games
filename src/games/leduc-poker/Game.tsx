import type { GameProps } from '../../core/game-engine/types';
import type { Locale } from '../../core/i18n';
import { HEARTS, SPADES, makeCard } from '../shared/cards/cards';
import { HeadsUpTable, type HeadsUpDefinition } from '../shared/heads-up-poker/HeadsUpTable';
import { decisionOf, easyPolicy, mediumPolicy, nashPolicy } from './ai';
import {
  START_CHIPS,
  applyLeducAction,
  createLeduc,
  isValidLeducState,
  leducOptions,
  legalLeducActions,
  rankOf,
  type LeducState,
} from './engine';
import { STRINGS } from './i18n';

/** Jacks, queens and kings of spades and hearts. */
const cardId = (c: number) => makeCard(c % 2 === 0 ? SPADES : HEARTS, 11 + rankOf(c));

const RANK_NAMES: Record<Locale, string[]> = {
  en: ['jacks', 'queens', 'kings'],
  es: ['jotas', 'damas', 'reyes'],
};
const HIGH_NAMES: Record<Locale, string[]> = {
  en: ['jack high', 'queen high', 'king high'],
  es: ['jota alta', 'dama alta', 'rey alto'],
};

export const LEDUC_TABLE: HeadsUpDefinition<LeducState> = {
  strings: STRINGS,
  startChips: START_CHIPS,
  create: createLeduc,
  apply: applyLeducAction,
  legal: legalLeducActions,
  isValid: isValidLeducState,
  view: (s, locale) => {
    const log: { player: 0 | 1; action: string }[] = [];
    s.betting.forEach((round) =>
      round.forEach((action, k) =>
        log.push({ player: (k % 2 === 0 ? s.first : 1 - s.first) as 0 | 1, action }),
      ),
    );
    const name = (c: number) =>
      rankOf(c) === rankOf(s.cards[2])
        ? (locale === 'es' ? 'pareja de ' : 'pair of ') + RANK_NAMES[locale][rankOf(c)]!
        : HIGH_NAMES[locale][rankOf(c)]!;
    return {
      chips: s.chips,
      handNo: s.handNo,
      hole: [cardId(s.cards[0]), cardId(s.cards[1])],
      board: s.round === 1 ? [cardId(s.cards[2])] : [],
      boardSlots: 1,
      pot: s.paid[0] + s.paid[1],
      paid: s.paid,
      toAct: s.toAct,
      result: s.result,
      matchWinner: s.winner,
      log,
      showdownNames: [name(s.cards[0]), name(s.cards[1])],
    };
  },
  policy: (difficulty, s) => {
    const policy =
      difficulty === 'hard' ? nashPolicy : difficulty === 'medium' ? mediumPolicy : easyPolicy;
    return { options: leducOptions(s.betting[s.round]), probs: policy(...decisionOf(s)) };
  },
  onHandEnd: (s, unlock) => {
    const r = s.result!;
    if (r.winner !== 0) return;
    const mine = s.betting.flatMap((round) =>
      round.filter((_, k) => (k % 2 === 0 ? s.first : 1 - s.first) === 0),
    );
    if (!r.showdown && rankOf(s.cards[0]) === 0 && mine.some((a) => a === 'bet' || a === 'raise'))
      unlock('bluff');
    if (r.showdown && rankOf(s.cards[0]) === rankOf(s.cards[2])) unlock('trips');
    if (r.won >= 10) unlock('big-pot');
  },
};

export function Game({ services }: GameProps) {
  return <HeadsUpTable def={LEDUC_TABLE} services={services} />;
}
