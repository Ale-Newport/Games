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
};

export async function loadAiBundle(gameId: string): Promise<AnyBundle> {
  const loader = AI_BUNDLES[gameId];
  if (!loader) throw new Error(`No AI bundle registered for "${gameId}"`);
  return loader();
}
