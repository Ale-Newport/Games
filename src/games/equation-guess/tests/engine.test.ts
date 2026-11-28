import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { AGENT_PRESETS, consistent, DATA, env, observe } from '../ai-adapter';
import {
  current,
  DAILY_SIZES,
  finish,
  invalidReason,
  isSession,
  isValid,
  keyStates,
  LENGTH,
  mark,
  newDaily,
  newEndless,
  next,
  pattern,
  POINTS,
  pretty,
  shareText,
  submit,
  TRIES,
  type Session,
} from '../engine';

describe('validity', () => {
  it('accepts true equations with the usual precedence', () => {
    expect(invalidReason('9*6=54', 6)).toBeNull();
    expect(invalidReason('12+3=15', 7)).toBeNull();
    expect(invalidReason('2+3*4=14', 8)).toBeNull();
    expect(invalidReason('20-3*4=8', 8)).toBeNull();
    expect(invalidReason('8/4*3=6', 7)).toBeNull();
    // Exact fractions on the way: 7 ÷ 2 × 4 = 14.
    expect(invalidReason('7/2*4=14', 8)).toBeNull();
    expect(invalidReason('1/3+2/3=1', 9)).toBeNull();
  });

  it('names what is wrong with an invalid guess', () => {
    expect(invalidReason('9*6=5', 6)).toBe('length');
    expect(invalidReason('9a6=54', 6)).toBe('symbols');
    expect(invalidReason('9*6954', 6)).toBe('equals');
    expect(invalidReason('9=6=54', 6)).toBe('equals');
    expect(invalidReason('54=9*6', 6)).toBe('syntax'); // the right side is one number
    expect(invalidReason('09*6=54', 7)).toBe('syntax'); // no leading zeros
    expect(invalidReason('-9+63=54', 8)).toBe('syntax'); // no unary minus
    expect(invalidReason('9**6=54', 7)).toBe('syntax');
    expect(invalidReason('54=54', 5)).toBe('syntax'); // needs an operator
    expect(invalidReason('5/0=1', 5)).toBe('divzero');
    expect(invalidReason('9*6=55', 6)).toBe('false');
    expect(invalidReason('5-9=0', 5)).toBe('false');
    expect(invalidReason('7/2=3', 5)).toBe('false'); // no rounding
  });

  it('every answer is a true, non-trivial equation of its length', () => {
    expect(DATA.six.length).toBeGreaterThan(150);
    expect(DATA.eight.length).toBeGreaterThan(10_000);
    expect(new Set(DATA.eight).size).toBe(DATA.eight.length);
    for (const [pool, len] of [
      [DATA.six, 6],
      [DATA.eight, 8],
    ] as const)
      for (const a of pool) {
        expect(isValid(a, len)).toBe(true);
        const [left, right] = a.split('=') as [string, string];
        expect(right).not.toBe('0');
        const nums = left.split(/[+\-*/]/);
        expect(nums).not.toContain('0');
        expect(/[*/]1(?!\d)|(?<!\d)1\*/.test(left)).toBe(false);
      }
  });
});

describe('marks', () => {
  it('greens, yellows and greys, counting repeats', () => {
    expect(mark('9*6=54', '9*6=54').every((m) => m === 'correct')).toBe(true);
    // 9*5=45 vs 9*6=54: 9 ✓, * ✓, first 5 elsewhere (yellow), = ✓, 4 yellow, second 5 grey.
    expect(pattern(mark('9*5=45', '9*6=54'))).toBe('ggygyx');
    // Two 1s guessed, one in the answer: only one is coloured.
    expect(pattern(mark('11+6=17', '12+5=17'))).toBe('gxgxggg');
    expect(pattern(mark('6+11=17', '12+5=17'))).toBe('xyyxggg');
  });

  it('key states keep the best mark seen for each symbol', () => {
    const k = keyStates(['9+8=17', '9*5=45'], '9*6=54');
    expect(k.get('9')).toBe('correct');
    expect(k.get('=')).toBe('correct');
    expect(k.get('5')).toBe('present');
    expect(k.get('8')).toBe('absent');
    expect(k.get('+')).toBe('absent');
    expect(k.has('6')).toBe(false);
  });

  it('pretty prints × ÷ −', () => {
    expect(pretty('12-3*4/2=6')).toBe('12−3×4÷2=6');
  });
});

/** Plays a puzzle by guessing the answer on try `n` (1-based), wrong true equations before. */
function solveOn(s: Session, n: number): Session {
  const p = current(s);
  const pool = LENGTH[p.size] === 6 ? DATA.six : DATA.eight;
  const wrong = pool.filter((a) => a !== p.answer).slice(0, n - 1);
  for (const w of wrong) s = submit(s, w);
  return submit(s, p.answer);
}

describe('sessions', () => {
  it('the daily is mini, classic, hard; the same for everyone whatever their history', () => {
    let s = newDaily(DATA, 40);
    expect(s).toEqual(newDaily(DATA, 40));
    expect(newDaily(DATA, 41)).not.toEqual(s);
    const sizes = [current(s).size];
    for (let i = 0; i < 2; i++) {
      s = solveOn(s, 1);
      const n = next(s, DATA);
      // A history that contains the next answer does not change it.
      expect(next(s, DATA, new Set([current(n).answer]))).toEqual(n);
      s = n;
      sizes.push(current(s).size);
    }
    expect(sizes).toEqual(DAILY_SIZES);
    s = solveOn(s, 2);
    expect(s.status).toBe('done');
    expect(s.total).toBe(100 + 100 + POINTS[1]!);
    const share = shareText(s, 'Equation Guess');
    expect(share.split('\n')[0]).toBe(`Equation Guess #41 — ${s.total}/300`);
    expect(share).toContain('1/6\n🟩🟩🟩🟩🟩🟩');
    expect(share).toContain('2/5\n');
    expect(share).not.toContain(current(s).answer);
  });

  it('scores by tries, loses after the last try, and endless avoids the history', () => {
    let s = newEndless(DATA, 7, 'hard');
    const first = current(s).answer;
    expect(LENGTH[current(s).size]).toBe(8);
    const wrong = DATA.eight.filter((a) => a !== first).slice(0, TRIES.hard);
    for (const w of wrong) s = submit(s, w);
    expect(current(s).status).toBe('lost');
    expect(current(s).score).toBe(0);
    expect(() => submit(s, first)).toThrow();
    s = next(s, DATA);
    s = solveOn(s, 3);
    expect(current(s).score).toBe(POINTS[2]);
    expect(s.count).toBe(2);
    expect(s.status).toBe('playing');
    // Endless never repeats an answer from the player's history while fresh ones remain.
    const avoid = new Set(DATA.six.slice(0, DATA.six.length - 1));
    expect(current(newEndless(DATA, 3, 'mini', avoid)).answer).toBe(DATA.six.at(-1));
    s = finish(s);
    expect(s.status).toBe('done');
    expect(s.puzzles).toHaveLength(2);
  });

  it('rejects invalid guesses and validates saved sessions', () => {
    let s = newEndless(DATA, 11, 'mini', new Set(), 2);
    expect(() => submit(s, '9*6=55')).toThrow(/false/);
    expect(() => submit(s, '12+3=15')).toThrow(/length/);
    expect(isSession(JSON.parse(JSON.stringify(s)))).toBe(true);
    s = solveOn(s, 1);
    expect(isSession(s)).toBe(true);
    expect(isSession({ ...s, size: 'giant' })).toBe(false);
    const p = current(s);
    expect(isSession({ ...s, puzzles: [{ ...p, guesses: ['9*6=55'] }] })).toBe(false);
    expect(isSession({ ...s, puzzles: [{ ...p, answer: '1+1=3' }] })).toBe(false);
    s = solveOn(next(s, DATA), 1);
    expect(s.status).toBe('done');
    expect(() => next(s, DATA)).toThrow();
  });
});

describe('AI', () => {
  it('observations never show the answer; the answer is always consistent', () => {
    let s = env.createInitialState({ size: 'classic', puzzles: 1 }, 4);
    const answer = current(s).answer;
    expect(JSON.stringify(observe(s))).not.toContain(answer);
    const rng = new Rng(2);
    const pool = DATA.eight;
    for (let i = 0; i < 4 && current(s).status === 'playing'; i++) {
      const o = observe(s);
      const c = consistent(o);
      expect(c.map((k) => pool[k])).toContain(answer);
      s = env.applyAction(s, rng.pick(env.getLegalActions(s)));
    }
  });

  it('the solver beats the consistent guesser, which beats random', () => {
    const avg = (id: string, n: number) => {
      let sum = 0;
      for (let seed = 1; seed <= n; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState({ size: 'mini', puzzles: 3 }, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / n;
    };
    const cons = avg('consistent', 20);
    expect(cons).toBeGreaterThan(avg('random', 20) + 100);
    expect(avg('solver', 20)).toBeGreaterThanOrEqual(cons);
  });

  it('a guess can only be tried once per puzzle', () => {
    const s = env.createInitialState({ size: 'mini', puzzles: 1 }, 9);
    const a = env.getLegalActions(s).find((i) => DATA.six[i] !== current(s).answer)!;
    const n = env.applyAction(s, a);
    expect(env.getLegalActions(n)).not.toContain(a);
    expect(() => env.applyAction(n, a)).toThrow();
  });
});

describeAdapterContract(env, {
  configs: [{ size: 'mini', puzzles: 1 }, { size: 'hard', puzzles: 2 }, {}],
  playouts: 2,
  checkObservation: (s) => {
    expect(Object.keys(observe(s)).sort()).toEqual([
      'history',
      'puzzle',
      'size',
      'total',
      'triesLeft',
    ]);
  },
});
