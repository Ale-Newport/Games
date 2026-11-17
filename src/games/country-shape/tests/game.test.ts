import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/game-engine/random';
import { candidates, triangulatorMove } from '../ai';
import {
  MAX_GUESSES,
  TARGETS,
  answerBonus,
  clue,
  dailyTarget,
  guess,
  isValidState,
  newGame,
  randomGame,
  share,
} from '../engine';

describe('Country Shape rules', () => {
  it('gives distance, arrow and proximity clues', () => {
    const c = clue('PT', 'ES');
    expect(c.km).toBeGreaterThan(200);
    expect(c.km).toBeLessThan(600);
    expect(c.arrow).toBe('➡️');
    expect(c.proximity).toBeGreaterThan(95);
    expect(clue('ES', 'ES')).toMatchObject({ km: 0, proximity: 100, arrow: '🎉' });
    expect(clue('AR', 'ES').arrow).toBe('↗️');
  });

  it('wins, loses after six guesses and runs the bonus questions', () => {
    let s = newGame('ES', 3, 1);
    expect(s.capitalOptions).toContain('ES');
    expect(new Set(s.flagOptions).size).toBe(4);
    s = guess(s, 'FR');
    s = guess(s, 'FR');
    expect(s.guesses).toHaveLength(1);
    s = guess(s, 'ES');
    expect(s.status).toBe('won');
    s = answerBonus(answerBonus(s, 'capital', 'ES'), 'flag', 'FR');
    expect([s.capital, s.flag]).toEqual(['right', 'wrong']);
    expect(share(s, 'Country Shape').split('\n')[0]).toBe('Country Shape #4 2/6 (100%)');
    let t = newGame('JP', null, 2);
    for (const g of ['FR', 'DE', 'IT', 'ES', 'PT', 'BR']) t = guess(t, g);
    expect(t.status).toBe('lost');
    expect(t.guesses).toHaveLength(MAX_GUESSES);
    expect(isValidState(t)).toBe(true);
  });

  it('has recognisable targets and a daily rotation', () => {
    expect(TARGETS.length).toBeGreaterThan(170);
    expect(TARGETS).not.toContain('VA');
    expect(dailyTarget(1)).toBe(dailyTarget(1));
  });

  it('lets the triangulator solve nearly every country within six guesses', () => {
    let won = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = randomGame(seed);
      const rng = new Rng(seed);
      while (s.status === 'playing') {
        expect(candidates(s)).toContain(s.target);
        s = guess(s, triangulatorMove(s, rng));
      }
      if (s.status === 'won') won++;
    }
    expect(won).toBeGreaterThanOrEqual(36);
  });
});
