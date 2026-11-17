import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { warmerMove } from '../ai';
import { applyWarm, env, vectors } from '../ai-adapter';
import {
  NEAREST,
  check,
  dailySecret,
  guess,
  isValidState,
  newGame,
  secretInfo,
  temperature,
} from '../engine';
import { SECRETS } from '../secrets';

describe('Word Warmth', () => {
  it('only uses secrets the vocabulary knows', () => {
    expect(SECRETS.length).toBeGreaterThanOrEqual(280);
    for (const w of SECRETS) expect(vectors.index.has(w), w).toBe(true);
  });

  it('scores similarity and places near words out of 1000', () => {
    const info = secretInfo(vectors, 'courage');
    expect(info.top1).toBeGreaterThan(info.top10);
    expect(info.top10).toBeGreaterThan(info.top1000);
    let s = newGame('courage');
    s = guess(vectors, s, check(vectors, s, 'bravery').word!);
    const g = s.guesses[0]!;
    expect(g.near).not.toBeNull();
    expect(g.near!).toBeGreaterThan(900);
    expect(temperature(g)).toBe('hot');
    s = guess(vectors, s, check(vectors, s, 'spreadsheet').word!);
    expect(s.guesses[1]!.near).toBeNull();
    s = guess(vectors, s, check(vectors, s, 'Courage').word!);
    expect(s.status).toBe('won');
    expect(s.guesses[2]).toMatchObject({ score: 100, near: NEAREST, n: 3 });
    expect(isValidState(s)).toBe(true);
    expect(dailySecret(3)).toBe(dailySecret(3));
  });

  it('lets the hill climber solve most words', () => {
    let solved = 0;
    for (let seed = 1; seed <= 10; seed++) {
      let s = env.createInitialState({ limit: 300 }, seed);
      const rng = new Rng(seed);
      while (s.status === 'playing') s = applyWarm(s, warmerMove(vectors, s, rng));
      if (s.status === 'won') solved++;
    }
    expect(solved).toBeGreaterThanOrEqual(6);
  });
});

describeAdapterContract(env, {
  configs: [{ limit: 6 }, { secret: 'harmony', limit: 4 }],
  playouts: 2,
  maxSteps: 20,
  illegalActions: () => ['g:-1', 'g:999999', 'pass' as never],
});
