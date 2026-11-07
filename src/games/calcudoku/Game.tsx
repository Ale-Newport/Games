import type { GameProps } from '../../core/game-engine/types';
import { CageOverlay } from '../shared/sudoku/CageOverlay';
import type { Geometry } from '../shared/sudoku/grid';
import type { SudokuState } from '../shared/sudoku/play';
import { SudokuGame } from '../shared/sudoku/SudokuGame';
import { CALC, badCalc, cageLabel } from './engine';
import { STRINGS } from './i18n';

const SPEED = { difficulty: 'hard', ms: 10 * 60 * 1000 };
const overlay = (geo: Geometry, state: SudokuState) => {
  const cages = state.calc ?? [];
  return <CageOverlay geo={geo} cages={cages} labels={cages.map(cageLabel)} bad={badCalc(state)} />;
};

export function Game({ services }: GameProps) {
  return (
    <SudokuGame
      services={services}
      variant={CALC}
      strings={STRINGS}
      testId="sudoku"
      speed={SPEED}
      overlay={overlay}
      roomForSums
    />
  );
}
