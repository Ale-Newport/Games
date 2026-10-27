import type { GameProps } from '../../core/game-engine/types';
import type { Geometry } from '../shared/sudoku/grid';
import type { SudokuState } from '../shared/sudoku/play';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { Cages } from './Cages';
import { KILLER } from './engine';
import { STRINGS } from './i18n';

const SPEED = { difficulty: 'medium', ms: 15 * 60 * 1000 };
const overlay = (geo: Geometry, state: SudokuState) => <Cages geo={geo} state={state} />;

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={KILLER}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
      overlay={overlay}
      roomForSums
    />
  );
}
