import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { blockers, greedyMove, jamActions, solverMove } from '../ai';
import { jamEnv } from '../ai-adapter';
import {
  LEVELS,
  SIZE,
  cellsOf,
  isValidJamState,
  move,
  newJam,
  parseBoard,
  range,
  slides,
  solve,
  undo,
} from '../engine';
import { PUZZLES } from '../puzzles';

describe('Traffic Jam puzzles', () => {
  it('stores well-formed boards whose fewest-move count the solver confirms', () => {
    for (const level of LEVELS) {
      const list = PUZZLES[level];
      expect(list.length).toBeGreaterThanOrEqual(50);
      expect(new Set(list).size).toBe(list.length);
      for (const entry of list.slice(0, 6)) {
        const [board, moves] = entry.split(':') as [string, string];
        expect(board).toMatch(/^[A-Zo]{36}$/);
        const p = parseBoard(board, Number(moves));
        expect(p.vehicles[0]).toMatchObject({ line: 2, horizontal: true, length: 2 });
        const cells = p.vehicles.flatMap((v, i) => cellsOf(v, p.start[i]!));
        expect(new Set(cells).size).toBe(cells.length);
        expect(solve(p.vehicles, p.start)).toHaveLength(p.optimal);
      }
    }
  });

  it('levels get harder', () => {
    const avg = (level: (typeof LEVELS)[number]) =>
      PUZZLES[level].reduce((n, e) => n + Number(e.split(':')[1]), 0) / PUZZLES[level].length;
    expect(avg('easy')).toBeLessThan(avg('medium'));
    expect(avg('medium')).toBeLessThan(avg('hard'));
    for (const e of PUZZLES.hard) expect(Number(e.split(':')[1])).toBeGreaterThanOrEqual(20);
  });
});

describe('Traffic Jam play', () => {
  it('slides vehicles only along free lanes, undoes, and frees the red car', () => {
    let s = newJam('easy', 3);
    const [i, to] = slides(s.puzzle.vehicles, s.pos)[0]!;
    const [lo, hi] = range(s.puzzle.vehicles, s.pos, i);
    expect(to).toBeGreaterThanOrEqual(lo);
    expect(to).toBeLessThanOrEqual(hi);
    expect(move(s, i, SIZE + 3)).toBe(s);
    s = move(s, i, to);
    expect(s.moves).toBe(1);
    s = undo(s);
    expect(s.pos).toEqual(s.puzzle.start);
    let k = 0;
    while (!s.solved) {
      const [a, b] = solverMove(s).split(':').map(Number) as [number, number];
      s = move(s, a, b);
      k++;
    }
    expect(k).toBe(s.puzzle.optimal);
    expect(s.pos[0]).toBe(SIZE - 2);
  });

  it('the greedy driver keeps to legal slides and counts blockers', () => {
    let s = newJam('medium', 5);
    const rng = new Rng(2);
    expect(blockers(s)).toBeGreaterThanOrEqual(0);
    for (let n = 0; n < 20 && !s.solved; n++) {
      const a = greedyMove(s, rng);
      expect(jamActions(s)).toContain(a);
      const [i, to] = a.split(':').map(Number) as [number, number];
      s = move(s, i, to);
    }
  });

  it('validates saves', () => {
    const s0 = newJam('hard', 8);
    const [i, to] = slides(s0.puzzle.vehicles, s0.pos)[0]!;
    const s = move(s0, i, to);
    expect(isValidJamState(s)).toBe(true);
    expect(isValidJamState({ ...s, pos: s.pos.map(() => 0) })).toBe(false);
    expect(isValidJamState({ ...s, solved: true })).toBe(false);
    expect(isValidJamState({ ...s, level: 'nope' })).toBe(false);
  });
});

describeAdapterContract(jamEnv, {
  configs: [undefined, { level: 'medium' }],
  playouts: 4,
  maxSteps: 200,
  illegalActions: (s) => ['0:9', '99:0', 'x'].filter((a) => !jamActions(s).includes(a)),
});
