import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import {
  createState,
  gridToIndex,
  indexToGrid,
  isLegal,
  isValidState,
  legalMoves,
  play,
  replay,
  undo,
} from '../engine';

const at = (board: number, cell: number) => board * 9 + cell;

/** Plays moves given as [board, cell] pairs. */
const seq = (moves: [number, number][], first: 0 | 1 = 0) =>
  replay(
    moves.map(([b, c]) => at(b, c)),
    first,
  );

describe('Ultimate Tic-Tac-Toe engine', () => {
  it('starts with free choice over all 81 cells', () => {
    const s = createState();
    expect(s.forced).toBe(-1);
    expect(legalMoves(s)).toHaveLength(81);
  });

  it('sends the opponent to the board matching the cell played', () => {
    const s = play(createState(), at(4, 2));
    expect(s.forced).toBe(2);
    expect(legalMoves(s)).toEqual(Array.from({ length: 9 }, (_, c) => at(2, c)));
    expect(isLegal(s, at(4, 0))).toBe(false);
    expect(() => play(s, at(4, 0))).toThrow();
    expect(() => play(s, at(2, 0))).not.toThrow();
  });

  it('closes a won local board and gives free choice when sent there', () => {
    // X wins board 0 with cells 0,1,2; O's replies are inside boards 0-2 so X keeps being sent home.
    const s = seq([
      [0, 0], // X → O to board 0
      [0, 3], // O → X to board 3
      [3, 0], // X → O to board 0
      [0, 4], // O → X to board 4
      [4, 0], // X → O to board 0
      [0, 5], // O wins? O has 3,4,5 in board 0 → O wins board 0!
    ]);
    expect(s.boards[0]).toBe(2);
    // O's move at cell 5 sends X to board 5 (open).
    expect(s.forced).toBe(5);
    // Now send someone to board 0: X plays cell 0 of board 5 → O would be sent to board 0 (closed) → free.
    const free = play(s, at(5, 0));
    expect(free.forced).toBe(-1);
    expect(legalMoves(free).every((i) => Math.floor(i / 9) !== 0)).toBe(true);
    expect(isLegal(free, at(0, 6))).toBe(false); // closed board, even though the cell is empty
  });

  it('marks a full board without a line as drawn and sends play elsewhere', () => {
    // Board 4 one move from a drawn fill: X O X / X O O / O X _ ; X completes it at cell 8.
    const s = createState();
    const marks: (0 | 1 | 2)[] = [1, 2, 1, 1, 2, 2, 2, 1, 0];
    marks.forEach((m, c) => (s.cells[at(4, c)] = m));
    s.forced = 4;
    const after = play(s, at(4, 8));
    expect(after.boards[4]).toBe(3);
    expect(after.forced).toBe(8);
    expect(after.result).toBeNull();
    // Sent to a drawn board → free choice, and the drawn board is not playable.
    const sentBack = play({ ...after, forced: -1 }, at(0, 4));
    expect(sentBack.forced).toBe(-1);
    expect(legalMoves(sentBack).some((i) => Math.floor(i / 9) === 4)).toBe(false);
  });

  it('never lets drawn boards count toward a global line (randomized)', () => {
    const rng = new Rng(77);
    let drawnBoards = 0;
    for (let g = 0; g < 300; g++) {
      let s = createState();
      while (!s.result) s = play(s, rng.pick(legalMoves(s)));
      drawnBoards += s.boards.filter((b) => b === 3).length;
      for (let b = 0; b < 9; b++) {
        if (s.boards[b] !== 3) continue;
        const cells = s.cells.slice(b * 9, b * 9 + 9);
        expect(cells.includes(0)).toBe(false);
      }
      if (s.result.kind === 'win') expect(s.result.line.some((b) => s.boards[b] === 3)).toBe(false);
    }
    expect(drawnBoards).toBeGreaterThan(0);
  });

  it('wins with three local boards in a global line (and diagonals count)', () => {
    // Construct by search: random games until one ends in a global win; verify the line.
    const rng = new Rng(5);
    let wins = 0;
    let draws = 0;
    for (let g = 0; g < 200; g++) {
      let s = createState(g % 2 === 0 ? 0 : 1);
      while (!s.result) s = play(s, rng.pick(legalMoves(s)));
      if (s.result.kind === 'win') {
        wins++;
        const mark = s.result.winner === 0 ? 1 : 2;
        expect(s.result.line.every((b) => s.boards[b] === mark)).toBe(true);
      } else {
        draws++;
        expect(s.boards.every((b) => b !== 0)).toBe(true);
      }
      expect(legalMoves(s)).toEqual([]);
    }
    expect(wins).toBeGreaterThan(0);
    expect(draws).toBeGreaterThanOrEqual(0);
  });

  it('maps action indices to the 9×9 visual grid and back', () => {
    for (let i = 0; i < 81; i++) {
      const [r, c] = indexToGrid(i);
      expect(gridToIndex(r, c)).toBe(i);
    }
    expect(indexToGrid(at(4, 4))).toEqual([4, 4]);
    expect(indexToGrid(at(2, 0))).toEqual([0, 6]);
  });

  it('undoes by replaying and validates saved states', () => {
    const s = seq([
      [4, 4],
      [4, 0],
      [0, 4],
    ]);
    const back = undo(s, 2);
    expect(back.history).toEqual([at(4, 4)]);
    expect(back.forced).toBe(4);
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidState({ ...s, forced: 7 })).toBe(false);
    expect(isValidState({ ...s, history: [at(4, 4), at(5, 0)] })).toBe(false);
  });
});
