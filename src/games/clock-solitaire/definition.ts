/** Solitaire-shell definition for Clock: twelve piles around a dial, the kings in the middle. */
import { cardName, rankOf } from '../shared/cards/cards';
import type { PileView, SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, clockEnv } from './ai-adapter';
import {
  KINGS,
  applyClockMove,
  dealClock,
  faceUpCount,
  isValidClockState,
  legalClockMoves,
  replayClock,
  type ClockState,
} from './engine';
import { STRINGS } from './i18n';

/** Pile positions (columns, card heights): hour h at h·30° around the dial, kings in the middle. */
export function pileAt(i: number): { col: number; y: number } {
  if (i === KINGS) return { col: 2.64, y: 2.0 };
  const a = ((i + 1) * Math.PI) / 6;
  return { col: 2.64 + 2.9 * Math.sin(a), y: 2.0 - 1.9 * Math.cos(a) };
}

export const CLOCK: SolitaireDefinition<ClockState> = {
  mode: 'clock',
  strings: STRINGS,
  columns: 7,
  deal: dealClock,
  seedOf: (s) => s.seed,
  historyOf: (s) => s.history,
  replay: replayClock,
  validate: isValidClockState,
  apply: applyClockMove,
  legal: legalClockMoves,
  status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
  score: faceUpCount,
  tapPlays: true,
  info: (s, t) => t('info.kings', { k: s.up[KINGS]!.length }),
  piles: (s): PileView[] => [
    ...s.down.map((down, i): PileView => {
      const at = pileAt(i);
      return {
        id: `h${i}`,
        // The pile to turn from behaves like a stock: tapping it turns its top card.
        kind: i === s.current && s.hand === null && !s.result ? 'stock' : 'tableau',
        glow: i === s.current && s.hand === null && !s.result,
        col: at.col,
        row: 0,
        y: at.y,
        fan: 'right',
        fanLast: 4,
        cards: [
          ...down.map((card) => ({ card, up: false })),
          ...s.up[i]!.map((card) => ({ card, up: true })),
        ],
        empty: i === KINGS ? 'K' : ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'][i],
      };
    }),
    {
      id: 'hand',
      kind: 'waste',
      col: 5.9,
      row: 0,
      y: 4.2,
      fan: 'none',
      cards: s.hand === null ? [] : [{ card: s.hand, up: true }],
    },
  ],
  canPick: (s, from) => from.pile === 'hand' && s.hand !== null,
  // Only the card's own hour accepts it.
  moveTo: (s, from, to) =>
    from.pile === 'hand' && s.hand !== null && to === `h${rankOf(s.hand) - 1}` ? 'place' : null,
  autoMove: (s, from) => (from.pile === 'hand' && s.hand !== null ? 'place' : null),
  stockMove: (s) => (legalClockMoves(s)[0] === 'turn' ? 'turn' : null),
  finishMove: () => null,
  moveEnds: (s, m) =>
    m === 'turn'
      ? { from: { pile: `h${s.current}`, index: 0 }, to: 'hand' }
      : { from: { pile: 'hand', index: 0 }, to: `h${rankOf(s.hand!) - 1}` },
  describe: (before, m, after, t, locale) =>
    m === 'turn'
      ? t('announce.turn', { card: cardName(after.hand!, locale) })
      : t('announce.place', { card: cardName(before.hand!, locale) }),
  sound: (_before, m) => (m === 'turn' ? 'flip' : 'place'),
  env: clockEnv,
  agents: AGENT_PRESETS,
  hintAgent: 'random',
  watchAgent: 'random',
};
