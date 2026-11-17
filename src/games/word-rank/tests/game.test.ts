import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { climberMove } from '../ai';
import { applyRank, env, vectors } from '../ai-adapter';
import {
  band,
  bestRank,
  check,
  closest,
  dailySecret,
  gameNumber,
  giveUp,
  guess,
  hintWord,
  isValidState,
  newGame,
  takeHint,
} from '../engine';
import { SECRETS } from '../secrets';

describe('Word Rank', () => {
  it('only uses secrets the vocabulary knows', () => {
    expect(SECRETS.length).toBeGreaterThanOrEqual(300);
    expect(new Set(SECRETS).size).toBe(SECRETS.length);
    for (const w of SECRETS) expect(vectors.index.has(w), w).toBe(true);
  });

  it('ranks guesses by meaning and wins on rank 1', () => {
    let s = newGame('guitar');
    const piano = check(vectors, s, 'Pianos');
    expect(piano.rejection).toBeNull();
    s = guess(vectors, s, piano.word!);
    expect(s.guesses[0]!.rank).toBeLessThan(50);
    s = guess(vectors, s, check(vectors, s, 'tax').word!);
    expect(s.guesses[1]!.rank).toBeGreaterThan(1000);
    expect(check(vectors, s, 'piano').rejection).toBe('repeat');
    expect(check(vectors, s, 'zzqx').rejection).toBe('unknown');
    s = guess(vectors, s, check(vectors, s, 'guitar').word!);
    expect(s.status).toBe('won');
    expect(band(1)).toBe('close');
    expect(band(1000)).toBe('warm');
    expect(band(9000)).toBe('far');
    expect(isValidState(s)).toBe(true);
  });

  it('gives hints halfway to the secret, never the secret itself', () => {
    let s = newGame('ocean');
    expect(hintWord(vectors, s)).not.toBeNull();
    s = takeHint(vectors, s);
    expect(s.guesses[0]!.rank).toBe(300);
    s = takeHint(vectors, s);
    expect(s.guesses[1]!.rank).toBe(150);
    for (let i = 0; i < 12; i++) s = takeHint(vectors, s);
    expect(bestRank(s)).toBe(2);
    expect(s.status).toBe('playing');
    expect(closest(vectors, giveUp(s), 3).map((w) => vectors.words[w])[0]).toBe('ocean');
  });

  it('has a daily secret per date', () => {
    expect(gameNumber(new Date(2026, 0, 1))).toBe(0);
    expect(dailySecret(5)).toBe(dailySecret(5));
    expect(dailySecret(5)).not.toBe(dailySecret(6));
  });

  it('lets the meaning climber find most secrets', () => {
    let solved = 0;
    for (let seed = 1; seed <= 10; seed++) {
      let s = env.createInitialState({ limit: 300 }, seed);
      const rng = new Rng(seed);
      while (s.status === 'playing') s = applyRank(s, climberMove(vectors, s, rng, true));
      if (s.status === 'won') solved++;
    }
    expect(solved).toBeGreaterThanOrEqual(7);
  });
});

describeAdapterContract(env, {
  configs: [{ limit: 6 }, { secret: 'whale', limit: 4 }],
  playouts: 2,
  maxSteps: 20,
  illegalActions: () => ['g:-1', 'g:999999', 'pass' as never],
});
