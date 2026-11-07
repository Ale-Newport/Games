/**
 * Pure AI bundles (environment + baseline agents), loadable without React, CSS or assets. Used by the
 * AI Lab web worker, the Node environment server (tools/env-server.ts) and evaluation tooling.
 */
import type { AiBundle } from '../protocols/bundle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBundle = AiBundle<any, any>;

export const AI_BUNDLES: Record<string, () => Promise<AnyBundle>> = {
  'tic-tac-toe': () => import('../../games/tic-tac-toe/ai-adapter').then((m) => m.bundle),
  'tic-tac-toe-4x4': () => import('../../games/tic-tac-toe-4x4/ai-adapter').then((m) => m.bundle),
  'ultimate-tic-tac-toe': () =>
    import('../../games/ultimate-tic-tac-toe/ai-adapter').then((m) => m.bundle),
  'misere-tic-tac-toe': () =>
    import('../../games/misere-tic-tac-toe/ai-adapter').then((m) => m.bundle),
  'four-in-a-row': () => import('../../games/four-in-a-row/ai-adapter').then((m) => m.bundle),
  'connect-five-gravity': () =>
    import('../../games/connect-five-gravity/ai-adapter').then((m) => m.bundle),
  gomoku: () => import('../../games/gomoku/ai-adapter').then((m) => m.bundle),
  renju: () => import('../../games/renju/ai-adapter').then((m) => m.bundle),
  pente: () => import('../../games/pente/ai-adapter').then((m) => m.bundle),
  'reversi-8x8': () => import('../../games/reversi-8x8/ai-adapter').then((m) => m.bundle),
  'reversi-6x6': () => import('../../games/reversi-6x6/ai-adapter').then((m) => m.bundle),
  'english-checkers': () => import('../../games/english-checkers/ai-adapter').then((m) => m.bundle),
  'international-draughts': () =>
    import('../../games/international-draughts/ai-adapter').then((m) => m.bundle),
  'spanish-checkers': () => import('../../games/spanish-checkers/ai-adapter').then((m) => m.bundle),
  chess: () => import('../../games/chess/ai-adapter').then((m) => m.bundle),
  chess960: () => import('../../games/chess960/ai-adapter').then((m) => m.bundle),
  antichess: () => import('../../games/antichess/ai-adapter').then((m) => m.bundle),
  'king-of-the-hill': () => import('../../games/king-of-the-hill/ai-adapter').then((m) => m.bundle),
  'three-check-chess': () =>
    import('../../games/three-check-chess/ai-adapter').then((m) => m.bundle),
  'gardner-minichess': () =>
    import('../../games/gardner-minichess/ai-adapter').then((m) => m.bundle),
  shogi: () => import('../../games/shogi/ai-adapter').then((m) => m.bundle),
  'dobutsu-shogi': () => import('../../games/dobutsu-shogi/ai-adapter').then((m) => m.bundle),
  xiangqi: () => import('../../games/xiangqi/ai-adapter').then((m) => m.bundle),
  janggi: () => import('../../games/janggi/ai-adapter').then((m) => m.bundle),
  'go-9x9': () => import('../../games/go-9x9/ai-adapter').then((m) => m.bundle),
  'go-13x13': () => import('../../games/go-13x13/ai-adapter').then((m) => m.bundle),
  'go-19x19': () => import('../../games/go-19x19/ai-adapter').then((m) => m.bundle),
  'hex-7x7': () => import('../../games/hex-7x7/ai-adapter').then((m) => m.bundle),
  'hex-11x11': () => import('../../games/hex-11x11/ai-adapter').then((m) => m.bundle),
  'nine-mens-morris': () => import('../../games/nine-mens-morris/ai-adapter').then((m) => m.bundle),
  'three-mens-morris': () =>
    import('../../games/three-mens-morris/ai-adapter').then((m) => m.bundle),
  'six-mens-morris': () => import('../../games/six-mens-morris/ai-adapter').then((m) => m.bundle),
  quarto: () => import('../../games/quarto/ai-adapter').then((m) => m.bundle),
  pentago: () => import('../../games/pentago/ai-adapter').then((m) => m.bundle),
  'stacking-gobblers': () =>
    import('../../games/stacking-gobblers/ai-adapter').then((m) => m.bundle),
  teeko: () => import('../../games/teeko/ai-adapter').then((m) => m.bundle),
  ataxx: () => import('../../games/ataxx/ai-adapter').then((m) => m.bundle),
  breakthrough: () => import('../../games/breakthrough/ai-adapter').then((m) => m.bundle),
  isolation: () => import('../../games/isolation/ai-adapter').then((m) => m.bundle),
  'dots-and-boxes': () => import('../../games/dots-and-boxes/ai-adapter').then((m) => m.bundle),
  nim: () => import('../../games/nim/ai-adapter').then((m) => m.bundle),
  'misere-nim': () => import('../../games/misere-nim/ai-adapter').then((m) => m.bundle),
  wythoff: () => import('../../games/wythoff/ai-adapter').then((m) => m.bundle),
  'subtraction-game': () => import('../../games/subtraction-game/ai-adapter').then((m) => m.bundle),
  chomp: () => import('../../games/chomp/ai-adapter').then((m) => m.bundle),
  kayles: () => import('../../games/kayles/ai-adapter').then((m) => m.bundle),
  domineering: () => import('../../games/domineering/ai-adapter').then((m) => m.bundle),
  cram: () => import('../../games/cram/ai-adapter').then((m) => m.bundle),
  sim: () => import('../../games/sim/ai-adapter').then((m) => m.bundle),
  sos: () => import('../../games/sos/ai-adapter').then((m) => m.bundle),
  sprouts: () => import('../../games/sprouts/ai-adapter').then((m) => m.bundle),
  clobber: () => import('../../games/clobber/ai-adapter').then((m) => m.bundle),
  konane: () => import('../../games/konane/ai-adapter').then((m) => m.bundle),
  fanorona: () => import('../../games/fanorona/ai-adapter').then((m) => m.bundle),
  hnefatafl: () => import('../../games/hnefatafl/ai-adapter').then((m) => m.bundle),
  tablut: () => import('../../games/tablut/ai-adapter').then((m) => m.bundle),
  'fox-and-geese': () => import('../../games/fox-and-geese/ai-adapter').then((m) => m.bundle),
  'bagh-chal': () => import('../../games/bagh-chal/ai-adapter').then((m) => m.bundle),
  alquerque: () => import('../../games/alquerque/ai-adapter').then((m) => m.bundle),
  yote: () => import('../../games/yote/ai-adapter').then((m) => m.bundle),
  kalah: () => import('../../games/kalah/ai-adapter').then((m) => m.bundle),
  oware: () => import('../../games/oware/ai-adapter').then((m) => m.bundle),
  bao: () => import('../../games/bao/ai-adapter').then((m) => m.bundle),
  congkak: () => import('../../games/congkak/ai-adapter').then((m) => m.bundle),
  halma: () => import('../../games/halma/ai-adapter').then((m) => m.bundle),
  'chinese-checkers': () => import('../../games/chinese-checkers/ai-adapter').then((m) => m.bundle),
  amazons: () => import('../../games/amazons/ai-adapter').then((m) => m.bundle),
  'lines-of-action': () => import('../../games/lines-of-action/ai-adapter').then((m) => m.bundle),
  'paper-soccer': () => import('../../games/paper-soccer/ai-adapter').then((m) => m.bundle),
  'bridg-it': () => import('../../games/bridg-it/ai-adapter').then((m) => m.bundle),
  'klondike-draw-1': () => import('../../games/klondike-draw-1/ai-adapter').then((m) => m.bundle),
  'klondike-draw-3': () => import('../../games/klondike-draw-3/ai-adapter').then((m) => m.bundle),
  freecell: () => import('../../games/freecell/ai-adapter').then((m) => m.bundle),
  'spider-1-suit': () => import('../../games/spider-1-suit/ai-adapter').then((m) => m.bundle),
  'spider-2-suits': () => import('../../games/spider-2-suits/ai-adapter').then((m) => m.bundle),
  'spider-4-suits': () => import('../../games/spider-4-suits/ai-adapter').then((m) => m.bundle),
  'pyramid-solitaire': () =>
    import('../../games/pyramid-solitaire/ai-adapter').then((m) => m.bundle),
  tripeaks: () => import('../../games/tripeaks/ai-adapter').then((m) => m.bundle),
  'golf-solitaire': () => import('../../games/golf-solitaire/ai-adapter').then((m) => m.bundle),
  yukon: () => import('../../games/yukon/ai-adapter').then((m) => m.bundle),
  scorpion: () => import('../../games/scorpion/ai-adapter').then((m) => m.bundle),
  'forty-thieves': () => import('../../games/forty-thieves/ai-adapter').then((m) => m.bundle),
  accordion: () => import('../../games/accordion/ai-adapter').then((m) => m.bundle),
};

export async function loadAiBundle(gameId: string): Promise<AnyBundle> {
  const loader = AI_BUNDLES[gameId];
  if (!loader) throw new Error(`No AI bundle registered for "${gameId}"`);
  return loader();
}
