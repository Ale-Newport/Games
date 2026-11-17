import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { blockers, greedyMove, jamActions, solverMove } from '../ai';
import { jamEnv } from '../ai-adapter';
import {
  LEVELS,
  SIZE,
  cellsOf,
  indexForSeed,
  isValidJamState,
  move,
  newJam,
  newJamAt,
  puzzleAt,
  puzzleCount,
  parseBoard,
  range,
  slides,
  solve,
  undo,
} from '../engine';
import { PUZZLES } from '../puzzles';
import { JAM_SAVE, isJamSave, withBest } from '../save';
import { unwrap } from '../../../core/persistence/versioned';

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
    expect(avg('hard')).toBeLessThan(avg('expert'));
    for (const e of PUZZLES.hard) expect(Number(e.split(':')[1])).toBeGreaterThanOrEqual(20);
    for (const e of PUZZLES.expert) expect(Number(e.split(':')[1])).toBeGreaterThanOrEqual(30);
    // No expert puzzle repeats one from another level.
    const others = new Set<string>([...PUZZLES.easy, ...PUZZLES.medium, ...PUZZLES.hard]);
    expect(PUZZLES.expert.filter((e) => others.has(e))).toEqual([]);
  });

  it(
    'the solver confirms the fewest moves of the hardest expert puzzles',
    { timeout: 60_000 },
    () => {
      const hardest = PUZZLES.expert
        .map((e, i) => [Number(e.split(':')[1]), i] as const)
        .sort((a, b) => b[0] - a[0])
        .slice(0, 3);
      for (const [moves, i] of hardest) {
        const p = puzzleAt('expert', i);
        expect(p.optimal).toBe(moves);
        expect(solve(p.vehicles, p.start)).toHaveLength(moves);
      }
    },
  );
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

  it('opens a numbered puzzle, and a seed picks the same puzzle as its index', () => {
    const s = newJamAt('expert', puzzleCount('expert') - 1);
    expect(s.index).toBe(puzzleCount('expert') - 1);
    expect(s.puzzle).toEqual(puzzleAt('expert', s.index));
    expect(newJamAt('easy', 9999).index).toBe(puzzleCount('easy') - 1);
    const r = newJam('medium', 77);
    expect(r.index).toBe(indexForSeed('medium', 77));
    expect(r.puzzle).toEqual(puzzleAt('medium', r.index));
  });

  it('migrates schema-1 saves (seed) to schema 2 (index, solved puzzles)', () => {
    const s0 = newJam('hard', 8);
    const s = move(s0, ...slides(s0.puzzle.vehicles, s0.pos)[0]!);
    const { index, ...rest } = s;
    const old = { schema: 1, savedAt: 1, data: { state: { ...rest, seed: 8 }, daily: true } };
    const r = unwrap(JAM_SAVE, old);
    expect(r.ok && r.data).toEqual({ state: { ...rest, index }, daily: true, best: {} });
    // A schema-1 state whose seed does not match its puzzle is dropped as invalid.
    let other = 9;
    while (indexForSeed('hard', other) === index) other++;
    const wrong = {
      schema: 1,
      savedAt: 1,
      data: { state: { ...rest, seed: other }, daily: false },
    };
    expect(unwrap(JAM_SAVE, wrong).ok).toBe(false);
    let best = withBest({}, 'expert', 3, 40);
    best = withBest(best, 'expert', 3, 35);
    expect(best).toEqual({ 'expert:3': 35 });
    expect(isJamSave({ state: null, daily: false, best })).toBe(true);
    expect(isJamSave({ state: null, daily: false, best: { 'expert:9999': 3 } })).toBe(false);
    expect(isJamSave({ state: null, daily: false, best: { 'easy:1': -1 } })).toBe(false);
    expect(isJamSave({ state: s, daily: false, best: {} })).toBe(true);
  });

  it('validates saves', () => {
    const s0 = newJam('hard', 8);
    const [i, to] = slides(s0.puzzle.vehicles, s0.pos)[0]!;
    const s = move(s0, i, to);
    expect(isValidJamState(s)).toBe(true);
    expect(isValidJamState({ ...s, pos: s.pos.map(() => 0) })).toBe(false);
    expect(isValidJamState({ ...s, solved: true })).toBe(false);
    expect(isValidJamState({ ...s, level: 'nope' })).toBe(false);
    expect(isValidJamState({ ...s, index: puzzleCount('hard') })).toBe(false);
    expect(isValidJamState({ ...s, index: (s.index + 1) % puzzleCount('hard') })).toBe(false);
  });
});

describeAdapterContract(jamEnv, {
  configs: [undefined, { level: 'medium' }, { level: 'expert' }],
  playouts: 4,
  maxSteps: 200,
  illegalActions: (s) => ['0:9', '99:0', 'x'].filter((a) => !jamActions(s).includes(a)),
});
