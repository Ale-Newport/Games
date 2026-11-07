/** Solitaire-shell definition for Accordion: the row of piles wraps onto lines of eight. */
import { cardName } from '../shared/cards/cards';
import type { PileView, SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS } from './ai';
import { accordionEnv } from './ai-adapter';
import {
  applyAccordionMove,
  dealAccordion,
  isValidAccordionState,
  legalAccordionMoves,
  pilesLeft,
  replayAccordion,
  type AccordionState,
} from './engine';
import { STRINGS } from './i18n';

export const PER_LINE = 8;
const LINE = 1.08;

const index = (pile: string) => (pile[0] === 'p' ? Number(pile.slice(1)) : -1);

function moveTo(s: AccordionState, from: number, to: number): string | null {
  const d = from - to;
  if (d !== 1 && d !== 3) return null;
  const m = `p${from}-${d}`;
  return legalAccordionMoves(s).includes(m) ? m : null;
}

export const ACCORDION: SolitaireDefinition<AccordionState> = {
  mode: 'accordion',
  strings: STRINGS,
  columns: PER_LINE,
  deal: dealAccordion,
  seedOf: (s) => s.seed,
  historyOf: (s) => s.history,
  replay: replayAccordion,
  validate: isValidAccordionState,
  apply: applyAccordionMove,
  legal: legalAccordionMoves,
  status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
  score: pilesLeft,
  info: (s, t) => t('info.row', { piles: s.piles.length, n: s.stock.length }),
  piles: (s): PileView[] => [
    {
      id: 'stock',
      kind: 'stock',
      col: 0,
      row: 0,
      y: 0,
      fan: 'none',
      cards: s.stock.map((card) => ({ card, up: false })),
    },
    ...s.piles.map((p, i): PileView => ({
      id: `p${i}`,
      kind: 'tableau',
      col: i % PER_LINE,
      row: 0,
      y: 1.25 + Math.floor(i / PER_LINE) * LINE,
      fan: 'none',
      cards: p.map((card) => ({ card, up: true })),
      vanish: true,
    })),
  ],
  canPick: (s, from) => {
    const i = index(from.pile);
    return i >= 1 && i < s.piles.length && from.index === s.piles[i]!.length - 1;
  },
  moveTo: (s, from, to) => moveTo(s, index(from.pile), index(to)),
  // Three to the left first: it closes the row up faster.
  autoMove: (s, from) => {
    const i = index(from.pile);
    return moveTo(s, i, i - 3) ?? moveTo(s, i, i - 1);
  },
  stockMove: (s) => (s.stock.length && !s.result ? 'deal' : null),
  finishMove: () => null,
  moveEnds: (s, m) => {
    if (m === 'deal')
      return { from: { pile: 'stock', index: s.stock.length - 1 }, to: `p${s.piles.length}` };
    const [i, d] = m.slice(1).split('-').map(Number) as [number, number];
    return { from: { pile: `p${i}`, index: s.piles[i]!.length - 1 }, to: `p${i - d}` };
  },
  describe: (before, m, after, t, locale) => {
    if (m === 'deal')
      return t('announce.deal', {
        card: cardName(after.piles[after.piles.length - 1]![0]!, locale),
      });
    const [i, d] = m.slice(1).split('-').map(Number) as [number, number];
    const a = before.piles[i]!;
    const b = before.piles[i - d]!;
    return t('announce.move', {
      card: cardName(a[a.length - 1]!, locale),
      onto: cardName(b[b.length - 1]!, locale),
    });
  },
  sound: (_before, m) => (m === 'deal' ? 'draw' : 'place'),
  env: accordionEnv,
  agents: AGENT_PRESETS,
  hintAgent: 'planner',
  watchAgent: 'planner',
};
