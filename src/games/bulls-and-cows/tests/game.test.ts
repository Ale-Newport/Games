import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { MOVES, bullsActions, parseCode } from '../ai';
import { bullsEnv } from '../ai-adapter';
import { VARIANTS, isValidBullsState, makeGuess, newBulls, spaceFor } from '../engine';

describe('Bulls and Cows rules', () => {
  it('draws numbers of distinct digits and scores bulls and cows', () => {
    expect(spaceFor(VARIANTS.four!).count).toBe(5040);
    expect(spaceFor(VARIANTS.five!).count).toBe(30240);
    const s = newBulls('four', 'solo', 3);
    expect(new Set(s.secrets[0]).size).toBe(4);
    const [a, b, c, d] = s.secrets[0]! as [number, number, number, number];
    const g = makeGuess(s, [
      a,
      c,
      b,
      (d + 1) % 10 === a || (d + 1) % 10 === b || (d + 1) % 10 === c ? (d + 2) % 10 : (d + 1) % 10,
    ]);
    expect(g.guesses[0]![0]).toMatchObject({ exact: 1, near: 2 });
    expect(makeGuess(s, [1, 1, 2, 3])).toBe(s);
  });

  it('solo ends on a crack or after 15 guesses', () => {
    let s = newBulls('three', 'solo', 8);
    const wrong = s.secrets[0]!.map((x) => x).reverse();
    const other = wrong.join() === s.secrets[0]!.join() ? [9, 8, 7] : wrong;
    for (let i = 0; i < 15; i++) s = makeGuess(s, other);
    expect(s.status).toBe('done');
    expect(s.winner).toBeNull();
    const won = makeGuess(newBulls('three', 'solo', 8), newBulls('three', 'solo', 8).secrets[0]!);
    expect(won.winner).toBe(0);
  });

  it('gives the second player one last guess to draw in the duel', () => {
    let s = newBulls('four', 'duel', 5, [1, 2, 3, 4]);
    expect(s.secrets[1]).toEqual([1, 2, 3, 4]);
    s = makeGuess(s, s.secrets[0]!);
    expect(s.status).toBe('playing');
    expect(s.turn).toBe(1);
    const draw = makeGuess(s, [1, 2, 3, 4]);
    expect(draw).toMatchObject({ status: 'done', winner: null });
    const win = makeGuess(s, [5, 6, 7, 8]);
    expect(win).toMatchObject({ status: 'done', winner: 0 });
    let t = newBulls('four', 'duel', 5, [1, 2, 3, 4]);
    t = makeGuess(t, [9, 8, 7, 6].join() === t.secrets[0]!.join() ? [9, 8, 7, 5] : [9, 8, 7, 6]);
    t = makeGuess(t, [1, 2, 3, 4]);
    expect(t).toMatchObject({ status: 'done', winner: 1 });
  });

  it('validates saves by regenerating the numbers and replaying every score', () => {
    let s = newBulls('four', 'duel', 11, [5, 0, 1, 2]);
    s = makeGuess(makeGuess(s, [0, 1, 2, 3]), [6, 7, 8, 9]);
    expect(isValidBullsState(s)).toBe(true);
    expect(isValidBullsState({ ...s, secrets: [s.secrets[1], s.secrets[0]] })).toBe(false);
    expect(isValidBullsState({ ...s, turn: 1 })).toBe(false);
    const g = s.guesses[1]![0]!;
    expect(isValidBullsState({ ...s, guesses: [s.guesses[0], [{ ...g, near: g.near + 1 }]] })).toBe(
      false,
    );
    expect(isValidBullsState({ ...s, notes: [3, ...s.notes.slice(1)] })).toBe(false);
    expect(isValidBullsState({ ...newBulls('five', 'solo', 2), playerSet: true })).toBe(false);
  });
});

describe('Bulls and Cows agents', () => {
  it('the hard breaker cracks 4-digit numbers in at most 7 guesses', { timeout: 30_000 }, () => {
    for (let seed = 1; seed <= 25; seed++) {
      let s = newBulls('four', 'solo', seed);
      while (s.status === 'playing') s = makeGuess(s, parseCode(MOVES.hard(s)));
      expect(s.winner).toBe(0);
      expect(s.guesses[0]!.length).toBeLessThanOrEqual(7);
    }
  });

  it('every level only guesses legal numbers and the easy one forgets old scores', () => {
    const rng = new Rng(4);
    for (const lvl of ['easy', 'medium'] as const) {
      let s = newBulls('three', 'solo', 21);
      while (s.status === 'playing') {
        const a = MOVES[lvl](s, rng);
        expect(bullsActions(s)).toContain(a);
        s = makeGuess(s, parseCode(a));
      }
    }
  });

  it('hides the number a seat must crack from that seat', () => {
    const s = bullsEnv.createInitialState(undefined, 6);
    const o0 = bullsEnv.getObservation(s, 0);
    expect(o0.secrets[0]).toEqual([-1, -1, -1, -1]);
    expect(o0.secrets[1]).toEqual(s.secrets[1]);
    expect(bullsEnv.getObservation(s, 1).secrets[1]).toEqual([-1, -1, -1, -1]);
    expect(bullsEnv.getLegalActions(s, 1)).toEqual([]);
  });
});

describeAdapterContract(bullsEnv, {
  configs: [undefined, { variant: 'three' }],
  playouts: 6,
  maxSteps: 40,
  illegalActions: (s) =>
    ['1123', '12', 'abcd', '12345'].filter((a) => !bullsActions(s).includes(a)),
});
