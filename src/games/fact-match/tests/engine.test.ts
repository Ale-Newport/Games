import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { question } from '../../rough-guess/engine';
import { AGENT_PRESETS, BANK, bestAssignment, CHECK, env, observe } from '../ai-adapter';
import {
  check,
  CHECK_POINTS,
  CHECKS,
  checkIn,
  current,
  DAILY_BOARDS,
  decoys,
  families,
  familyTopic,
  FACTS,
  finish,
  isSession,
  makeBoard,
  MIN_GAP,
  newDaily,
  newEndless,
  next,
  NUMBERS,
  place,
  placeIn,
  shareText,
  unplace,
  type Board,
  type Session,
} from '../engine';

const familyOf = (k: string) => {
  const [t, a, b] = k.split(':');
  return t === 'p'
    ? `p:${a}`
    : t === 'e'
      ? `e:${b}`
      : t === 'm'
        ? `m:${question(BANK, k).kind}`
        : null;
};
/** Solves a board perfectly (placing every answer) — for tests only. */
const solve = (b: Board) => b.answer.reduce((x, n, f) => place(x, f, n), b);

describe('boards', () => {
  it('every family has enough members; distance families leave from one origin to other countries', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const fams = families(BANK, d);
      expect(fams.size).toBeGreaterThan(30);
      const topics = new Set([...fams].map(([f, keys]) => familyTopic(BANK, f, keys[0]!)));
      expect([...topics].sort()).toEqual(['distances', 'prices', 'science', 'world']);
      for (const [f, keys] of fams) {
        expect(keys.length).toBeGreaterThanOrEqual(NUMBERS);
        for (const k of keys.slice(0, 20)) {
          if (f.startsWith('d:')) {
            const o = Number(f.split(':')[1]);
            const [, a, b] = k.split(':').map(Number);
            expect([a, b]).toContain(o);
            expect(BANK.rough.cities[a!]![5]).not.toBe(BANK.rough.cities[b!]![5]);
          } else expect(familyOf(k)).toBe(f);
        }
      }
    }
  });

  it('boards are valid over 300 random draws: one family, distinct values, two true decoys', () => {
    const rng = new Rng(4);
    const fams = [...families(BANK, 'hard')];
    for (let i = 0; i < 300; i++) {
      const [f, keys] = rng.pick(fams);
      const b = makeBoard(BANK, rng, f, keys)!;
      expect(b).not.toBeNull();
      expect(b.facts).toHaveLength(FACTS);
      expect(new Set([...b.facts, ...b.decoyFacts]).size).toBe(NUMBERS);
      // The answers are the facts' true values; the decoys are true values of the decoy facts.
      b.facts.forEach((k, j) => expect(b.values[b.answer[j]!]).toBe(question(BANK, k).value));
      const dv = decoys(b)
        .map((n) => b.values[n])
        .sort();
      expect(dv).toEqual(b.decoyFacts.map((k) => question(BANK, k).value).sort());
      const sorted = [...b.values].sort((x, y) => x - y);
      for (let j = 1; j < NUMBERS; j++)
        expect(sorted[j]! / sorted[j - 1]!).toBeGreaterThanOrEqual(MIN_GAP - 1e-9);
      if (f.startsWith('p:')) {
        const years = b.facts.map((k) => question(BANK, k).year);
        expect(years).toEqual([...years].sort((x, y) => x - y));
      }
    }
  });
});

describe('placing and checking', () => {
  const board = () =>
    makeBoard(BANK, new Rng(9), 'm:mountain-elev', families(BANK, 'hard').get('m:mountain-elev')!)!;

  it('places, moves and takes back numbers', () => {
    let b = board();
    b = place(b, 0, 3);
    b = place(b, 1, 3);
    expect(b.placement.slice(0, 2)).toEqual([null, 3]);
    b = unplace(b, 1);
    expect(b.placement[1]).toBeNull();
    expect(() => place(b, 5, 0)).toThrow();
  });

  it('locks right placements, crosses wrong ones and scores 20 / 12 / 6', () => {
    let b = board();
    const [d0, d1] = decoys(b);
    // Check 1: facts 0 and 1 right, fact 2 on a decoy.
    b = place(place(place(b, 0, b.answer[0]!), 1, b.answer[1]!), 2, d0!);
    b = check(b);
    expect(b.locked).toEqual([1, 1, 0, 0, 0]);
    expect(b.placement[2]).toBeNull();
    expect(b.wrong).toEqual([2 * NUMBERS + d0!]);
    expect(() => place(b, 0, d1!)).toThrow('locked');
    expect(() => place(b, 3, b.answer[0]!)).toThrow('locked');
    // Check 2: fact 2 right.
    b = check(place(b, 2, b.answer[2]!));
    expect(b.locked).toEqual([1, 1, 2, 0, 0]);
    expect(b.score).toBeNull();
    // Check 3: fact 3 right, fact 4 wrong — the board ends.
    b = check(place(place(b, 3, b.answer[3]!), 4, d1!));
    expect(b.locked).toEqual([1, 1, 2, 3, 0]);
    expect(b.score).toBe(20 + 20 + 12 + 6);
    expect(() => check(b)).toThrow();
    expect(CHECK_POINTS).toHaveLength(CHECKS);
  });

  it('a perfect first check ends the board at 100', () => {
    const b = check(solve(board()));
    expect(b.score).toBe(100);
    expect(b.checks).toBe(1);
  });
});

describe('sessions', () => {
  it('the daily is three boards — prices, science or distances, world — the same for everyone', () => {
    const a = newDaily(BANK, 310);
    expect(a).toEqual(newDaily(BANK, 310));
    let s: Session = a;
    const topics: string[] = [];
    for (let i = 0; i < DAILY_BOARDS; i++) {
      const b = current(s);
      topics.push(familyTopic(BANK, b.family, b.facts[0]!));
      s = { ...s, boards: [...s.boards.slice(0, -1), solve(b)] };
      s = checkIn(s);
      if (i < DAILY_BOARDS - 1) s = next(s, BANK);
    }
    expect(topics[0]).toBe('prices');
    expect(['science', 'distances']).toContain(topics[1]);
    expect(topics[2]).toBe('world');
    expect(s.status).toBe('done');
    expect(s.total).toBe(300);
    expect(shareText(s, 'Fact Match')).toBe(
      'Fact Match #311 — 300/300\n🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩',
    );
  });

  it('endless boards follow the topic, avoid recent families, validate and end', () => {
    let s = newEndless(BANK, 5, 'normal', 'science');
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const b = current(s);
      expect(familyTopic(BANK, b.family, b.facts[0]!)).toBe('science');
      expect(seen.has(b.family)).toBe(false);
      seen.add(b.family);
      s = placeIn(s, 0, b.answer[0]!);
      for (let c = 0; c < CHECKS; c++)
        if (current(s).score === null) s = checkIn(placeIn(s, 1, decoys(current(s))[c % 2]!));
      expect(current(s).score).toBe(20);
      s = next(s, BANK);
    }
    expect(s.total).toBe(80);
    expect(isSession(JSON.parse(JSON.stringify(s)), BANK)).toBe(true);
    expect(isSession({ ...s, topic: 'gossip' })).toBe(false);
    expect(isSession({ ...s, boards: [{ ...current(s), answer: [0, 0, 1, 2, 3] }] })).toBe(false);
    s = finish(s);
    expect(s.count).toBe(4);
  });
});

describe('AI', () => {
  it('the best assignment respects locks and crosses', () => {
    let s = newEndless(BANK, 2, 'easy', 'world', new Set(), 1);
    const b = current(s);
    s = checkIn(placeIn(placeIn(s, 0, b.answer[0]!), 1, decoys(b)[0]!));
    const o = observe(s);
    const plan = bestAssignment(o, () => 0);
    expect(plan[0]).toBe(b.answer[0]);
    expect(plan[1]).not.toBe(decoys(b)[0]);
    expect(new Set(plan).size).toBe(FACTS);
  });

  it('the expert beats the ranker, which beats random', () => {
    const avg = (id: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const agent = AGENT_PRESETS.find((a) => a.id === id)!.create();
        let s = env.createInitialState(undefined, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(s)) s = env.applyAction(s, agent.selectAction(env, s, 0, { rng }));
        sum += s.total;
      }
      return sum / 30;
    };
    const ranker = avg('ranker');
    expect(ranker).toBeGreaterThan(avg('random') + 30);
    expect(avg('expert')).toBeGreaterThan(ranker + 30);
  });

  it('check is only legal once something new is placed', () => {
    const s = env.createInitialState(undefined, 3);
    expect(env.getLegalActions(s)).not.toContain(CHECK);
    const s2 = env.applyAction(s, 0);
    expect(env.getLegalActions(s2)).toContain(CHECK);
  });
});

describeAdapterContract(env, {
  configs: [undefined, { difficulty: 'easy', topic: 'prices', boards: 1 }],
  playouts: 3,
  maxSteps: 2000,
  checkObservation: (s) => {
    const o = observe(s);
    expect(Object.keys(o).sort()).toEqual([
      'board',
      'checks',
      'facts',
      'family',
      'locked',
      'numbers',
      'placement',
      'total',
      'wrong',
    ]);
    expect(o).not.toHaveProperty('answer');
  },
});
