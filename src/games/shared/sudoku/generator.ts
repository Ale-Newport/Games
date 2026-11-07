/**
 * Puzzle generator: a random complete grid, then clues removed (in symmetric pairs) while the
 * solution stays unique and the techniques needed stay within the wanted levels.
 */
import { Rng } from '../../../core/game-engine/random';
import { gradePuzzle } from './logic';
import { hasUniqueSolution, randomSolution, type Extra } from './solver';
import type { Geometry, Shape } from './grid';

export interface PuzzleSpec {
  /** The hardest technique level must lie in this range (see `logic.ts`). */
  minLevel: number;
  maxLevel: number;
  /** Stop removing clues at this count (more clues = easier). */
  minClues: number;
  /** Accept only puzzles with at most this many clues. */
  maxClues: number;
  /** Remove clues in pairs symmetric through the centre. */
  symmetric?: boolean;
  attempts?: number;
  /**
   * Search budget for each uniqueness check; a check that runs out keeps the clue (so puzzles
   * stay provably unique). Needed for 16×16 grids, where rare checks explode.
   */
  maxNodes?: number;
  /** Jigsaw sudoku: every puzzle gets its own irregular regions (see `jigsaw.ts`). */
  jigsaw?: boolean;
  /** This difficulty's own grid shape (otherwise the variant's). */
  shape?: Shape;
  /** Calcudoku: no givens, arithmetic cages of these sizes instead (see `calc.ts`). */
  calc?: { min: number; max: number; singles?: number };
  /** Killer sudoku: no givens, cages of these sizes instead (see `killer.ts`). */
  cages?: { min: number; max: number };
}

export interface Puzzle {
  puzzle: number[];
  solution: number[];
  level: number;
  clues: number;
}

export function generatePuzzle(
  geo: Geometry,
  seed: number,
  spec: PuzzleSpec,
  extra?: Extra,
): Puzzle {
  const rng = new Rng(seed);
  let best: Puzzle | null = null;
  const attempts = spec.attempts ?? 40;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const solution = randomSolution(geo, rng);
    const puzzle = [...solution];
    let clues = geo.cells;
    const order = rng.shuffle(Array.from({ length: geo.cells }, (_, c) => c));
    for (const c of order) {
      if (clues <= spec.minClues) break;
      const mirror = geo.cells - 1 - c;
      const group = spec.symmetric && mirror !== c ? [c, mirror] : [c];
      if (group.some((x) => !puzzle[x])) continue;
      if (clues - group.length < spec.minClues) continue;
      for (const x of group) puzzle[x] = 0;
      if (
        !hasUniqueSolution(geo, puzzle, extra, spec.maxNodes) ||
        gradePuzzle(geo, puzzle).level > spec.maxLevel
      ) {
        for (const x of group) puzzle[x] = solution[x]!;
        continue;
      }
      clues -= group.length;
    }
    const level = gradePuzzle(geo, puzzle).level;
    const candidate = { puzzle, solution, level, clues };
    if (level >= spec.minLevel && clues <= spec.maxClues) return candidate;
    if (!best || level > best.level || (level === best.level && clues < best.clues))
      best = candidate;
  }
  return best!;
}
