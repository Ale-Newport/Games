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
import { manifest as kingOfTheHill } from './king-of-the-hill/manifest';
import { manifest as threeCheck } from './three-check-chess/manifest';
import { manifest as gardner } from './gardner-minichess/manifest';
import { manifest as shogi } from './shogi/manifest';
import { manifest as animalShogi } from './dobutsu-shogi/manifest';
import { manifest as xiangqi } from './xiangqi/manifest';
import { manifest as janggi } from './janggi/manifest';
import { manifest as go9 } from './go-9x9/manifest';
import { manifest as go13 } from './go-13x13/manifest';
import { manifest as go19x19 } from './go-19x19/manifest';
import { manifest as hex7x7 } from './hex-7x7/manifest';
import { manifest as hex11x11 } from './hex-11x11/manifest';
import { manifest as nineMensMorris } from './nine-mens-morris/manifest';
import { manifest as threeMensMorris } from './three-mens-morris/manifest';
import { manifest as sixMensMorris } from './six-mens-morris/manifest';
import { manifest as quarto } from './quarto/manifest';
import { manifest as pentago } from './pentago/manifest';
import { manifest as stackingGobblers } from './stacking-gobblers/manifest';
import { manifest as teeko } from './teeko/manifest';
import { manifest as ataxx } from './ataxx/manifest';
import { manifest as breakthrough } from './breakthrough/manifest';
import { manifest as isolation } from './isolation/manifest';
import { manifest as dotsAndBoxes } from './dots-and-boxes/manifest';
import { manifest as nim } from './nim/manifest';
import { manifest as misereNim } from './misere-nim/manifest';
import { manifest as wythoff } from './wythoff/manifest';
import { manifest as subtractionGame } from './subtraction-game/manifest';
import { manifest as chomp } from './chomp/manifest';
import { manifest as kayles } from './kayles/manifest';
import { manifest as domineering } from './domineering/manifest';
import { manifest as cram } from './cram/manifest';

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
  { manifest: kingOfTheHill, load: () => import('./king-of-the-hill/index') },
  { manifest: threeCheck, load: () => import('./three-check-chess/index') },
  { manifest: gardner, load: () => import('./gardner-minichess/index') },
  { manifest: shogi, load: () => import('./shogi/index') },
  { manifest: animalShogi, load: () => import('./dobutsu-shogi/index') },
  { manifest: xiangqi, load: () => import('./xiangqi/index') },
  { manifest: janggi, load: () => import('./janggi/index') },
  { manifest: go9, load: () => import('./go-9x9/index') },
  { manifest: go13, load: () => import('./go-13x13/index') },
  { manifest: go19x19, load: () => import('./go-19x19/index') },
  { manifest: hex7x7, load: () => import('./hex-7x7/index') },
  { manifest: hex11x11, load: () => import('./hex-11x11/index') },
  { manifest: nineMensMorris, load: () => import('./nine-mens-morris/index') },
  { manifest: threeMensMorris, load: () => import('./three-mens-morris/index') },
  { manifest: sixMensMorris, load: () => import('./six-mens-morris/index') },
  { manifest: quarto, load: () => import('./quarto/index') },
  { manifest: pentago, load: () => import('./pentago/index') },
  { manifest: stackingGobblers, load: () => import('./stacking-gobblers/index') },
  { manifest: teeko, load: () => import('./teeko/index') },
  { manifest: ataxx, load: () => import('./ataxx/index') },
  { manifest: breakthrough, load: () => import('./breakthrough/index') },
  { manifest: isolation, load: () => import('./isolation/index') },
  { manifest: dotsAndBoxes, load: () => import('./dots-and-boxes/index') },
  { manifest: nim, load: () => import('./nim/index') },
  { manifest: misereNim, load: () => import('./misere-nim/index') },
  { manifest: wythoff, load: () => import('./wythoff/index') },
  { manifest: subtractionGame, load: () => import('./subtraction-game/index') },
  { manifest: chomp, load: () => import('./chomp/index') },
  { manifest: kayles, load: () => import('./kayles/index') },
  { manifest: domineering, load: () => import('./domineering/index') },
  { manifest: cram, load: () => import('./cram/index') },
];

export const MANIFESTS: readonly GameManifest[] = GAMES.map((g) => g.manifest);

export function findGame(id: string): GameRegistration | undefined {
  return GAMES.find((g) => g.manifest.id === id);
}
