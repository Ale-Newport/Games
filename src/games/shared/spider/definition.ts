/** Solitaire-shell definition builder for the Spider games (#074–#076). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { Dictionary, Locale } from '../../../core/i18n';
import { cardName, suitOf } from '../cards/cards';
import type {
  CardRef,
  PileView,
  SolitaireDefinition,
  SolitaireEndEvent,
} from '../solitaire/SolitaireGame';
import {
  applySpiderMove,
  dealSpider,
  faceDown,
  isValidSpiderState,
  legalSpiderMoves,
  replaySpider,
  runStart,
  type SpiderState,
  type SpiderSuits,
} from './engine';
import { SPIDER_STRINGS } from './i18n';

export interface SpiderGameOptions {
  suits: SpiderSuits;
  env: GameEnvironment<SpiderState, string>;
  agents: AgentPreset<SpiderState, string>[];
  strings: Record<Locale, Dictionary>;
  onEnd?: (event: SolitaireEndEvent<SpiderState>) => void;
}

const col = (id: string) => Number(id.slice(1));

export function createSpiderDefinition(o: SpiderGameOptions): SolitaireDefinition<SpiderState> {
  const canPick = (s: SpiderState, from: CardRef) => {
    if (from.pile[0] !== 'c') return false;
    const p = s.columns[col(from.pile)];
    return !!p && from.index < p.length && from.index >= runStart(s, col(from.pile));
  };
  const moveTo = (s: SpiderState, from: CardRef, to: string) => {
    if (!canPick(s, from) || to[0] !== 'c' || to === from.pile) return null;
    const m = `${from.pile}:${from.index}>${to}`;
    return legalSpiderMoves(s).includes(m) ? m : null;
  };
  return {
    mode: `suits-${o.suits}`,
    strings: {
      en: { ...SPIDER_STRINGS.en, ...o.strings.en },
      es: { ...SPIDER_STRINGS.es, ...o.strings.es },
    },
    columns: 10,
    deal: (seed) => dealSpider(seed, o.suits),
    seedOf: (s) => s.seed,
    historyOf: (s) => s.history,
    replay: (seed, history) => replaySpider(seed, o.suits, history),
    validate: (d): d is SpiderState => isValidSpiderState(d, o.suits),
    apply: applySpiderMove,
    legal: legalSpiderMoves,
    status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
    score: (s) => s.score,
    info: (s, t) => t('info.deals', { n: s.stock.length / 10 }),
    piles: (s): PileView[] => [
      ...Array.from({ length: 8 }, (_, i): PileView => ({
        id: `done${i}`,
        kind: 'foundation',
        col: i,
        row: 0,
        fan: 'none',
        cards: s.completed[i] === undefined ? [] : [{ card: s.completed[i]!, up: true }],
        empty: 'K',
      })),
      {
        id: 'stock',
        kind: 'stock',
        col: 9,
        row: 0,
        fan: 'none',
        cards: s.stock.map((card) => ({ card, up: false })),
      },
      ...s.columns.map((p, i): PileView => ({
        id: `c${i}`,
        kind: 'tableau',
        col: i,
        row: 1,
        fan: 'down',
        cards: p.map((card, k) => ({ card, up: k >= s.down[i]! })),
      })),
    ],
    canPick,
    moveTo,
    autoMove: (s, from) => {
      if (!canPick(s, from)) return null;
      const card = s.columns[col(from.pile)]![from.index]!;
      // Same suit first, then any card one higher, then an empty column.
      const ranked = s.columns
        .map((p, j) => ({ id: `c${j}`, p }))
        .filter((x) => x.id !== from.pile)
        .sort((a, b) => {
          const score = (p: number[]) =>
            p.length === 0 ? 0 : suitOf(p[p.length - 1]!) === suitOf(card) ? 2 : 1;
          return score(b.p) - score(a.p);
        });
      for (const x of ranked) {
        const m = moveTo(s, from, x.id);
        if (m) return m;
      }
      return null;
    },
    stockMove: (s) => (legalSpiderMoves(s).includes('deal') ? 'deal' : null),
    finishMove: () => null,
    moveEnds: (s, m) => {
      if (m === 'deal') return { from: { pile: 'stock', index: s.stock.length - 1 }, to: 'stock' };
      const [from, to] = m.split('>') as [string, string];
      const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
      return { from: { pile: `c${i}`, index: k }, to };
    },
    describe: (before, m, after, t, locale) => {
      const extra = [
        after.completed.length > before.completed.length ? t('announce.run') : '',
        faceDown(after) < faceDown(before) && m !== 'deal' ? t('announce.flip') : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (m === 'deal') return `${t('announce.deal')} ${extra}`.trim();
      const [from, to] = m.split('>') as [string, string];
      const [i, k] = from.slice(1).split(':').map(Number) as [number, number];
      const p = before.columns[i]!;
      const base = t('announce.move', {
        n: p.length - k,
        card: cardName(p[k]!, locale),
        pile: col(to) + 1,
      });
      return `${base} ${extra}`.trim();
    },
    sound: (before, m, after) =>
      after.completed.length > before.completed.length
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
