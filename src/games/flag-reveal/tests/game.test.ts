import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { env, triangulatorMove } from '../ai-adapter';
import {
  MAX_GUESSES,
  TARGETS,
  dailyTarget,
  guess,
  isValidState,
  newGame,
  randomGame,
  revealed,
  share,
} from '../engine';

describe('Flag Reveal', () => {
  it('lifts one tile per wrong guess and everything at the end', () => {
    let s = newGame('JP', 2, 4);
    expect(revealed(s).size).toBe(0);
    s = guess(s, 'KR');
    expect(revealed(s).size).toBe(1);
    s = guess(s, 'KR');
    expect(s.guesses).toHaveLength(1);
    s = guess(s, 'CN');
    expect(revealed(s).size).toBe(2);
    s = guess(s, 'JP');
    expect(s.status).toBe('won');
    expect(revealed(s).size).toBe(6);
    expect(share(s, 'Flag Reveal').split('\n')[0]).toBe('Flag Reveal #3 3/6');
    let t = newGame('JP', null, 1);
    for (const g of ['FR', 'DE', 'IT', 'ES', 'PT', 'BR']) t = guess(t, g);
    expect(t.status).toBe('lost');
    expect(t.guesses).toHaveLength(MAX_GUESSES);
    expect(isValidState(t)).toBe(true);
  });

  it('has 196 flags and a daily rotation', () => {
    expect(TARGETS).toHaveLength(196);
    expect(dailyTarget(9)).toBe(dailyTarget(9));
  });

  it('lets the triangulator solve nearly every flag', () => {
    let won = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let s = randomGame(seed);
      const rng = new Rng(seed);
      while (s.status === 'playing') s = guess(s, triangulatorMove(s, rng));
      if (s.status === 'won') won++;
    }
    expect(won).toBeGreaterThanOrEqual(26);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { target: 'MX' }],
  playouts: 4,
  maxSteps: 10,
  illegalActions: () => ['g:XX', 'pass' as never],
});
