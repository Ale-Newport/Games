import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { shutEnv } from '../ai-adapter';
import {
  ALL_OPEN,
  bestShut,
  boxScore,
  oneDieAllowed,
  openTiles,
  shutOptions,
  simpleShut,
  solve,
} from '../engine';
import { act, isValidShut, legalActions, newShut, type ShutGame } from '../match';

const mask = (...tiles: number[]) => tiles.reduce((m, t) => m | (1 << (t - 1)), 0);

describe('Shut the Box rules', () => {
  it('lists the ways to shut tiles adding up to a throw', () => {
    expect(
      shutOptions(ALL_OPEN, 9)
        .map((m) => openTiles(m).join('+'))
        .sort(),
    ).toEqual(['1+2+6', '1+3+5', '1+8', '2+3+4', '2+7', '3+6', '4+5', '9'].sort());
    expect(shutOptions(mask(5, 9), 4)).toEqual([]);
    expect(boxScore(ALL_OPEN)).toBe(45);
    expect(oneDieAllowed(mask(1, 5))).toBe(true);
    expect(oneDieAllowed(mask(1, 6))).toBe(false);
  });

  it('a stuck throw ends the turn with the open tiles as the score', () => {
    let g: ShutGame = { ...newShut(1, 1), box: mask(9) };
    for (let seed = 1; seed < 200; seed++) {
      g = act({ ...newShut(1, seed), box: mask(9) }, 'roll:2');
      if (g.phase === 'over') break;
    }
    expect(g.phase).toBe('over');
    expect(g.scores[0]).toBe(9);
  });
});

describe('Shut the Box solved', () => {
  it('expects about 11 left open from the start under best play', () => {
    const { expect: e } = solve();
    expect(e[ALL_OPEN]).toBeGreaterThan(10);
    expect(e[ALL_OPEN]).toBeLessThan(12);
    expect(e[0]).toBe(0);
  });

  it('best play beats the simple rule on average', () => {
    let best = 0;
    let simple = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const strong of [true, false]) {
        let g = newShut(1, seed);
        while (g.phase !== 'over') g = act(g, chooseAction(g, strong));
        if (strong) best += g.scores[0]!;
        else simple += g.scores[0]!;
        expect(isValidShut(g)).toBe(true);
      }
    }
    expect(best).toBeLessThan(simple);
  });

  it('chooses tiles that add up to the throw', () => {
    const m = bestShut(ALL_OPEN, 7)!;
    expect(openTiles(m).reduce((a, b) => a + b, 0)).toBe(7);
    expect(openTiles(simpleShut(ALL_OPEN, 7)!)).toEqual([7]);
    expect(legalActions(newShut(2, 1))).toEqual(['roll:2']);
  });
});

describeAdapterContract(shutEnv, {
  configs: [undefined, { players: 3 }],
  playouts: 3,
  maxSteps: 200,
  illegalActions: (g) => ['roll:3', 'shut:0', 'jump'].filter((a) => !legalActions(g).includes(a)),
});
