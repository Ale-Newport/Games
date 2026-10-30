import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { seedRng } from '../../../core/game-engine/random';
import {
  act,
  isValidRace,
  legalActions,
  loopIndex,
  movesFor,
  newRace,
  partnerOf,
  type RaceState,
} from '../../shared/cross/race';
import { seatsFor } from '../../shared/cross/RaceTable';
import { chooseAction } from '../ai';
import { pachisiEnv } from '../ai-adapter';
import { COWRIE_VALUES, PACHISI_GAME, throwCowries } from '../engine';

const game = PACHISI_GAME;
const at = (seats: number[], tokens: number[][], die: number): RaceState => ({
  ...newRace(game, seats, 1),
  tokens,
  die,
  phase: 'move',
});

describe('Pachisi board and throws', () => {
  it('runs down the arm, round the 68-square loop through the tip twice, and back up: 83 steps', () => {
    expect(game.geo.loop).toHaveLength(68);
    expect(game.last).toBe(83);
    // Steps 0–6 are the middle column (off the loop); step 7 is the arm's tip; so is step 75.
    expect(loopIndex(game, 0, 3)).toBe(-1);
    expect(loopIndex(game, 0, 7)).toBe(66);
    expect(loopIndex(game, 0, 75)).toBe(66);
    expect(loopIndex(game, 0, 80)).toBe(-1);
    // Twelve castles: the tips and the fourth square from each outer end.
    expect(game.safeSet.size).toBe(12);
    expect(game.safeSet.has(66)).toBe(true);
  });

  it('throws six cowries: mouths up 0→25, 1→10, else the count', () => {
    expect(COWRIE_VALUES).toEqual([25, 10, 2, 3, 4, 5, 6]);
    let rng = seedRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const [v, next, faces] = throwCowries(rng);
      rng = next;
      expect(faces).toHaveLength(6);
      expect(v).toBe(COWRIE_VALUES[faces.filter(Boolean).length]);
      seen.add(v);
    }
    expect([...seen].every((v) => COWRIE_VALUES.includes(v))).toBe(true);
    expect(seen.has(10)).toBe(true);
  });
});

describe('Pachisi rules', () => {
  it('enters only on a grace throw, and partners never capture each other', () => {
    expect(
      movesFor(
        game,
        at(
          [0, 2],
          [
            [-1, -1, -1, -1],
            [-1, -1, -1, -1],
          ],
          4,
        ),
        4,
      ),
    ).toHaveLength(0);
    expect(
      movesFor(
        game,
        at(
          [0, 2],
          [
            [-1, -1, -1, -1],
            [-1, -1, -1, -1],
          ],
          10,
        ),
        10,
      ),
    ).toHaveLength(1);
    const four = at(
      [0, 1, 2, 3],
      [
        [20, -1, -1, -1],
        [-1, -1, -1, -1],
        [-1, -1, -1, -1],
        [-1, -1, -1, -1],
      ],
      3,
    );
    expect(partnerOf(game, four, 0)).toBe(2);
    // Put red's partner (yellow, seat 2) on the square red would reach: no capture.
    const target = loopIndex(game, 0, 23);
    const yellowStep = game.loopAt[2]!.indexOf(target);
    const shared = {
      ...four,
      tokens: [
        [20, -1, -1, -1],
        [-1, -1, -1, -1],
        [yellowStep, -1, -1, -1],
        [-1, -1, -1, -1],
      ],
    };
    expect(movesFor(game, shared, 3)[0]!.captured).toEqual([]);
  });

  it('a capture off the castles sends the piece back and throws again', () => {
    const target = loopIndex(game, 0, 23);
    expect(game.safeSet.has(target)).toBe(false);
    const yellowStep = game.loopAt[2]!.indexOf(target);
    const s = at(
      [0, 2],
      [
        [20, -1, -1, -1],
        [yellowStep, -1, -1, -1],
      ],
      3,
    );
    const after = act(game, s, 'move:0');
    expect(after.tokens[1]![0]).toBe(-1);
    expect(after.turn).toBe(0);
  });
});

describe('Pachisi play', () => {
  it('validates saves by replay and four computer players finish as partners', () => {
    let s = newRace(game, seatsFor(4), 5);
    for (let i = 0; i < 20000 && s.phase !== 'over'; i++)
      s = act(game, s, chooseAction(s, s.turn % 2 === 0));
    expect(s.phase).toBe('over');
    const partner = partnerOf(game, s, s.winner!)!;
    expect(s.tokens[s.winner!]!.every((x) => x === game.last)).toBe(true);
    expect(s.tokens[partner]!.every((x) => x === game.last)).toBe(true);
    expect(isValidRace(game, s, () => true)).toBe(true);
  });
});

describeAdapterContract(pachisiEnv, {
  configs: [undefined, { players: 4 }],
  playouts: 2,
  maxSteps: 20000,
  illegalActions: (s) =>
    ['move:9', 'jump', 'bonus:0'].filter((a) => !legalActions(game, s).includes(a)),
});
