/** Solitaire-shell definition for Pyramid. */
import { cardName, rankOf } from '../shared/cards/cards';
import type { CardRef, PileView, SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS } from './ai';
import { pyramidEnv } from './ai-adapter';
import {
  PASSES,
  applyPyramidMove,
  dealPyramid,
  isFree,
  isValidPyramidState,
  legalPyramidMoves,
  posOf,
  replayPyramid,
  rowOf,
  type PyramidState,
} from './engine';
import { STRINGS } from './i18n';

const ROW_STEP = 0.45;

/** Position code ("p12" or "w") of a picked card, if it is free. */
function at(s: PyramidState, from: CardRef): string | null {
  if (from.pile === 'waste') return from.index === s.waste.length - 1 ? 'w' : null;
  if (from.pile[0] !== 'p') return null;
  const i = Number(from.pile.slice(1));
  return isFree(s, i) ? from.pile : null;
}

const pair = (a: string, b: string) => (a === 'w' ? `${b}+w` : b === 'w' ? `${a}+w` : `${a}+${b}`);

function legalAs(s: PyramidState, m: string): string | null {
  const legal = legalPyramidMoves(s);
  if (legal.includes(m)) return m;
  // Pairs are listed lower position first.
  const [a, b] = m.split('+');
  if (b && legal.includes(`${b}+${a}`)) return `${b}+${a}`;
  return null;
}

export const PYRAMID: SolitaireDefinition<PyramidState> = {
  mode: 'pyramid',
  strings: STRINGS,
  columns: 7,
  deal: dealPyramid,
  seedOf: (s) => s.seed,
  historyOf: (s) => s.history,
  replay: replayPyramid,
  validate: isValidPyramidState,
  apply: applyPyramidMove,
  legal: legalPyramidMoves,
  status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
  score: (s) => s.score,
  info: (s, t) => t('info.passes', { n: PASSES - s.recycles }),
  piles: (s): PileView[] => [
    ...s.pyramid.map((card, i): PileView => {
      const r = rowOf(i);
      const k = i - posOf(r, 0);
      return {
        id: `p${i}`,
        kind: 'tableau',
        col: 3 - r / 2 + k,
        row: 0,
        y: r * ROW_STEP,
        fan: 'none',
        cards: card === -1 ? [] : [{ card, up: true }],
        vanish: true,
      };
    }),
    {
      id: 'stock',
      kind: 'stock',
      col: 0,
      row: 0,
      y: 6 * ROW_STEP + 1.25,
      fan: 'none',
      cards: s.stock.map((card) => ({ card, up: false })),
      empty: s.waste.length && s.recycles < PASSES - 1 ? '↺' : '',
    },
    {
      id: 'waste',
      kind: 'waste',
      col: 1,
      row: 0,
      y: 6 * ROW_STEP + 1.25,
      fan: 'none',
      cards: s.waste.map((card) => ({ card, up: true })),
    },
  ],
  canPick: (s, from) => at(s, from) !== null,
  moveTo: (s, from, to) => {
    const a = at(s, from);
    if (!a) return null;
    const b = to === 'waste' ? 'w' : to[0] === 'p' ? to : null;
    if (!b || b === a) return null;
    return legalAs(s, pair(a, b));
  },
  autoMove: (s, from) => {
    const a = at(s, from);
    if (!a) return null;
    const card = a === 'w' ? s.waste[s.waste.length - 1]! : s.pyramid[Number(a.slice(1))]!;
    if (rankOf(card) === 13) return legalAs(s, a);
    // The partner deepest in the pyramid first, then the waste.
    const partners = legalPyramidMoves(s)
      .filter((m) => m.split('+').includes(a) && m.includes('+'))
      .sort((x, y) => {
        const depth = (m: string) =>
          m
            .split('+')
            .filter((p) => p !== a && p !== 'w')
            .reduce((d, p) => d + 6 - rowOf(Number(p.slice(1))), 0);
        return depth(y) - depth(x);
      });
    return partners[0] ?? null;
  },
  stockMove: (s) => (legalPyramidMoves(s).includes('draw') ? 'draw' : null),
  finishMove: () => null,
  moveEnds: (s, m) => {
    if (m === 'draw')
      return {
        from: s.stock.length ? { pile: 'stock', index: s.stock.length - 1 } : null,
        to: 'waste',
      };
    const [a, b] = m.split('+') as [string, string | undefined];
    const ref = (x: string): CardRef =>
      x === 'w' ? { pile: 'waste', index: s.waste.length - 1 } : { pile: x, index: 0 };
    const from = ref(a);
    return { from, to: b ? ref(b).pile : from.pile };
  },
  describe: (before, m, _after, t, locale) => {
    if (m === 'draw') return before.stock.length ? t('announce.draw') : t('announce.recycle');
    const name = (x: string) =>
      cardName(
        x === 'w' ? before.waste[before.waste.length - 1]! : before.pyramid[Number(x.slice(1))]!,
        locale,
      );
    const [a, b] = m.split('+') as [string, string | undefined];
    return b
      ? t('announce.pair', { a: name(a), b: name(b) })
      : t('announce.king', { card: name(a) });
  },
  sound: (_before, m) => (m === 'draw' ? 'draw' : 'home'),
  env: pyramidEnv,
  agents: AGENT_PRESETS,
  hintAgent: 'planner',
  watchAgent: 'planner',
};
