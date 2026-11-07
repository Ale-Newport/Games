import type { GameProps } from '../../core/game-engine/types';
import type { Geometry } from '../shared/sudoku/grid';
import type { SudokuState } from '../shared/sudoku/play';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { FUTOSHIKI } from './engine';
import { STRINGS } from './i18n';
import { Signs } from './Signs';

const SPEED = { difficulty: 'hard', ms: 8 * 60 * 1000 };
const overlay = (geo: Geometry, state: SudokuState) => <Signs geo={geo} state={state} />;

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={FUTOSHIKI}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
      overlay={overlay}
    />
  );
}
