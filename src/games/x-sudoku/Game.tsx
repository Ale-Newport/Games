import type { GameProps } from '../../core/game-engine/types';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { X_SUDOKU, onDiagonal } from './engine';
import { STRINGS } from './i18n';
import styles from './XSudoku.module.css';

const SPEED = { difficulty: 'medium', ms: 10 * 60 * 1000 };

const diagonals = () => (
  <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
    <line x1="0" y1="0" x2="100" y2="100" />
    <line x1="100" y1="0" x2="0" y2="100" />
  </svg>
);
const cellClass = (cell: number) => (onDiagonal(cell) ? styles.diag! : '');

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={X_SUDOKU}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
      overlay={diagonals}
      cellClass={cellClass}
    />
  );
}
