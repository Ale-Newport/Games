/** The killer cages: sums as labels, broken cages in red. */
import type { Geometry } from '../shared/sudoku/grid';
import { CageOverlay } from '../shared/sudoku/CageOverlay';
import type { SudokuState } from '../shared/sudoku/play';
import { badCages } from './engine';

export function Cages({ geo, state }: { geo: Geometry; state: SudokuState }) {
  const cages = state.cages ?? [];
  return (
    <CageOverlay
      geo={geo}
      cages={cages}
      labels={cages.map((c) => String(c.sum))}
      bad={badCages(state)}
    />
  );
}
