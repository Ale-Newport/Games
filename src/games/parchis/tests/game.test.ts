import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import {
  act,
  isValidRace,
  legalActions,
  loopIndex,
  movesFor,
  newRace,
  type RaceState,
} from '../../shared/cross/race';
import { seatsFor } from '../../shared/cross/RaceTable';
import { chooseAction } from '../ai';
import { parchisEnv } from '../ai-adapter';
import { PARCHIS_GAME } from '../engine';

const game = PARCHIS_GAME;
/** Red (seat 0) and yellow (seat 1, colour 2) with chosen pawn steps, red to move with `die`. */
const at = (red: number[], yellow: number[], die: number): RaceState => ({
  ...newRace(game, [0, 2], 1),
  tokens: [red, yellow],
  die,
  phase: 'move',
});
/** Yellow's step that stands on red's step `step`. */
const yellowOn = (step: number) => game.loopAt[2]!.indexOf(loopIndex(game, 0, step));

describe('Parchís rules', () => {
  it('a 5 brings a pawn out, and must when it can', () => {
    expect(game.geo.loop).toHaveLength(68);
    expect(game.safeSet.size).toBe(12);
    const moves = movesFor(game, at([-1, 10, -1, -1], [-1, -1, -1, -1], 5), 5);
    expect(moves.map((m) => m.from)).toEqual([-1]);
    expect(movesFor(game, at([-1, 10, -1, -1], [-1, -1, -1, -1], 4), 4).map((m) => m.from)).toEqual(
      [10],
    );
  });

  it('a six counts seven once every pawn is out', () => {
    expect(movesFor(game, at([10, 20, 30, 40], [-1, -1, -1, -1], 6), 6)[0]!.to).toBe(17);
    expect(movesFor(game, at([10, -1, -1, -1], [-1, -1, -1, -1], 6), 6)[0]!.to).toBe(16);
  });

  it('a barrier cannot be passed or landed on', () => {
    const y = yellowOn(14);
    expect(movesFor(game, at([10, -1, -1, -1], [y, y, -1, -1], 6), 6)).toHaveLength(0);
    expect(movesFor(game, at([10, -1, -1, -1], [y, y, -1, -1], 3), 3)).toHaveLength(1);
  });

  it('a capture earns 20, a pawn at the goal earns 10', () => {
    const target = 15;
    expect(game.safeSet.has(loopIndex(game, 0, target))).toBe(false);
    const s = at([10, 30, 40, 45], [yellowOn(target), -1, -1, -1], 5);
    const after = act(game, s, 'move:0');
    expect(after.tokens[1]![0]).toBe(-1);
    expect(after.phase).toBe('bonus');
    expect(after.bonus).toBe(20);
    const bonus = act(game, after, 'bonus:1');
    expect(bonus.tokens[0]![1]).toBe(50);
    const home = act(game, at([game.last - 2, 30, -1, -1], [-1, -1, -1, -1], 2), 'move:0');
    expect(home.phase).toBe('bonus');
    expect(home.bonus).toBe(10);
  });
});

describe('Parchís play', () => {
  it('validates saves by replay and the agents finish a four-player game', () => {
    let s = newRace(game, seatsFor(4), 6);
    for (let i = 0; i < 20000 && s.phase !== 'over'; i++)
      s = act(game, s, chooseAction(s, s.turn === 0));
    expect(s.phase).toBe('over');
    expect(isValidRace(game, s, () => true)).toBe(true);
  });
});

describeAdapterContract(parchisEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 2,
  maxSteps: 20000,
  illegalActions: (s) =>
    ['move:9', 'jump', 'bonus:7'].filter((a) => !legalActions(game, s).includes(a)),
});
