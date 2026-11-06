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
};

export async function loadAiBundle(gameId: string): Promise<AnyBundle> {
  const loader = AI_BUNDLES[gameId];
  if (!loader) throw new Error(`No AI bundle registered for "${gameId}"`);
  return loader();
}
