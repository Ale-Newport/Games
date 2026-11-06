/**
 * Registry of playable games. A game is added here only when it is COMPLETE
 * (tests/platform/roadmap.test.ts enforces this). Manifests are eager and tiny; implementations
 * are code-split and loaded on demand.
 */
import type { GameManifest, GameRegistration } from '../core/game-engine/types';
import { manifest as ticTacToe } from './tic-tac-toe/manifest';
import { manifest as ticTacToe4x4 } from './tic-tac-toe-4x4/manifest';
import { manifest as ultimate } from './ultimate-tic-tac-toe/manifest';
import { manifest as misere } from './misere-tic-tac-toe/manifest';
import { manifest as fourInARow } from './four-in-a-row/manifest';
import { manifest as connectFive } from './connect-five-gravity/manifest';

export const GAMES: readonly GameRegistration[] = [
  { manifest: ticTacToe, load: () => import('./tic-tac-toe/index') },
  { manifest: ticTacToe4x4, load: () => import('./tic-tac-toe-4x4/index') },
  { manifest: ultimate, load: () => import('./ultimate-tic-tac-toe/index') },
  { manifest: misere, load: () => import('./misere-tic-tac-toe/index') },
  { manifest: fourInARow, load: () => import('./four-in-a-row/index') },
  { manifest: connectFive, load: () => import('./connect-five-gravity/index') },
];

export const MANIFESTS: readonly GameManifest[] = GAMES.map((g) => g.manifest);

export function findGame(id: string): GameRegistration | undefined {
  return GAMES.find((g) => g.manifest.id === id);
}
