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
import { manifest as gomoku } from './gomoku/manifest';
import { manifest as renju } from './renju/manifest';
import { manifest as pente } from './pente/manifest';
import { manifest as reversi8 } from './reversi-8x8/manifest';
import { manifest as reversi6 } from './reversi-6x6/manifest';
import { manifest as englishCheckers } from './english-checkers/manifest';
import { manifest as internationalDraughts } from './international-draughts/manifest';
import { manifest as spanishCheckers } from './spanish-checkers/manifest';
import { manifest as chess } from './chess/manifest';
import { manifest as chess960 } from './chess960/manifest';
import { manifest as antichess } from './antichess/manifest';

export const GAMES: readonly GameRegistration[] = [
  { manifest: ticTacToe, load: () => import('./tic-tac-toe/index') },
  { manifest: ticTacToe4x4, load: () => import('./tic-tac-toe-4x4/index') },
  { manifest: ultimate, load: () => import('./ultimate-tic-tac-toe/index') },
  { manifest: misere, load: () => import('./misere-tic-tac-toe/index') },
  { manifest: fourInARow, load: () => import('./four-in-a-row/index') },
  { manifest: connectFive, load: () => import('./connect-five-gravity/index') },
  { manifest: gomoku, load: () => import('./gomoku/index') },
  { manifest: renju, load: () => import('./renju/index') },
  { manifest: pente, load: () => import('./pente/index') },
  { manifest: reversi8, load: () => import('./reversi-8x8/index') },
  { manifest: reversi6, load: () => import('./reversi-6x6/index') },
  { manifest: englishCheckers, load: () => import('./english-checkers/index') },
  { manifest: internationalDraughts, load: () => import('./international-draughts/index') },
  { manifest: spanishCheckers, load: () => import('./spanish-checkers/index') },
  { manifest: chess, load: () => import('./chess/index') },
  { manifest: chess960, load: () => import('./chess960/index') },
  { manifest: antichess, load: () => import('./antichess/index') },
];

export const MANIFESTS: readonly GameManifest[] = GAMES.map((g) => g.manifest);

export function findGame(id: string): GameRegistration | undefined {
  return GAMES.find((g) => g.manifest.id === id);
}
