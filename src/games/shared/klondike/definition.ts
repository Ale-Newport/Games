/** Solitaire-shell definition builder for the Klondike games (#071, #072). */
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
import { parseKlondikeMove } from './ai';
import {
  applyKlondikeMove,
  dealKlondike,
  faceDownCount,
  isValidKlondikeState,
  legalKlondikeMoves,
  replayKlondike,
  type KlondikeState,
} from './engine';
import { KLONDIKE_STRINGS } from './i18n';

const pileIndex = (id: string) => Number(id.slice(1));

/** The move-string prefix for the cards picked at `from`. */
function source(s: KlondikeState, from: CardRef): { code: string; single: boolean } | null {
  if (from.pile === 'waste')
    return from.index === s.waste.length - 1 ? { code: 'w', single: true } : null;
  if (from.pile[0] === 'f') {
    const f = s.foundations[pileIndex(from.pile)]!;
    return from.index === f.length - 1 ? { code: from.pile, single: true } : null;
  }
  if (from.pile[0] === 't') {
    const i = pileIndex(from.pile);
    const p = s.tableau[i]!;
    if (from.index < s.down[i]! || from.index >= p.length) return null;
    return { code: `t${i}:${from.index}`, single: from.index === p.length - 1 };
  }
  return null;
}

function moveTo(s: KlondikeState, from: CardRef, to: string): string | null {
  const src = source(s, from);
  if (!src || to === from.pile || (to[0] !== 'f' && to[0] !== 't')) return null;
  let m: string;
  if (to[0] === 'f') {
    if (!src.single) return null;
    m = `${src.code.split(':')[0]}>${to}`;
  } else m = `${src.code}>${to}`;
  return legalKlondikeMoves(s).includes(m) ? m : null;
}

export interface KlondikeGameOptions {
  draw: 1 | 3;
  env: GameEnvironment<KlondikeState, string>;
  agents: AgentPreset<KlondikeState, string>[];
  strings: Record<Locale, Dictionary>;
  onEnd?: (event: SolitaireEndEvent<KlondikeState>) => void;
}

export function createKlondikeDefinition(
  o: KlondikeGameOptions,
): SolitaireDefinition<KlondikeState> {
  const { draw } = o;
  return {
    mode: `draw-${draw}`,
    strings: {
      en: { ...KLONDIKE_STRINGS.en, ...o.strings.en },
      es: { ...KLONDIKE_STRINGS.es, ...o.strings.es },
    },
    columns: 7,
    deal: (seed) => dealKlondike(seed, draw),
    seedOf: (s) => s.seed,
    historyOf: (s) => s.history,
    replay: (seed, history) => replayKlondike(seed, draw, history),
    validate: (d): d is KlondikeState => isValidKlondikeState(d, draw),
    apply: applyKlondikeMove,
    legal: legalKlondikeMoves,
    status: (s) => (s.result === 'won' ? 'won' : s.result === 'lost' ? 'lost' : 'playing'),
    score: (s) => s.score,
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
        fanLast: draw,
        cards: s.waste.map((card) => ({ card, up: true })),
      },
      ...s.foundations.map((f, i): PileView => ({
        id: `f${i}`,
        kind: 'foundation',
        col: 3 + i,
        row: 0,
        fan: 'none',
        cards: f.map((card) => ({ card, up: true })),
        empty: 'A',
      })),
      ...s.tableau.map((p, i): PileView => ({
        id: `t${i}`,
        kind: 'tableau',
        col: i,
        row: 1,
        fan: 'down',
        cards: p.map((card, k) => ({ card, up: k >= s.down[i]! })),
        empty: 'K',
      })),
    ],
    canPick: (s, from) => source(s, from) !== null,
    moveTo,
    autoMove: (s, from) => {
      const src = source(s, from);
      if (!src) return null;
      const targets = [
        ...(src.single ? s.foundations.map((_, i) => `f${i}`) : []),
        // Non-empty tableau piles before empty ones (an empty pile is precious).
        ...s.tableau
          .map((p, i) => ({ id: `t${i}`, empty: p.length === 0 }))
          .sort((a, b) => Number(a.empty) - Number(b.empty))
          .map((x) => x.id),
      ];
      for (const to of targets) {
        const m = moveTo(s, from, to);
        if (m) return m;
      }
      return null;
    },
    stockMove: (s) => (legalKlondikeMoves(s).includes('draw') ? 'draw' : null),
    finishMove: (s) => {
      if (s.result || s.stock.length || s.waste.length || faceDownCount(s) > 0) return null;
      return legalKlondikeMoves(s).find((m) => m.includes('>f')) ?? null;
    },
    moveEnds: (s, m) => {
      const p = parseKlondikeMove(m);
      if (p.from === 'd')
        return {
          from: s.stock.length ? { pile: 'stock', index: s.stock.length - 1 } : null,
          to: 'waste',
        };
      const to = `${p.to}${p.dest}`;
      if (p.from === 'w') return { from: { pile: 'waste', index: s.waste.length - 1 }, to };
      if (p.from === 'f')
        return { from: { pile: `f${p.pile}`, index: s.foundations[p.pile]!.length - 1 }, to };
      const pile = s.tableau[p.pile]!;
      return { from: { pile: `t${p.pile}`, index: p.at === -1 ? pile.length - 1 : p.at }, to };
    },
    describe: (before, m, after, t, locale) => {
      const p = parseKlondikeMove(m);
      if (p.from === 'd')
        return before.stock.length
          ? t('announce.draw', { card: cardName(after.waste[after.waste.length - 1]!, locale) })
          : t('announce.recycle');
      const moved =
        p.from === 'w'
          ? before.waste[before.waste.length - 1]!
          : p.from === 'f'
            ? before.foundations[p.pile]![before.foundations[p.pile]!.length - 1]!
            : before.tableau[p.pile]![p.at === -1 ? before.tableau[p.pile]!.length - 1 : p.at]!;
      const card = cardName(moved, locale);
      const flipped = faceDownCount(after) < faceDownCount(before);
      const base =
        p.to === 'f'
          ? t('announce.home', { card })
          : t('announce.move', { card, pile: p.dest + 1 });
      return flipped ? `${base} ${t('announce.flip')}` : base;
    },
    sound: (before, m, after) => {
      if (m === 'draw') return 'draw';
      if (m.includes('>f')) return 'home';
      return faceDownCount(after) < faceDownCount(before) ? 'flip' : 'place';
    },
    env: o.env,
    agents: o.agents,
    hintAgent: 'planner',
    watchAgent: 'planner',
    onEnd: o.onEnd,
  };
}
