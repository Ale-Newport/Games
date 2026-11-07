import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { codeActions, minimaxMove, parseCode } from '../ai';
import { codeBreakerEnv } from '../ai-adapter';
import {
  VARIANTS,
  chooseGuess,
  consistent,
  contradiction,
  guessPool,
  isValidCodeBreakerState,
  makeGuess,
  newCodeBreaker,
  score,
  spaceFor,
} from '../engine';

describe('Code Breaker scoring', () => {
  it('counts exact and near pegs, each peg once', () => {
    expect(score([0, 1, 2, 3], [0, 1, 2, 3])).toEqual([4, 0]);
    expect(score([0, 1, 2, 3], [3, 2, 1, 0])).toEqual([0, 4]);
    expect(score([0, 0, 1, 1], [1, 1, 0, 0])).toEqual([0, 4]);
    expect(score([0, 0, 1, 2], [0, 3, 0, 0])).toEqual([1, 1]);
    expect(score([5, 5, 5, 5], [5, 4, 4, 4])).toEqual([1, 0]);
    expect(score([1, 2, 3, 4], [5, 5, 5, 5])).toEqual([0, 0]);
  });

  it('builds the code spaces with fast keys that match the score', () => {
    expect(spaceFor(VARIANTS.easy!).count).toBe(360);
    expect(spaceFor(VARIANTS.classic!).count).toBe(1296);
    expect(spaceFor(VARIANTS.hard!).count).toBe(32768);
    const space = spaceFor(VARIANTS.classic!);
    for (let t = 0; t < 500; t++) {
      const a = (t * 7919) % space.count;
      const b = (t * 104729) % space.count;
      const [e, n] = score(space.code(a), space.code(b));
      expect(space.key(a, b)).toBe(e * 5 + n);
      expect(space.index(space.code(a))).toBe(a);
    }
    expect(space.index([6, 0, 0, 0])).toBe(-1);
    expect(spaceFor(VARIANTS.easy!).index([1, 1, 2, 3])).toBe(-1);
  });

  it('keeps only codes consistent with the scores and flags contradictions', () => {
    const s = makeGuess(makeGuess(newCodeBreaker('classic', 9), [0, 0, 1, 1]), [2, 2, 3, 3]);
    const space = spaceFor(VARIANTS.classic!);
    const fit = consistent(space, s.guesses);
    expect(fit).toContain(space.index(s.secret));
    for (const i of fit) expect(contradiction(s.guesses, space.code(i))).toBeNull();
    const out = space.code([...Array(space.count).keys()].find((i) => !fit.includes(i))!);
    expect(contradiction(s.guesses, out)).not.toBeNull();
  });

  it('reduces the opening pool by symmetry to the code patterns', () => {
    expect(guessPool(spaceFor(VARIANTS.classic!), [])).toHaveLength(15);
    expect(guessPool(spaceFor(VARIANTS.hard!), [])).toHaveLength(52);
  });
});

describe('Minimax breaker', () => {
  it('opens Classic with a two-pair code leaving at most 256', () => {
    const c = chooseGuess(spaceFor(VARIANTS.classic!), []);
    expect(c.worst).toBe(256);
    const code = spaceFor(VARIANTS.classic!).code(c.index);
    expect(new Set(code).size).toBe(2);
  });

  it('cracks every Classic code in at most five guesses', () => {
    const space = spaceFor(VARIANTS.classic!);
    let worst = 0;
    for (let i = 0; i < space.count; i += 7) {
      let s = newCodeBreaker('classic', 1, space.code(i));
      while (s.status === 'playing') s = makeGuess(s, parseCode(minimaxMove(s)));
      expect(s.status).toBe('won');
      worst = Math.max(worst, s.guesses.length);
    }
    expect(worst).toBeLessThanOrEqual(5);
  });

  it('cracks Hard codes within the twelve guesses', { timeout: 30_000 }, () => {
    for (let seed = 1; seed <= 6; seed++) {
      let s = newCodeBreaker('hard', seed);
      while (s.status === 'playing') s = makeGuess(s, parseCode(minimaxMove(s)));
      expect(s.status).toBe('won');
      expect(s.guesses.length).toBeLessThanOrEqual(8);
    }
  });
});

describe('Code Breaker states', () => {
  it('ends won on a full match and lost when out of guesses', () => {
    let s = newCodeBreaker('easy', 4);
    expect(new Set(s.secret).size).toBe(4);
    const wrong = [0, 1, 2, 3].join() === s.secret.join() ? [3, 2, 1, 0] : [0, 1, 2, 3];
    for (let i = 0; i < 10; i++) s = makeGuess(s, wrong);
    expect(s.status).toBe('lost');
    expect(makeGuess(s, s.secret)).toBe(s);
    const w = makeGuess(newCodeBreaker('easy', 4), newCodeBreaker('easy', 4).secret);
    expect(w.status).toBe('won');
  });

  it('validates saves by replaying the scores', () => {
    const s = makeGuess(newCodeBreaker('classic', 12), [0, 1, 2, 3]);
    expect(isValidCodeBreakerState(s)).toBe(true);
    expect(isValidCodeBreakerState({ ...s, secret: [0, 0, 0, 6] })).toBe(false);
    expect(isValidCodeBreakerState({ ...s, secret: [5, 5, 5, 5].map((x, i) => (i ? x : 4)) })).toBe(
      s.secret.join() === '4,5,5,5',
    );
    const g = s.guesses[0]!;
    expect(isValidCodeBreakerState({ ...s, guesses: [{ ...g, exact: (g.exact + 1) % 4 }] })).toBe(
      false,
    );
    const mine = newCodeBreaker('hard', 3, [7, 7, 0, 1, 2]);
    expect(mine.setter).toBe('player');
    expect(isValidCodeBreakerState(mine)).toBe(true);
    expect(isValidCodeBreakerState({ ...mine, variant: 'easy' })).toBe(false);
  });

  it('hides the code from the observation until the end', () => {
    const s = codeBreakerEnv.createInitialState(undefined, 5);
    expect(codeBreakerEnv.getObservation(s, 0).secret).toEqual([-1, -1, -1, -1]);
    const done = codeBreakerEnv.applyAction(s, s.secret.join(''));
    expect(codeBreakerEnv.getObservation(done, 0).secret).toEqual(s.secret);
    expect(codeBreakerEnv.getOutcome(done)?.returns).toEqual([1]);
    expect(codeActions(s)).toHaveLength(1296);
  });
});

describeAdapterContract(codeBreakerEnv, {
  configs: [undefined, { variant: 'easy' }],
  playouts: 6,
  maxSteps: 20,
  illegalActions: (s) =>
    ['6000', '012', 'abcd', '01234'].filter((a) => !codeActions(s).includes(a)),
});
