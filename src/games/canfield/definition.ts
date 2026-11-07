/** Solitaire-shell definition for Canfield. */
import { cardName, rankLabel } from '../shared/cards/cards';
import type { CardRef, PileView, SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS } from './ai';
import { canfieldEnv } from './ai-adapter';
import {
  applyCanfieldMove,
  dealCanfield,
  homeCount,
  isValidCanfieldState,
  legalCanfieldMoves,
  replayCanfield,
  runStart,
  type CanfieldState,
} from './engine';
import { STRINGS } from './i18n';

function source(s: CanfieldState, from: CardRef): { code: string; single: boolean } | null {
  if (from.pile === 'reserve')
    return from.index === s.reserve.length - 1 ? { code: 'r', single: true } : null;
  if (from.pile === 'waste')
    return from.index === s.waste.length - 1 ? { code: 'w', single: true } : null;
  if (from.pile[0] !== 't') return null;
  const i = Number(from.pile.slice(1));
  const p = s.tableau[i]!;
  if (from.index < runStart(p) || from.index >= p.length) return null;
  return { code: `t${i}:${from.index}`, single: from.index === p.length - 1 };
}

function moveTo(s: CanfieldState, from: CardRef, to: string): string | null {
  const src = source(s, from);
  if (!src || to === from.pile) return null;
  let m: string;
  if (to[0] === 'f') {
    if (!src.single) return null;
    m = `${src.code.split(':')[0]}>${to}`;
  } else if (to[0] === 't') m = `${src.code}>${to}`;
  else return null;
  return legalCanfieldMoves(s).includes(m) ? m : null;
}

export const CANFIELD: SolitaireDefinition<CanfieldState> = {
  mode: 'canfield',
  strings: STRINGS,
  columns: 7,
  deal: dealCanfield,
  seedOf: (s) => s.seed,
  historyOf: (s) => s.history,
  replay: replayCanfield,
  validate: isValidCanfieldState,
  apply: applyCanfieldMove,
  legal: legalCanfieldMoves,
  status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
  score: homeCount,
  info: (s, t) =>
    t('info.reserve', { n: s.reserve.length, base: rankLabel(s.foundations[0]![0]!) }),
  piles: (s): PileView[] => [
    {
      id: 'stock',
      kind: 'stock',
      col: 0,
      row: 0,
      fan: 'none',
      cards: s.stock.map((card) => ({ card, up: false })),
      empty: s.waste.length ? '↺' : '',
    },
    {
      id: 'waste',
      kind: 'waste',
      col: 1,
      row: 0,
      fan: 'right',
      fanLast: 3,
      cards: s.waste.map((card) => ({ card, up: true })),
    },
    ...s.foundations.map((f, i): PileView => ({
      id: `f${i}`,
      kind: 'foundation',
      col: 3 + i,
      row: 0,
      fan: 'none',
      cards: f.map((card) => ({ card, up: true })),
      empty: rankLabel(s.foundations[0]![0]!),
    })),
    {
      id: 'reserve',
      kind: 'cell',
      col: 0.5,
      row: 1,
      fan: 'none',
      cards: s.reserve.map((card, i) => ({ card, up: i === s.reserve.length - 1 })),
    },
    ...s.tableau.map((p, i): PileView => ({
      id: `t${i}`,
      kind: 'tableau',
      col: 3 + i,
      row: 1,
      fan: 'down',
      cards: p.map((card) => ({ card, up: true })),
    })),
  ],
  canPick: (s, from) => source(s, from) !== null,
  moveTo,
  autoMove: (s, from) => {
    const src = source(s, from);
    if (!src) return null;
    const tableau = s.tableau
      .map((p, j) => ({ id: `t${j}`, empty: p.length === 0 }))
      .sort((a, b) => Number(a.empty) - Number(b.empty))
      .map((x) => x.id);
    for (const to of [...s.foundations.map((_, j) => `f${j}`), ...tableau]) {
      const m = moveTo(s, from, to);
      if (m) return m;
    }
    return null;
  },
  stockMove: (s) => (legalCanfieldMoves(s).includes('draw') ? 'draw' : null),
  finishMove: (s) =>
    s.result || s.reserve.length || s.stock.length || s.waste.length
      ? null
      : (legalCanfieldMoves(s).find((m) => m.includes('>f')) ?? null),
  moveEnds: (s, m) => {
    if (m === 'draw')
      return {
        from: s.stock.length ? { pile: 'stock', index: s.stock.length - 1 } : null,
        to: 'waste',
      };
    const [from, to] = m.split('>') as [string, string];
    if (from === 'r') return { from: { pile: 'reserve', index: s.reserve.length - 1 }, to };
    if (from === 'w') return { from: { pile: 'waste', index: s.waste.length - 1 }, to };
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    return { from: { pile: `t${i}`, index: k ?? s.tableau[i]!.length - 1 }, to };
  },
  describe: (before, m, _after, t, locale) => {
    if (m === 'draw') return before.stock.length ? t('announce.draw') : t('announce.recycle');
    const [from, to] = m.split('>') as [string, string];
    const card =
      from === 'r'
        ? before.reserve[before.reserve.length - 1]!
        : from === 'w'
          ? before.waste[before.waste.length - 1]!
          : (() => {
              const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
              const p = before.tableau[i]!;
              return p[k ?? p.length - 1]!;
            })();
    return to[0] === 'f'
      ? t('announce.home', { card: cardName(card, locale) })
      : t('announce.move', { card: cardName(card, locale), pile: Number(to.slice(1)) + 1 });
  },
  sound: (_before, m) => (m === 'draw' ? 'draw' : m.includes('>f') ? 'home' : 'place'),
  env: canfieldEnv,
  agents: AGENT_PRESETS,
  hintAgent: 'planner',
  watchAgent: 'planner',
};
