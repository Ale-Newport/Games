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
};

export async function loadAiBundle(gameId: string): Promise<AnyBundle> {
  const loader = AI_BUNDLES[gameId];
  if (!loader) throw new Error(`No AI bundle registered for "${gameId}"`);
  return loader();
}
