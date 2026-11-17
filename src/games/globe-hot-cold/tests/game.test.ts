import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { env, trackerMove } from '../ai-adapter';
import {
  dailyTarget,
  giveUp,
  guess,
  heat,
  isValidState,
  newGame,
  randomGame,
  ranked,
  share,
} from '../engine';

describe('Hot & Cold Globe', () => {
  it('ranks guesses by border distance and finds the target', () => {
    let s = newGame('FR');
    for (const g of ['JP', 'ES', 'IT', 'FR']) s = guess(s, g);
    expect(s.status).toBe('won');
    const r = ranked(s);
    expect(r[0]!.km).toBe(0);
    expect(r.at(-1)!.iso2).toBe('JP');
    expect(share(s, 'Globe').split('\n')[1]).toBe('⬜🟥🟥🌎');
    expect(isValidState(s)).toBe(true);
    expect(giveUp(newGame('FR')).status).toBe('gave-up');
    expect(dailyTarget(4)).toBe(dailyTarget(4));
  });

  it('colours hot to cold', () => {
    expect(heat(0)).toBe('rgb(140, 18, 18)');
    expect(heat(99999)).toBe('rgb(255, 244, 222)');
    expect(heat(0, true)).toBe('#3ddc84');
  });

  it('lets the border tracker find countries in few guesses', () => {
    let total = 0;
    for (let seed = 1; seed <= 25; seed++) {
      let s = randomGame(seed);
      const rng = new Rng(seed);
      while (s.status === 'playing' && s.guesses.length < 60) s = guess(s, trackerMove(s, rng));
      expect(s.status).toBe('won');
      total += s.guesses.length;
    }
    expect(total / 25).toBeLessThan(6);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { target: 'NG' }],
  playouts: 3,
  maxSteps: 220,
  illegalActions: () => ['g:XX', 'pass' as never],
});
