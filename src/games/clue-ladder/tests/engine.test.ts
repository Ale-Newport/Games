import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { domain, listKeys, question } from '../../rough-guess/engine';
import { AGENT_PRESETS, BANK, CLIMB, env, feasible, KEEP, observe } from '../ai-adapter';
import {
  accuracy,
  canDecide,
  canGuess,
  climb,
  cluesFor,
  current,
  DAILY_ROUNDS,
  feedback,
  finish,
  guess,
  isSession,
  keep,
  keptScore,
  newDaily,
  newEndless,
  next,
  RUNG_VALUE,
  RUNGS,
  shareText,
  type Session,
} from '../engine';

const answerOf = (s: Session) => question(BANK, current(s).key).value;
const sample = (n: number, seed: number) => {
  const keys = listKeys(BANK, 'hard');
  const rng = new Rng(seed);
  return Array.from({ length: n }, () => rng.pick(keys));
};

describe('clues', () => {
  it('every clue is true of the answer, over 1,500 random questions', () => {
    let brackets = 0;
    for (const [i, key] of sample(1500, 3).entries()) {
      const q = question(BANK, key);
      const c = cluesFor(BANK, key, i * 7919);
      if (c.bracket.below) {
        expect(c.bracket.below.value).toBeLessThan(q.value);
        brackets++;
      }
      if (c.bracket.above) expect(c.bracket.above.value).toBeGreaterThan(q.value);
      if (c.digits === 0) expect(q.value).toBeLessThan(1);
      else expect(Math.floor(q.value).toString()).toHaveLength(c.digits);
      expect(c.leading).toBeGreaterThanOrEqual(1);
      expect(c.leading).toBeLessThanOrEqual(9);
      expect(q.value / Math.pow(10, Math.floor(Math.log10(q.value)))).toBeGreaterThanOrEqual(
        c.leading - 1e-9,
      );
      expect(c.window[0]).toBeLessThan(q.value);
      expect(c.window[1]).toBeGreaterThan(q.value);
      expect(c.window[1] / c.window[0]).toBeCloseTo(1.3, 6);
      // The answer is never in the exact middle of the window.
      const t = Math.log(q.value / c.window[0]) / Math.log(1.3);
      expect(t).toBeGreaterThanOrEqual(0.15 - 1e-9);
      expect(t).toBeLessThanOrEqual(0.85 + 1e-9);
    }
    // Most questions get at least one related fact.
    expect(brackets).toBeGreaterThan(1200);
  });

  it('clues are deterministic for a seed and vary between seeds', () => {
    const key = listKeys(BANK, 'easy').filter((k) => k.startsWith('p:'))[5]!;
    expect(cluesFor(BANK, key, 42)).toEqual(cluesFor(BANK, key, 42));
    const windows = new Set(Array.from({ length: 10 }, (_, i) => cluesFor(BANK, key, i).window[0]));
    expect(windows.size).toBeGreaterThan(5);
  });

  it('related facts come from the same family', () => {
    const key = listKeys(BANK, 'easy')
      .filter((k) => k.startsWith('p:'))
      .find((k) => question(BANK, k).subject.en === 'Gold')!;
    const c = cluesFor(BANK, key, 9);
    const q = question(BANK, key);
    for (const f of [c.bracket.below, c.bracket.above]) {
      if (!f) continue;
      expect(f.subject.en).toBe('Gold');
      expect(f.year).not.toBe(q.year);
    }
  });
});

describe('feedback and scoring', () => {
  it('bands the distance and gives the direction', () => {
    expect(feedback(101, 100)).toEqual({ direction: 'exact', band: 'exact' });
    expect(feedback(95, 100)).toEqual({ direction: 'higher', band: 'hot' });
    expect(feedback(120, 100)).toEqual({ direction: 'lower', band: 'warm' });
    expect(feedback(70, 100)).toEqual({ direction: 'higher', band: 'near' });
    expect(feedback(250, 100)).toEqual({ direction: 'lower', band: 'far' });
    expect(feedback(1, 100)).toEqual({ direction: 'higher', band: 'way' });
  });

  it('accuracy and kept points follow the formula', () => {
    expect(accuracy(100, 100)).toBe(100);
    expect(accuracy(102, 100)).toBe(100);
    expect(accuracy(110, 100)).toBe(87);
    expect(accuracy(200, 100)).toBe(35);
    expect(accuracy(50, 100)).toBe(35);
    expect(keptScore(100, 100, 0)).toBe(100);
    expect(keptScore(100, 100, 4)).toBe(25);
    expect(keptScore(110, 100, 1)).toBe(65);
    expect(RUNG_VALUE).toHaveLength(RUNGS);
  });
});

describe('sessions', () => {
  it('a guess, then keep or climb; the last rung keeps automatically', () => {
    let s = newEndless(BANK, 11, 'normal', 'all', new Set(), 3);
    const v = answerOf(s);
    expect(canGuess(s)).toBe(true);
    expect(() => keep(s, BANK)).toThrow();
    expect(() => climb(s)).toThrow();
    s = guess(s, BANK, v * 2);
    expect(canDecide(s)).toBe(true);
    expect(() => guess(s, BANK, v)).toThrow();
    for (let r = 1; r < RUNGS; r++) {
      s = climb(s);
      expect(current(s).rung).toBe(r);
      s = guess(s, BANK, v * 2);
    }
    // Rung 5: kept at once.
    expect(current(s).kept).toBe(RUNGS - 1);
    expect(current(s).score).toBe(keptScore(v * 2, v, RUNGS - 1));
    expect(s.total).toBe(current(s).score);
    s = next(s, BANK);
    // An exact guess on rung 1 is kept straight away for 100.
    s = guess(s, BANK, answerOf(s));
    expect(current(s)).toMatchObject({ kept: 0, score: 100 });
    s = next(s, BANK);
    s = guess(s, BANK, answerOf(s) * 1.2);
    s = keep(s, BANK);
    expect(current(s).score).toBe(keptScore(answerOf(s) * 1.2, answerOf(s), 0));
    expect(s.status).toBe('done');
    expect(s.count).toBe(3);
    expect(() => next(s, BANK)).toThrow();
  });

  it('rejects guesses off the scale', () => {
    const s = newEndless(BANK, 2, 'easy', 'distances');
    const [lo, hi] = domain(BANK, question(BANK, current(s).key));
    expect(() => guess(s, BANK, Math.pow(10, lo - 0.5))).toThrow();
    expect(() => guess(s, BANK, Math.pow(10, hi + 0.5))).toThrow();
    expect(() => guess(s, BANK, 0)).toThrow();
    expect(() => guess(s, BANK, NaN)).toThrow();
  });

  it('the daily ladder is five questions, the same for everyone, with a share line', () => {
    const a = newDaily(BANK, 320);
    expect(a).toEqual(newDaily(BANK, 320));
    expect(newDaily(BANK, 321).rounds[0]!.key).not.toBe(a.rounds[0]!.key);
    let s = a;
    const keys = new Set<string>();
    for (let i = 0; i < DAILY_ROUNDS; i++) {
      keys.add(current(s).key);
      s = guess(s, BANK, answerOf(s) * 1.05);
      s = keep(s, BANK);
      if (i < DAILY_ROUNDS - 1) {
        // The daily never depends on the player's history: avoiding exactly what comes next changes nothing.
        const n = next(s, BANK);
        expect(next(s, BANK, new Set([current(n).key]))).toEqual(n);
        s = n;
      }
    }
    expect(keys.size).toBe(DAILY_ROUNDS);
    expect(s.status).toBe('done');
    expect(s.total).toBeGreaterThan(400);
    expect(shareText(s, 'Clue Ladder')).toMatch(/^Clue Ladder #321 — \d+\/500\n(🟩1 ){4}🟩1$/);
  });

  it('validates sessions and ends endless runs', () => {
    let s = newEndless(BANK, 5, 'hard', 'science', new Set(), 0);
    expect(isSession(JSON.parse(JSON.stringify(s)), BANK)).toBe(true);
    expect(isSession({ ...s, rounds: [{ ...current(s), key: 'x:1' }] }, BANK)).toBe(false);
    expect(isSession({ ...s, mode: 'weekly' })).toBe(false);
    s = guess(s, BANK, answerOf(s));
    s = next(s, BANK);
    s = finish(s);
    expect(s.status).toBe('done');
    expect(s.rounds).toHaveLength(1);
    expect(s.count).toBe(1);
  });
});

describe('AI', () => {
  it('the feasible range always holds the answer', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = newEndless(BANK, seed, 'hard', 'all', new Set(), 1);
      const v = answerOf(s);
      const rng = new Rng(seed);
      while (s.status === 'playing') {
        const [lo, hi] = feasible(observe(s));
        expect(Math.log10(v)).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(Math.log10(v)).toBeLessThanOrEqual(hi + 1e-9);
        if (canDecide(s)) s = current(s).rung < RUNGS - 1 ? climb(s) : keep(s, BANK);
        else {
          const g = Math.pow(10, lo + rng.float() * (hi - lo));
          s = guess(s, BANK, g);
        }
      }
    }
  });

  it('the reasoner beats always-climb, which beats random', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / 25;
    };
    const reasoner = avg('reasoner');
    const climber = avg('climber');
    expect(climber).toBeGreaterThan(avg('random') + 80);
    expect(reasoner).toBeGreaterThan(climber + 15);
  });

  it('only keep and climb are legal after a guess', () => {
    let s = env.createInitialState(undefined, 8);
    s = env.applyAction(s, env.getLegalActions(s)[0]!);
    expect(env.getLegalActions(s)).toEqual([KEEP, CLIMB]);
    expect(() => env.applyAction(s, 3)).toThrow();
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'prices', rounds: 2 }],
  playouts: 4,
  maxSteps: 40,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'clues',
      'guesses',
      'key',
      'kind',
      'round',
      'rung',
      'scale',
      'subject',
      'total',
    ]);
    // Clues appear one per rung climbed; the answer itself is never observed.
    expect(Object.keys(o.clues)).toHaveLength(Math.min(o.rung, 4));
    expect(Object.values(o)).not.toContain(answerOf(s));
  },
});
