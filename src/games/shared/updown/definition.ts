/** Solitaire-shell definition builder for the up-or-down games (#078 TriPeaks, #079 Golf). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { Dictionary, Locale } from '../../../core/i18n';
import { cardName } from '../cards/cards';
import type { PileView, SolitaireDefinition, SolitaireEndEvent } from '../solitaire/SolitaireGame';
import {
  applyUpDownMove,
  dealUpDown,
  isFree,
  isValidUpDownState,
  legalUpDownMoves,
  replayUpDown,
  type UpDownLayout,
  type UpDownState,
} from './engine';
import { UPDOWN_STRINGS } from './i18n';

export interface UpDownGameOptions {
  layout: UpDownLayout;
  columns: number;
  /** Where the stock and the waste sit (columns and card heights). */
  stockAt: { col: number; y: number };
  wasteAt: { col: number; y: number };
  env: GameEnvironment<UpDownState, string>;
  agents: AgentPreset<UpDownState, string>[];
  strings: Record<Locale, Dictionary>;
  onEnd?: (event: SolitaireEndEvent<UpDownState>) => void;
}

export function createUpDownDefinition(o: UpDownGameOptions): SolitaireDefinition<UpDownState> {
  const L = o.layout;
  const play = (s: UpDownState, pile: string) => {
    if (pile[0] !== 'p') return null;
    const m = pile;
    return legalUpDownMoves(L, s).includes(m) ? m : null;
  };
  return {
    mode: L.id,
    strings: {
      en: { ...UPDOWN_STRINGS.en, ...o.strings.en },
      es: { ...UPDOWN_STRINGS.es, ...o.strings.es },
    },
    columns: o.columns,
    deal: (seed) => dealUpDown(L, seed),
    seedOf: (s) => s.seed,
    historyOf: (s) => s.history,
    replay: (seed, history) => replayUpDown(L, seed, history),
    validate: (d): d is UpDownState => isValidUpDownState(L, d),
    apply: (s, m) => applyUpDownMove(L, s, m),
    legal: (s) => legalUpDownMoves(L, s),
    status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
    score: (s) => s.score,
    tapPlays: true,
    info: (s, t) =>
      L.id === 'tripeaks'
        ? t('info.run', { run: s.run, n: s.stock.length })
        : t('info.stock', { n: s.stock.length }),
    piles: (s): PileView[] => [
      ...s.tableau.map((card, i): PileView => ({
        id: `p${i}`,
        kind: 'tableau',
        col: L.xy[i]!.col,
        row: 0,
        y: L.xy[i]!.y,
        fan: 'none',
        cards: card === -1 ? [] : [{ card, up: !L.hidden || isFree(L, s, i) }],
        vanish: true,
      })),
      {
        id: 'stock',
        kind: 'stock',
        col: o.stockAt.col,
        row: 0,
        y: o.stockAt.y,
        fan: 'none',
        cards: s.stock.map((card) => ({ card, up: false })),
      },
      {
        id: 'waste',
        kind: 'waste',
        col: o.wasteAt.col,
        row: 0,
        y: o.wasteAt.y,
        fan: 'none',
        cards: s.waste.map((card) => ({ card, up: true })),
      },
    ],
    canPick: (s, from) => from.pile[0] === 'p' && isFree(L, s, Number(from.pile.slice(1))),
    moveTo: (s, from, to) => (to === 'waste' ? play(s, from.pile) : null),
    autoMove: (s, from) => play(s, from.pile),
    stockMove: (s) => (s.stock.length && !s.result ? 'draw' : null),
    finishMove: () => null,
    moveEnds: (s, m) =>
      m === 'draw'
        ? { from: { pile: 'stock', index: s.stock.length - 1 }, to: 'waste' }
        : { from: { pile: m, index: 0 }, to: 'waste' },
    describe: (before, m, after, t, locale) =>
      m === 'draw'
        ? t('announce.draw', { card: cardName(after.waste[after.waste.length - 1]!, locale) })
        : t('announce.play', { card: cardName(before.tableau[Number(m.slice(1))]!, locale) }),
    sound: (_before, m) => (m === 'draw' ? 'draw' : 'home'),
    env: o.env,
    agents: o.agents,
    hintAgent: 'planner',
    watchAgent: 'planner',
    onEnd: o.onEnd,
  };
}
