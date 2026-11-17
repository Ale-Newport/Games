import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { distanceToExit, greedyMove, klotskiActions, solverStep } from '../ai';
import { klotskiEnv } from '../ai-adapter';
import {
  LEVELS,
  blocksOf,
  countMoves,
  isSolvedKey,
  isValidKlotskiState,
  movesFrom,
  newKlotski,
  parse,
  puzzleOf,
  reach,
  relocate,
  solve,
  undo,
} from '../engine';
import { PUZZLES } from '../puzzles';
import { KLOTSKI_SAVE, isKlotskiSave, withBest } from '../save';
import { unwrap } from '../../../core/persistence/versioned';

const TRADITIONAL = 'VAaVvaavVHhVvSSvS..S';

describe('Sliding Blocks tray', () => {
  it('reads blocks from a position key and moves them along free paths, even round corners', () => {
    const board = parse(TRADITIONAL);
    expect(
      blocksOf(board)
        .map((b) => b.kind)
        .sort()
        .join(''),
    ).toBe('AHSSSSVVVV');
    const square = blocksOf(board).find((b) => b.kind === 'S' && b.at === 13)!;
    // The square at row 4, column 2 can drop into either free cell below.
    expect(reach(board, square).sort((a, b) => a - b)).toEqual([17, 18]);
    const corner = blocksOf(board).find((b) => b.at === 16)!;
    expect(reach(board, corner).sort((a, b) => a - b)).toEqual([17, 18]);
    expect(movesFrom(board)).toHaveLength(8);
  });

  it('solves the traditional layout in 81 moves', () => {
    const plan = solve(parse(TRADITIONAL))!;
    expect(plan).toHaveLength(81);
    let s = { ...newKlotski('classic', 0) };
    for (const [from, to] of plan) s = relocate(s, from, to);
    expect(s.solved).toBe(true);
    expect(s.moves).toBe(81);
  });

  it('banks puzzles whose stated minimum is the true one, unsolved at the start', () => {
    for (const level of LEVELS) {
      expect(PUZZLES[level].length).toBeGreaterThanOrEqual(level === 'classic' ? 1 : 60);
      expect(new Set(PUZZLES[level].map((e) => e.split(':')[0])).size).toBe(PUZZLES[level].length);
      // The first and last puzzle, plus the first appended one (index 36 easy, 32 otherwise).
      const appended = level === 'easy' ? 36 : 32;
      const sample = [0, appended, PUZZLES[level].length - 1].filter(
        (i) => i < PUZZLES[level].length,
      );
      for (const i of sample) {
        const { key, best } = puzzleOf(level, i);
        expect(isSolvedKey(key)).toBe(false);
        expect(solve(parse(key))).toHaveLength(best);
      }
    }
    expect(puzzleOf('classic', 0)).toEqual({ key: TRADITIONAL, best: 81 });
  });

  it('keeps every level within its range of fewest moves', () => {
    const range = { easy: [10, 25], medium: [26, 50], hard: [51, 999], classic: [81, 81] };
    for (const level of LEVELS)
      for (let i = 0; i < PUZZLES[level].length; i++) {
        const { best } = puzzleOf(level, i);
        expect(best).toBeGreaterThanOrEqual(range[level][0]!);
        expect(best).toBeLessThanOrEqual(range[level][1]!);
      }
  });
});

describe('Sliding Blocks play', () => {
  it('counts a block moved twice in a row as one move, undoes and validates saves by replay', () => {
    let s = newKlotski('classic', 0);
    s = relocate(s, 13, 17);
    expect(s.moves).toBe(1);
    s = relocate(s, 17, 18);
    expect(s.moves).toBe(1);
    s = relocate(s, 14, 13);
    expect(s.moves).toBe(2);
    expect(countMoves(s.steps)).toBe(2);
    expect(relocate(s, 0, 4)).toBe(s);
    expect(isValidKlotskiState(s)).toBe(true);
    expect(isValidKlotskiState({ ...s, moves: 3 })).toBe(false);
    expect(isValidKlotskiState({ ...s, steps: [...s.steps, [0, 4]] })).toBe(false);
    s = undo(s);
    expect(s.moves).toBe(1);
    expect(s.undos).toBe(1);
    expect(isValidKlotskiState(s)).toBe(true);
  });

  it('agents: the solver follows the shortest plan, the greedy never steps straight back', () => {
    let s = newKlotski('easy', 3);
    const best = puzzleOf('easy', s.index).best;
    while (!s.solved) {
      const [from, to] = solverStep(s.board)!;
      s = relocate(s, from, to);
    }
    expect(s.moves).toBe(best);
    let g = newKlotski('easy', 3);
    const rng = new Rng(4);
    for (let i = 0; i < 10 && !g.solved; i++) {
      const a = greedyMove(g, rng);
      expect(klotskiActions(g)).toContain(a);
      const last = g.steps[g.steps.length - 1];
      if (last) expect(a).not.toBe(`${last[1]}:${last[0]}`);
      const [from, to] = a.split(':').map(Number) as [number, number];
      g = relocate(g, from, to);
    }
    expect(distanceToExit(parse(TRADITIONAL))).toBe(3);
  });
});

describe('Sliding Blocks saves', () => {
  it('migrates a schema-1 save (puzzle in progress only) to schema 2 with no solved puzzles', () => {
    const state = relocate(newKlotski('medium', 7), 13, 17);
    const old = { schema: 1, savedAt: 1, data: { state, daily: false } };
    const r = unwrap(KLOTSKI_SAVE, old);
    expect(r.ok && r.data).toEqual({ state, daily: false, best: {} });
  });

  it('keeps the fewest moves per puzzle and rejects unknown puzzles or bad counts', () => {
    let best = withBest({}, 'easy', 59, 30);
    best = withBest(best, 'easy', 59, 28);
    best = withBest(best, 'easy', 59, 40);
    expect(best).toEqual({ 'easy:59': 28 });
    expect(isKlotskiSave({ state: null, daily: false, best })).toBe(true);
    expect(isKlotskiSave({ state: null, daily: false, best: { 'easy:999': 3 } })).toBe(false);
    expect(isKlotskiSave({ state: null, daily: false, best: { 'easy:1': 0 } })).toBe(false);
    expect(isKlotskiSave({ state: null, daily: false, best: { 'nope:1': 3 } })).toBe(false);
    expect(isKlotskiSave({ state: null, best })).toBe(false);
  });
});

describeAdapterContract(klotskiEnv, {
  configs: [undefined, { level: 'medium' }],
  playouts: 3,
  maxSteps: 310,
  illegalActions: (s) => ['0:0', '99:1', 'x'].filter((a) => !klotskiActions(s).includes(a)),
});
