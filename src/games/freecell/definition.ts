/** Solitaire-shell definition for FreeCell. */
import { cardName, rankOf } from '../shared/cards/cards';
import type { CardRef, PileView, SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS } from './ai';
import { freeCellEnv } from './ai-adapter';
import {
  applyFreeCellMove,
  dealFreeCell,
  isValidFreeCellState,
  legalFreeCellMoves,
  replayFreeCell,
  safeAutoMove,
  sequenceStart,
  type FreeCellState,
} from './engine';
import { STRINGS } from './i18n';

const index = (id: string) => Number(id.slice(1));

/** The move prefix for cards picked at `from`, and whether it is a single card. */
function source(s: FreeCellState, from: CardRef): { code: string; single: boolean } | null {
  if (from.pile[0] === 'r')
    return s.cells[index(from.pile)] !== -1 ? { code: from.pile, single: true } : null;
  if (from.pile[0] !== 'c') return null;
  const p = s.columns[index(from.pile)]!;
  if (from.index < sequenceStart(p) || from.index >= p.length) return null;
  return { code: `${from.pile}:${from.index}`, single: from.index === p.length - 1 };
}

function moveTo(s: FreeCellState, from: CardRef, to: string): string | null {
  const src = source(s, from);
  if (!src || to === from.pile) return null;
  let m: string;
  if (to[0] === 'c') m = `${src.code}>${to}`;
  else if (to[0] === 'f' || (to[0] === 'r' && src.code[0] === 'c')) {
    if (!src.single) return null;
    m = `${src.code.split(':')[0]}>${to}`;
  } else return null;
  return legalFreeCellMoves(s).includes(m) ? m : null;
}

/** Every column runs downward in rank, so every card can go home in order. */
const sorted = (s: FreeCellState) =>
  s.columns.every((p) => p.every((c, k) => k === 0 || rankOf(c) < rankOf(p[k - 1]!)));

export const FREECELL: SolitaireDefinition<FreeCellState> = {
  mode: 'freecell',
  strings: STRINGS,
  columns: 8,
  deal: dealFreeCell,
  seedOf: (s) => s.seed,
  historyOf: (s) => s.history,
  replay: replayFreeCell,
  validate: isValidFreeCellState,
  apply: applyFreeCellMove,
  legal: legalFreeCellMoves,
  status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
  // Score: cards home (the classic game has no point scoring).
  score: (s) => s.foundations.reduce((a, f) => a + f.length, 0),
  piles: (s): PileView[] => [
    ...s.cells.map((c, i): PileView => ({
      id: `r${i}`,
      kind: 'cell',
      col: i,
      row: 0,
      fan: 'none',
      cards: c === -1 ? [] : [{ card: c, up: true }],
    })),
    ...s.foundations.map((f, i): PileView => ({
      id: `f${i}`,
      kind: 'foundation',
      col: 4 + i,
      row: 0,
      fan: 'none',
      cards: f.map((card) => ({ card, up: true })),
      empty: 'A',
    })),
    ...s.columns.map((p, i): PileView => ({
      id: `c${i}`,
      kind: 'tableau',
      col: i,
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
    const byLength = s.columns
      .map((p, i) => ({ id: `c${i}`, empty: p.length === 0 }))
      .sort((a, b) => Number(a.empty) - Number(b.empty))
      .map((x) => x.id);
    for (const to of [
      ...s.foundations.map((_, i) => `f${i}`),
      ...byLength,
      ...s.cells.map((_, i) => `r${i}`),
    ]) {
      const m = moveTo(s, from, to);
      if (m) return m;
    }
    return null;
  },
  stockMove: () => null,
  finishMove: (s) =>
    s.result || !sorted(s) ? null : (legalFreeCellMoves(s).find((m) => m.includes('>f')) ?? null),
  autoPlay: safeAutoMove,
  moveEnds: (s, m) => {
    const [from, to] = m.split('>') as [string, string];
    if (from[0] === 'r') return { from: { pile: from, index: 0 }, to };
    const [col, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    return { from: { pile: `c${col}`, index: at ?? s.columns[col]!.length - 1 }, to };
  },
  describe: (before, m, _after, t, locale) => {
    const [from, to] = m.split('>') as [string, string];
    const card =
      from[0] === 'r'
        ? before.cells[index(from)]!
        : (() => {
            const [col, at] = from.slice(1).split(':').map(Number) as [number, number | undefined];
            const p = before.columns[col]!;
            return p[at ?? p.length - 1]!;
          })();
    const name = cardName(card, locale);
    if (to[0] === 'f') return t('announce.home', { card: name });
    if (to[0] === 'r') return t('announce.cell', { card: name });
    return t('announce.move', { card: name, pile: index(to) + 1 });
  },
  sound: (_before, m) => (m.includes('>f') ? 'home' : 'place'),
  env: freeCellEnv,
  agents: AGENT_PRESETS,
  hintAgent: 'solver',
  watchAgent: 'solver',
};
