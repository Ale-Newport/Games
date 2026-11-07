import type { GameProps } from '../../core/game-engine/types';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { SUDOKU_6 } from './engine';
import { STRINGS } from './i18n';

const SPEED = { difficulty: 'medium', ms: 3 * 60 * 1000 };

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={SUDOKU_6}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
    />
  );
}
