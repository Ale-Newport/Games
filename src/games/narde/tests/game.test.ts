import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { nardeEnv } from '../ai-adapter';
import {
  across,
  illegalPrime,
  legalPlays,
  legalSequences,
  physical,
  pips,
  startPosition,
  winValue,
  type Position,
} from '../engine';
import { evaluate } from '../evaluate';
import { act, isValidNarde, legalActions, newNarde, playKey, playsOf } from '../match';

const empty = (): Position => ({
  board: [new Array<number>(25).fill(0), new Array<number>(25).fill(0)],
  off: [0, 0],
});

describe('Narde moves', () => {
  it('starts both sides on their heads, in opposite corners of the board', () => {
    const p = startPosition();
    expect(p.board[0][24]).toBe(15);
    expect(pips(p, 0)).toBe(360);
    expect(physical(0, 24)).toBe(24);
    expect(physical(1, 24)).toBe(12);
    expect(across(across(7))).toBe(7);
  });

  it('lets one checker leave the head per turn, two with 6-6, 4-4 or 3-3 on the first turn', () => {
    const p = startPosition();
    const first66 = legalPlays(p, 0, [6, 6], true);
    expect(first66).toHaveLength(1);
    expect(first66[0]!.result.board[0][18]).toBe(2);
    expect(legalPlays(p, 0, [5, 3], true).every((pl) => pl.result.board[0][24] === 14)).toBe(true);
    // Later in the game, 6-6 takes only one checker off the head.
    const later = legalPlays(p, 0, [6, 6], false);
    expect(later.every((pl) => pl.result.board[0][24] === 14)).toBe(true);
  });

  it('a single opposing checker blocks its point', () => {
    const p = empty();
    p.board[0][10] = 1;
    p.board[0][1] = 14;
    p.board[1][across(7)] = 1;
    p.board[1][24] = 14;
    const plays = legalSequences(p, 0, [3, 1], false);
    expect(plays.some((pl) => pl.steps.some((st) => st.to === 7))).toBe(false);
    expect(plays.length).toBeGreaterThan(0);
  });

  it('forbids six closed points in a row with no opposing checker past them', () => {
    const p = empty();
    for (const q of [11, 10, 9, 8, 7]) p.board[0][q] = 1;
    p.board[0][14] = 10;
    p.board[1][24] = 15;
    // 14→10→6 would close 11–6 with every opposing checker still behind: never offered.
    const plays = legalSequences(p, 0, [4, 4], false);
    expect(plays.length).toBeGreaterThan(0);
    expect(plays.every((pl) => !illegalPrime(pl.result, 0))).toBe(true);
    expect(plays.some((pl) => [11, 10, 9, 8, 7, 6].every((q) => pl.result.board[0][q]))).toBe(
      false,
    );
    const six = empty();
    for (const q of [11, 10, 9, 8, 7, 6]) six.board[0][q] = 1;
    six.board[1][24] = 15;
    expect(illegalPrime(six, 0)).toBe(true);
    // An opposing checker on its point 10 is already past the run (its points 18–23).
    six.board[1][24] = 14;
    six.board[1][10] = 1;
    expect(illegalPrime(six, 0)).toBe(false);
  });

  it('scores oin and mars', () => {
    const p = empty();
    p.off[0] = 15;
    p.board[1][3] = 15;
    expect(winValue(p, 0)).toBe(2);
    p.off[1] = 1;
    expect(winValue(p, 0)).toBe(1);
  });
});

describe('Narde match', () => {
  it('opens with a single die each, rolls, plays and validates saves by replay', () => {
    let s = newNarde(3, 5);
    expect(s.phase).toBe('roll');
    expect(s.opening[0]).not.toBe(s.opening[1]);
    expect(s.turn).toBe(s.opening[0] > s.opening[1] ? 0 : 1);
    s = act(s, 'roll');
    expect(s.phase).toBe('move');
    s = act(s, legalActions(s)[0]!);
    expect(s.phase).toBe('roll');
    expect(isValidNarde(s)).toBe(true);
    expect(isValidNarde({ ...s, score: [2, 0] })).toBe(false);
    expect(act(s, 'play:24/1')).toBe(s);
  });

  it('the evaluation prefers leaving the head, and computer players finish a match', () => {
    const p = startPosition();
    const plays = legalPlays(p, 0, [5, 3], true);
    expect(plays.length).toBeGreaterThan(0);
    expect(evaluate(plays[0]!.result, 0)).toBeGreaterThan(evaluate(p, 0) - 50);
    let s = newNarde(3, 8);
    for (let i = 0; i < 5000 && s.phase !== 'match-over'; i++)
      s = act(s, chooseAction(s, 'greedy'));
    expect(s.phase).toBe('match-over');
    expect(isValidNarde(s)).toBe(true);
    expect(playsOf(s)).toEqual([]);
    expect(playKey({ steps: [{ from: 24, to: 18, die: 6 }], result: p })).toBe('play:24/18');
  });
});

describeAdapterContract(nardeEnv, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 3000,
  illegalActions: (s) => ['jump', 'play:24/0', 'next'].filter((a) => !legalActions(s).includes(a)),
});
