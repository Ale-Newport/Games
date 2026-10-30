import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { crossGeometry, route } from '../../shared/cross/geometry';
import { heuristicMove, simpleMove } from '../../shared/cross/heuristic';
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
import { ludoEnv } from '../ai-adapter';
import { LUDO_GAME } from '../engine';

const game = LUDO_GAME;
/** A two-player state (red and yellow) with chosen token steps, red to move with `die`. */
const at = (red: number[], yellow: number[], die: number): RaceState => ({
  ...newRace(game, [0, 2], 1),
  tokens: [red, yellow],
  die,
  phase: 'move',
});

describe('Cross board', () => {
  it('lays out the 52-square loop, the starts and the home columns', () => {
    const g = crossGeometry(6);
    expect(g.N).toBe(15);
    expect(g.loop).toHaveLength(52);
    expect(new Set(g.loop.map((c) => c.join())).size).toBe(52);
    expect(g.loop[0]).toEqual([6, 1]);
    expect(route(g, 0)[50]).toEqual([7, 0]);
    expect(g.homeColumn[0]).toEqual([
      [7, 1],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
    ]);
    expect(game.last).toBe(56);
    expect(crossGeometry(8).loop).toHaveLength(68);
  });
});

describe('Ludo rules', () => {
  it('a six brings a token out; other throws cannot', () => {
    expect(movesFor(game, at([-1, -1, -1, -1], [-1, -1, -1, -1], 6), 6)).toHaveLength(1);
    expect(movesFor(game, at([-1, -1, -1, -1], [-1, -1, -1, -1], 5), 5)).toHaveLength(0);
  });

  it('captures a lone rival off the safe squares, not on them and not a pair', () => {
    // Yellow's step 6 stands on loop index 26 + 6 = 32, which is red's step 32.
    const s = at([30, -1, -1, -1], [6, -1, -1, -1], 2);
    expect(loopIndex(game, 0, 32)).toBe(loopIndex(game, 2, 6));
    const [m] = movesFor(game, s, 2);
    expect(m!.captured).toEqual([[1, 0]]);
    const after = act(game, s, 'move:0');
    expect(after.tokens[1]![0]).toBe(-1);
    // Capturing earns another roll.
    expect(after.turn).toBe(0);
    // Yellow's star square (its step 8) is safe: both stay.
    expect(movesFor(game, at([32, -1, -1, -1], [8, -1, -1, -1], 2), 2)[0]!.captured).toEqual([]);
    expect(movesFor(game, at([30, -1, -1, -1], [6, 6, -1, -1], 2), 2)).toHaveLength(0);
  });

  it('needs the exact throw for home, and three sixes lose the turn', () => {
    expect(movesFor(game, at([53, -1, -1, -1], [-1, -1, -1, -1], 4), 4)).toHaveLength(0);
    expect(movesFor(game, at([53, -1, -1, -1], [-1, -1, -1, -1], 3), 3)[0]!.to).toBe(56);
    let s: RaceState = { ...newRace(game, [0, 2], 1), sixes: 2 };
    // Find a seed whose first throw is a six to check the penalty.
    for (let seed = 1; seed < 200; seed++) {
      const t = act(game, { ...newRace(game, [0, 2], seed), sixes: 2 }, 'roll');
      if (t.die === 6) {
        s = t;
        break;
      }
    }
    expect(s.die).toBe(6);
    expect(s.turn).toBe(1);
    expect(s.phase).toBe('roll');
  });
});

describe('Ludo play', () => {
  it('validates saves by replay and the agents finish games', () => {
    let s = newRace(game, seatsFor(4), 3);
    for (let i = 0; i < 6000 && s.phase !== 'over'; i++)
      s = act(game, s, chooseAction(s, s.turn === 0));
    expect(s.phase).toBe('over');
    expect(isValidRace(game, s, () => true)).toBe(true);
    expect(isValidRace(game, { ...s, captures: [9, 9, 9, 9] }, () => true)).toBe(false);
    const moves = movesFor(game, at([-1, 10, -1, -1], [11, -1, -1, -1], 6), 6);
    expect(simpleMove(moves)!.from).toBe(-1);
    // The heuristic takes the capture.
    expect(
      heuristicMove(
        game,
        at([-1, 10, -1, -1], [37, -1, -1, -1], 1),
        movesFor(game, at([-1, 10, -1, -1], [37, -1, -1, -1], 1), 1),
      )!.token,
    ).toBe(1);
    expect(legalActions(game, newRace(game, [0, 2], 1))).toEqual(['roll']);
  });
});

describeAdapterContract(ludoEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 2,
  maxSteps: 8000,
  illegalActions: (s) =>
    ['move:9', 'jump', 'bonus:0'].filter((a) => !legalActions(game, s).includes(a)),
});
