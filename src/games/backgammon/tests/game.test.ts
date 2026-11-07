import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { backgammonEnv } from '../ai-adapter';
import {
  BAR,
  OFF,
  legalPlays,
  legalSequences,
  pips,
  startPosition,
  winValue,
  type Position,
} from '../engine';
import { contact, evaluate, shouldDouble, shouldTake } from '../evaluate';
import {
  act,
  canDouble,
  isValidMatch,
  legalActions,
  newMatch,
  playKey,
  playsOf,
  type MatchState,
} from '../match';

const empty = (): Position => ({
  board: [new Array<number>(25).fill(0), new Array<number>(25).fill(0)],
  bar: [0, 0],
  off: [0, 0],
});

describe('Backgammon moves', () => {
  it('starts with 167 pips a side and counts the opening plays', () => {
    const p = startPosition();
    expect(pips(p, 0)).toBe(167);
    expect(pips(p, 1)).toBe(167);
    expect(legalPlays(p, 0, [3, 1]).length).toBe(16);
    expect(legalPlays(p, 0, [3, 1]).some((pl) => pl.result.board[0][5] === 2)).toBe(true);
  });

  it('enters from the bar first, cannot land on two checkers, and hits a single one', () => {
    const p = empty();
    p.bar[0] = 1;
    p.board[0][6] = 14;
    // Side 1 holds side 0's entry point 20 (its own 5) and has a blot on side 0's 22 (its 3).
    p.board[1][5] = 2;
    p.board[1][3] = 1;
    p.board[1][24] = 12;
    const plays = legalPlays(p, 0, [5, 3]);
    expect(plays.every((pl) => pl.steps[0]!.from === BAR)).toBe(true);
    expect(plays.some((pl) => pl.steps.some((st) => st.to === 20))).toBe(false);
    const hit = plays.find((pl) => pl.steps[0]!.to === 22)!;
    expect(hit.steps[0]!.hit).toBe(true);
    expect(hit.result.bar[1]).toBe(1);
  });

  it('must use both dice when it can, and the larger one when only one fits', () => {
    const p = empty();
    p.board[0][24] = 1;
    p.board[0][1] = 14;
    // Either die alone fits (to 18 or 20), but both would need side 0's 14, which side 1 holds.
    p.board[1][11] = 2;
    p.board[1][24] = 13;
    const plays = legalSequences(p, 0, [6, 4]);
    expect(plays).toHaveLength(1);
    expect(plays[0]!.steps).toEqual([{ from: 24, to: 18, die: 6, hit: false }]);
    const q = empty();
    q.board[0][3] = 1;
    q.board[0][1] = 14;
    q.board[1][20] = 2; // side 0's 5… far away; both dice playable as one checker
    q.board[1][24] = 13;
    expect(legalSequences(q, 0, [5, 2]).every((pl) => pl.steps.length === 2)).toBe(true);
  });

  it('bears off with the exact die or a higher one from the farthest point only', () => {
    const p = empty();
    p.board[0][4] = 1;
    p.board[0][2] = 1;
    p.off[0] = 13;
    p.board[1][24] = 15;
    const sixes = legalPlays(p, 0, [6, 6]);
    expect(sixes).toHaveLength(1);
    expect(sixes[0]!.result.off[0]).toBe(15);
    const p2 = empty();
    p2.board[0][6] = 1;
    p2.board[0][2] = 2;
    p2.off[0] = 12;
    p2.board[1][24] = 15;
    // A 3 cannot bear off from the 2 while a checker stands on the 6.
    const plays = legalSequences(p2, 0, [3, 1]);
    expect(
      plays.some((pl) => pl.steps.some((st) => st.from === 2 && st.to === OFF && st.die === 3)),
    ).toBe(false);
  });

  it('scores single games, gammons and backgammons', () => {
    const p = empty();
    p.off[0] = 15;
    p.board[1][10] = 15;
    expect(winValue(p, 0)).toBe(2);
    p.board[1][10] = 14;
    p.board[1][20] = 1;
    expect(winValue(p, 0)).toBe(3);
    p.off[1] = 1;
    expect(winValue(p, 0)).toBe(1);
  });
});

describe('Backgammon judgement', () => {
  it('knows contact from a race and prefers safer, stronger positions', () => {
    expect(contact(startPosition())).toBe(true);
    const race = empty();
    race.board[0][5] = 15;
    race.board[1][5] = 15;
    expect(contact(race)).toBe(false);
    const plays = legalPlays(startPosition(), 0, [3, 1]);
    const best = plays.reduce((a, b) => (evaluate(b.result, 0) > evaluate(a.result, 0) ? b : a));
    // The classic answer to an opening 3-1: make the 5-point.
    expect(best.result.board[0][5]).toBe(2);
  });

  it('doubles a clear racing lead and drops it, takes an even position', () => {
    const p = empty();
    p.board[0][4] = 15;
    p.board[1][5] = 15;
    // 60 pips against 75 with the leader on roll: about 80%.
    expect(shouldDouble(p, 0)).toBe(true);
    expect(shouldTake(p, 1)).toBe(false);
    expect(shouldTake(startPosition(), 1)).toBe(true);
  });
});

describe('Backgammon match', () => {
  it('opens with the higher die, rolls, plays, doubles and validates saves by replay', () => {
    let s: MatchState = newMatch(3, 7);
    expect(s.phase).toBe('move');
    expect(s.dice![0]).not.toBe(s.dice![1]);
    s = act(s, legalActions(s)[0]!);
    expect(s.phase).toBe('roll');
    expect(canDouble(s)).toBe(true);
    s = act(s, 'double');
    expect(s.phase).toBe('doubled');
    s = act(s, 'take');
    expect(s.cube).toBe(2);
    expect(canDouble(s)).toBe(false);
    s = act(s, 'roll');
    expect(isValidMatch(s)).toBe(true);
    expect(isValidMatch({ ...s, score: [1, 0] })).toBe(false);
    expect(isValidMatch({ ...s, history: [...s.history, 'roll'] })).toBe(false);
    expect(act(s, 'roll')).toBe(s);
  });

  it('a dropped double ends the game for the cube value and starts the Crawford logic', () => {
    let s = newMatch(3, 9);
    s = act(s, playKey(playsOf(s)[0]!));
    s = act(s, 'double');
    s = act(s, 'drop');
    expect(s.phase).toBe('game-over');
    expect(s.score[s.lastWin!.side]).toBe(1);
    s = act(s, 'next');
    expect(s.phase).toBe('move');
    expect(s.cube).toBe(1);
  });

  it('two computer players finish a 3-point match', () => {
    let s = newMatch(3, 21);
    for (let i = 0; i < 4000 && s.phase !== 'match-over'; i++)
      s = act(s, chooseAction(s, 'greedy'));
    expect(s.phase).toBe('match-over');
    expect(Math.max(...s.score)).toBe(3);
    expect(isValidMatch(s)).toBe(true);
  });
});

describeAdapterContract(backgammonEnv, {
  configs: [undefined],
  playouts: 2,
  maxSteps: 3000,
  illegalActions: (s) => ['jump', 'play:1/0', 'take'].filter((a) => !legalActions(s).includes(a)),
});
