import type { GameProps } from '../../core/game-engine/types';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { SUDOKU_16 } from './engine';
import { STRINGS } from './i18n';

const SPEED = { difficulty: 'easy', ms: 30 * 60 * 1000 };

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={SUDOKU_16}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
    />
  );
}
