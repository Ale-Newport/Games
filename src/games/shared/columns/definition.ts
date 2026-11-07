/** Solitaire-shell definition builder for the column patiences (#080–#082). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { Dictionary, Locale } from '../../../core/i18n';
import { cardName } from '../cards/cards';
import type {
  CardRef,
  PileView,
  SolitaireDefinition,
  SolitaireEndEvent,
} from '../solitaire/SolitaireGame';
import {
  applyColumnsMove,
  dealColumns,
  faceDown,
  homeCount,
  isValidColumnsState,
  legalColumnsMoves,
  moveStart,
  replayColumns,
  type ColumnsState,
  type ColumnsVariant,
} from './engine';
import { COLUMNS_STRINGS } from './i18n';

export interface ColumnsGameOptions {
  variant: ColumnsVariant;
  /** Layout width in cards, and where the top-row piles start. */
  columns: number;
  firstFoundationCol: number;
  env: GameEnvironment<ColumnsState, string>;
  agents: AgentPreset<ColumnsState, string>[];
  strings: Record<Locale, Dictionary>;
  onEnd?: (event: SolitaireEndEvent<ColumnsState>) => void;
}

export function createColumnsDefinition(o: ColumnsGameOptions): SolitaireDefinition<ColumnsState> {
  const v = o.variant;
  const source = (s: ColumnsState, from: CardRef): { code: string; single: boolean } | null => {
    if (from.pile === 'waste')
      return from.index === s.waste.length - 1 ? { code: 'w', single: true } : null;
    if (from.pile[0] !== 'c') return null;
    const i = Number(from.pile.slice(1));
    const p = s.columns[i];
    if (!p || from.index >= p.length || from.index < moveStart(v, s, i)) return null;
    return { code: `c${i}:${from.index}`, single: from.index === p.length - 1 };
  };
  const moveTo = (s: ColumnsState, from: CardRef, to: string) => {
    const src = source(s, from);
    if (!src || to === from.pile) return null;
    let m: string;
    if (to[0] === 'f') {
      if (!src.single) return null;
      m = `${src.code.split(':')[0]}>${to}`;
    } else if (to[0] === 'c') m = src.code === 'w' ? `w>${to}` : `${src.code}>${to}`;
    else return null;
    return legalColumnsMoves(v, s).includes(m) ? m : null;
  };
  const describeCard = (s: ColumnsState, m: string) => {
    const [from] = m.split('>') as [string];
    if (from === 'w') return { card: s.waste[s.waste.length - 1]!, n: 1 };
    const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
    const p = s.columns[i]!;
    const at = k ?? p.length - 1;
    return { card: p[at]!, n: p.length - at };
  };
  return {
    mode: v.id,
    strings: {
      en: { ...COLUMNS_STRINGS.en, ...o.strings.en },
      es: { ...COLUMNS_STRINGS.es, ...o.strings.es },
    },
    columns: o.columns,
    deal: (seed) => dealColumns(v, seed),
    seedOf: (s) => s.seed,
    historyOf: (s) => s.history,
    replay: (seed, history) => replayColumns(v, seed, history),
    validate: (d): d is ColumnsState => isValidColumnsState(v, d),
    apply: (s, m) => applyColumnsMove(v, s, m),
    legal: (s) => legalColumnsMoves(v, s),
    status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
    score: homeCount,
    info: v.stock.kind === 'none' ? undefined : (s, t) => t('info.stock', { n: s.stock.length }),
    piles: (s): PileView[] => {
      const piles: PileView[] = [];
      if (v.stock.kind !== 'none')
        piles.push({
          id: 'stock',
          kind: 'stock',
          col: 0,
          row: 0,
          fan: 'none',
          cards: s.stock.map((card) => ({ card, up: false })),
        });
      if (v.stock.kind === 'waste')
        piles.push({
          id: 'waste',
          kind: 'waste',
          col: 1,
          row: 0,
          fan: 'none',
          cards: s.waste.map((card) => ({ card, up: true })),
        });
      if (v.foundations > 0)
        s.foundations.forEach((f, i) =>
          piles.push({
            id: `f${i}`,
            kind: 'foundation',
            col: o.firstFoundationCol + i,
            row: 0,
            fan: 'none',
            cards: f.map((card) => ({ card, up: true })),
            empty: 'A',
          }),
        );
      else
        for (let i = 0; i < (52 * v.decks) / 13; i++)
          piles.push({
            id: `done${i}`,
            kind: 'foundation',
            col: o.firstFoundationCol + i,
            row: 0,
            fan: 'none',
            cards: s.runs[i] === undefined ? [] : [{ card: s.runs[i]!, up: true }],
            empty: 'K',
          });
      s.columns.forEach((p, i) =>
        piles.push({
          id: `c${i}`,
          kind: 'tableau',
          col: i,
          row: 1,
          fan: 'down',
          cards: p.map((card, k) => ({ card, up: k >= s.down[i]! })),
          empty: v.empty === 'king' ? 'K' : undefined,
        }),
      );
      return piles;
    },
    canPick: (s, from) => source(s, from) !== null,
    moveTo,
    autoMove: (s, from) => {
      const src = source(s, from);
      if (!src) return null;
      const columns = s.columns
        .map((p, j) => ({ id: `c${j}`, empty: p.length === 0 }))
        .sort((a, b) => Number(a.empty) - Number(b.empty))
        .map((x) => x.id);
      for (const to of [...s.foundations.map((_, j) => `f${j}`), ...columns]) {
        const m = moveTo(s, from, to);
        if (m) return m;
      }
      return null;
    },
    stockMove: (s) => (legalColumnsMoves(v, s).includes('deal') ? 'deal' : null),
    finishMove: (s) => {
      if (v.foundations === 0 || s.result || s.stock.length || s.waste.length || faceDown(s))
        return null;
      return legalColumnsMoves(v, s).find((m) => m.includes('>f')) ?? null;
    },
    moveEnds: (s, m) => {
      if (m === 'deal')
        return {
          from: s.stock.length ? { pile: 'stock', index: s.stock.length - 1 } : null,
          to: 'stock',
        };
      const [from, to] = m.split('>') as [string, string];
      if (from === 'w') return { from: { pile: 'waste', index: s.waste.length - 1 }, to };
      const [i, k] = from.slice(1).split(':').map(Number) as [number, number | undefined];
      return { from: { pile: `c${i}`, index: k ?? s.columns[i]!.length - 1 }, to };
    },
    describe: (before, m, after, t, locale) => {
      const extra = [
        after.runs.length > before.runs.length ? t('announce.run') : '',
        faceDown(after) < faceDown(before) ? t('announce.flip') : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (m === 'deal') return `${t('announce.deal')} ${extra}`.trim();
      const { card, n } = describeCard(before, m);
      const to = m.split('>')[1]!;
      const base =
        to[0] === 'f'
          ? t('announce.home', { card: cardName(card, locale) })
          : t('announce.move', { n, card: cardName(card, locale), pile: Number(to.slice(1)) + 1 });
      return `${base} ${extra}`.trim();
    },
    sound: (before, m, after) =>
      m.includes('>f') || after.runs.length > before.runs.length
        ? 'home'
        : m === 'deal'
          ? 'draw'
          : faceDown(after) < faceDown(before)
            ? 'flip'
            : 'place',
    env: o.env,
    agents: o.agents,
    hintAgent: 'planner',
    watchAgent: 'planner',
    onEnd: o.onEnd,
  };
}
