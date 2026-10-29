import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { cubeActions, greedyTurn, matching } from '../../shared/cube/ai';
import { readCubies } from '../../shared/cube/twophase';
import { cube3Env } from '../ai-adapter';
import {
  SPECS,
  applyAll,
  isSolvedCube,
  isValidCubeState,
  moveName,
  newCube,
  parseMove,
  play,
  scramble,
  simplify,
  solve,
  solvedCube,
  turn,
  undo,
  undoSequence,
} from '../engine';

describe('Twisty cube 3×3 model', () => {
  it('obeys the group: R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the identity', () => {
    let c = solvedCube(3);
    for (let i = 0; i < 4; i++) c = turn(c, 3, parseMove('R')!);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 6; i++) c = applyAll(3, ['R', 'U', "R'", "U'"], c);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 105; i++) c = applyAll(3, ['R', 'U'], c);
    expect(isSolvedCube(c)).toBe(true);
    expect(isSolvedCube(turn(solvedCube(3), 3, parseMove('F')!))).toBe(false);
  });

  it('turns clockwise as seen from the face: U sends the front top row to the left', () => {
    const c = turn(solvedCube(3), 3, parseMove('U')!);
    const moved = c.filter((st) => st.color === 'F' && st.normal[0] === -1);
    expect(moved).toHaveLength(3);
  });

  it('scrambles, undoes and simplifies move sequences', () => {
    const sc = scramble(3, 5, 20);
    expect(sc).toHaveLength(20);
    const c = applyAll(3, sc.map(moveName));
    expect(isSolvedCube(applyAll(3, undoSequence(sc).map(moveName), c))).toBe(true);
    expect(simplify([parseMove('R')!, parseMove('R')!, parseMove('R2')!])).toEqual([]);
  });
  it(
    'the two-phase solver finishes full scrambles in at most 24 turns',
    { timeout: 30_000 },
    () => {
      for (let seed = 1; seed <= 8; seed++) {
        const s = newCube(SPECS, 'full', seed);
        const plan = solve(s)!;
        expect(plan.length).toBeLessThanOrEqual(24);
        expect(isSolvedCube(applyAll(3, plan.map(moveName), s.cube))).toBe(true);
      }
      let c = solvedCube(3);
      for (const m of ['F', 'R', "U'"]) c = turn(c, 3, parseMove(m)!);
      expect(solve({ ...newCube(SPECS, 'easy', 1), cube: c })).toHaveLength(3);
    },
  );

  it('reads the cubies of a sticker cube', () => {
    expect(readCubies(solvedCube(3))).toEqual({
      cp: [0, 1, 2, 3, 4, 5, 6, 7],
      co: [0, 0, 0, 0, 0, 0, 0, 0],
      ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });
});

describe('Twisty cube 3×3 play', () => {
  it('turns, undoes and validates saves by replay', () => {
    let s = newCube(SPECS, 'easy', 7);
    expect(s.solved).toBe(false);
    s = play(s, parseMove('U')!);
    expect(s.moves).toEqual(['U']);
    expect(isValidCubeState(s, SPECS)).toBe(true);
    expect(isValidCubeState({ ...s, moves: ['U', 'R'] }, SPECS)).toBe(false);
    s = undo(s);
    expect(s.cube).toEqual(newCube(SPECS, 'easy', 7).cube);
    const g = greedyTurn(s, new Rng(1));
    expect(cubeActions(s)).toContain(moveName(g));
    expect(matching(solvedCube(3))).toBe(6 * 9);
  });

  it('following the solver solves an easy scramble', () => {
    let s = newCube(SPECS, 'easy', 2);
    for (const t of solve(s)!) s = play(s, t);
    expect(s.solved).toBe(true);
  });
});

describeAdapterContract(cube3Env, {
  configs: [undefined, { level: 'easy' }],
  playouts: 3,
  maxSteps: 210,
  illegalActions: (s) => ['X', 'R3', 'Rx'].filter((a) => !cubeActions(s).includes(a)),
});
