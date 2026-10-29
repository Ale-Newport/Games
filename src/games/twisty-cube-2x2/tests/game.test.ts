import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { cubeActions, greedyTurn, matching } from '../../shared/cube/ai';
import { cube2Env } from '../ai-adapter';
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

describe('Twisty cube 2×2 model', () => {
  it('obeys the group: R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the identity', () => {
    let c = solvedCube(2);
    for (let i = 0; i < 4; i++) c = turn(c, 2, parseMove('R')!);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 6; i++) c = applyAll(2, ['R', 'U', "R'", "U'"], c);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 105; i++) c = applyAll(2, ['R', 'U'], c);
    expect(isSolvedCube(c)).toBe(true);
    expect(isSolvedCube(turn(solvedCube(2), 2, parseMove('F')!))).toBe(false);
  });

  it('turns clockwise as seen from the face: U sends the front top row to the left', () => {
    const c = turn(solvedCube(2), 2, parseMove('U')!);
    const moved = c.filter((st) => st.color === 'F' && st.normal[0] === -1);
    expect(moved).toHaveLength(2);
  });

  it('scrambles, undoes and simplifies move sequences', () => {
    const sc = scramble(2, 5, 20);
    expect(sc).toHaveLength(20);
    const c = applyAll(2, sc.map(moveName));
    expect(isSolvedCube(applyAll(2, undoSequence(sc).map(moveName), c))).toBe(true);
    expect(simplify([parseMove('R')!, parseMove('R')!, parseMove('R2')!])).toEqual([]);
  });
  it('solves optimally: a 5-turn scramble in 5, any scramble in at most 11', () => {
    let c = solvedCube(2);
    for (const m of ['R', 'U', "R'", 'D2', 'L']) c = turn(c, 2, parseMove(m)!);
    expect(solve({ ...newCube(SPECS, 'full', 1), cube: c })).toHaveLength(5);
    for (let seed = 1; seed <= 20; seed++) {
      const s = newCube(SPECS, 'full', seed);
      const plan = solve(s)!;
      expect(plan.length).toBeLessThanOrEqual(11);
      expect(isSolvedCube(applyAll(2, plan.map(moveName), s.cube))).toBe(true);
    }
  });
});

describe('Twisty cube 2×2 play', () => {
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
    expect(matching(solvedCube(2))).toBe(6 * 4);
  });

  it('following the solver solves an easy scramble', () => {
    let s = newCube(SPECS, 'easy', 2);
    for (const t of solve(s)!) s = play(s, t);
    expect(s.solved).toBe(true);
  });
});

describeAdapterContract(cube2Env, {
  configs: [undefined, { level: 'easy' }],
  playouts: 3,
  maxSteps: 210,
  illegalActions: (s) => ['X', 'R3', 'Rx'].filter((a) => !cubeActions(s).includes(a)),
});
