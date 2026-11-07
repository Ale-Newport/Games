import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { cubeActions, greedyTurn, matching } from '../../shared/cube/ai';
import { cube4Env } from '../ai-adapter';
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

describe('Twisty cube 4×4 model', () => {
  it('obeys the group: R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the identity', () => {
    let c = solvedCube(4);
    for (let i = 0; i < 4; i++) c = turn(c, 4, parseMove('R')!);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 6; i++) c = applyAll(4, ['R', 'U', "R'", "U'"], c);
    expect(isSolvedCube(c)).toBe(true);
    for (let i = 0; i < 105; i++) c = applyAll(4, ['R', 'U'], c);
    expect(isSolvedCube(c)).toBe(true);
    expect(isSolvedCube(turn(solvedCube(4), 4, parseMove('F')!))).toBe(false);
  });

  it('turns clockwise as seen from the face: U sends the front top row to the left', () => {
    const c = turn(solvedCube(4), 4, parseMove('U')!);
    const moved = c.filter((st) => st.color === 'F' && st.normal[0] === -1);
    expect(moved).toHaveLength(4);
  });

  it('scrambles, undoes and simplifies move sequences', () => {
    const sc = scramble(4, 5, 20);
    expect(sc).toHaveLength(20);
    const c = applyAll(4, sc.map(moveName));
    expect(isSolvedCube(applyAll(4, undoSequence(sc).map(moveName), c))).toBe(true);
    expect(simplify([parseMove('R')!, parseMove('R')!, parseMove('R2')!])).toEqual([]);
  });
  it('wide turns move two layers and hints undo the scramble', () => {
    const wide = turn(solvedCube(4), 4, parseMove('Rw')!);
    const outer = turn(solvedCube(4), 4, parseMove('R')!);
    expect(JSON.stringify(wide)).not.toBe(JSON.stringify(outer));
    let s = newCube(SPECS, 'full', 3);
    expect(s.scrambleMoves.some((m) => m.includes('w'))).toBe(true);
    s = play(s, parseMove('F')!);
    const plan = solve(s)!;
    expect(isSolvedCube(applyAll(4, plan.map(moveName), s.cube))).toBe(true);
    expect(plan[0]).toEqual(parseMove("F'"));
  });
});

describe('Twisty cube 4×4 play', () => {
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
    expect(matching(solvedCube(4))).toBe(6 * 16);
  });

  it('following the solver solves an easy scramble', () => {
    let s = newCube(SPECS, 'easy', 2);
    for (const t of solve(s)!) s = play(s, t);
    expect(s.solved).toBe(true);
  });
});

describeAdapterContract(cube4Env, {
  configs: [undefined, { level: 'easy' }],
  playouts: 3,
  maxSteps: 210,
  illegalActions: (s) => ['X', 'R3', 'Rx'].filter((a) => !cubeActions(s).includes(a)),
});
