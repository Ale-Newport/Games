/**
 * Registry of playable games. A game is added here only when it is COMPLETE
 * (tests/platform/roadmap.test.ts enforces this). Manifests are eager and tiny; implementations
 * are code-split and loaded on demand.
 */
import type { GameManifest, GameRegistration } from '../core/game-engine/types';

export const GAMES: readonly GameRegistration[] = [];

export const MANIFESTS: readonly GameManifest[] = GAMES.map((g) => g.manifest);

export function findGame(id: string): GameRegistration | undefined {
  return GAMES.find((g) => g.manifest.id === id);
}
