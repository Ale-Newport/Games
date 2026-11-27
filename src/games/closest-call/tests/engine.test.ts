import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { domain, question } from '../../rough-guess/engine';
import { AGENT_PRESETS, BANK, env, observe } from '../ai-adapter';
import { belief, expertPrior, familyPrior } from '../beliefs';
import {
  botGuess,
  currentRound,
  DAILY_BOTS,
  expectedValue,
  guess,
  isGame,
  newDaily,
  newGame,
  nextRound,
  ringPoints,
  ROUNDS,
  roundMultiplier,
  settle,
  standings,
  turn,
  winners,
  type Game,
  type Level,
  type Player,
} from '../engine';

const people = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i}`, bot: null }));

/** Plays the whole game: each contestant answers truth × factor(seat). */
function playOut(g: Game, factor: (seat: number) => number): Game {
  while (g.status === 'playing') {
    const p = turn(g);
    if (p < 0) {
      g = nextRound(g, BANK);
      continue;
    }
    const q = question(BANK, currentRound(g).key);
    const [lo, hi] = domain(BANK, q);
    const v = Math.min(Math.pow(10, hi), Math.max(Math.pow(10, lo), q.value * factor(p)));
    g = guess(g, BANK, v);
  }
  return g;
}

describe('scoring', () => {
  it('ring points by ratio to the truth', () => {
    expect(ringPoints(1)).toBe(10);
    expect(ringPoints(1.02)).toBe(10);
    expect(ringPoints(1.04)).toBe(8);
    expect(ringPoints(1.08)).toBe(6);
    expect(ringPoints(1.2)).toBe(4);
    expect(ringPoints(1.4)).toBe(3);
    expect(ringPoints(1.9)).toBe(2);
    expect(ringPoints(9)).toBe(1);
    expect(ringPoints(11)).toBe(0);
  });

  it('the closest answer earns +3, ties share it, the last round doubles everything', () => {
    expect(settle([100, 150, 300], 100, 0)).toEqual([13, 3, 1]);
    expect(settle([100, 1100], 100, 0)).toEqual([13, 0]);
    expect(settle([90, 111.11111111111111], 100, 0)).toEqual([7, 7]);
    expect(settle([100, 150], 100, ROUNDS - 1)).toEqual([26, 6]);
    expect(roundMultiplier(0)).toBe(1);
    expect(roundMultiplier(ROUNDS - 1)).toBe(2);
  });
});

describe('game flow', () => {
  it('turn order rotates every round and answers are taken in order', () => {
    let g = newGame(BANK, people(3), 4);
    for (let r = 0; r < 3; r++) {
      expect(currentRound(g).first).toBe(r % 3);
      const order: number[] = [];
      while (turn(g) >= 0) {
        order.push(turn(g));
        const q = question(BANK, currentRound(g).key);
        g = guess(g, BANK, q.value);
      }
      expect(order).toEqual([r % 3, (r + 1) % 3, (r + 2) % 3]);
      g = nextRound(g, BANK);
    }
  });

  it('eight rounds to the end, standings and winners follow the scores', () => {
    const g = playOut(newGame(BANK, people(3), 7), (s) => [1, 1.3, 3][s]!);
    expect(g.status).toBe('done');
    expect(g.rounds).toHaveLength(ROUNDS);
    // Exact answers every round: 10 + 3 bonus, the last doubled → 7 × 13 + 26.
    expect(g.scores[0]).toBe(7 * 13 + 26);
    expect(standings(g)).toEqual([0, 1, 2]);
    expect(winners(g)).toEqual([0]);
    expect(new Set(g.rounds.map((r) => r.key)).size).toBe(ROUNDS);
  });

  it('rejects answers out of turn, off the scale or not positive, and early next rounds', () => {
    const g = newGame(BANK, people(2), 3);
    const q = question(BANK, currentRound(g).key);
    const [lo, hi] = domain(BANK, q);
    expect(() => guess(g, BANK, Math.pow(10, hi + 1))).toThrow();
    expect(() => guess(g, BANK, Math.pow(10, lo - 1))).toThrow();
    expect(() => guess(g, BANK, -5)).toThrow();
    expect(() => nextRound(g, BANK)).toThrow();
    expect(() => newGame(BANK, people(1), 1)).toThrow();
    expect(() => newGame(BANK, people(5), 1)).toThrow();
    const done = playOut(newGame(BANK, people(2), 3), () => 1);
    expect(() => guess(done, BANK, q.value)).toThrow();
  });

  it('the daily game is fixed for the date and pits you against three Normal contestants', () => {
    const a = newDaily(BANK, 331, 'Me');
    expect(newDaily(BANK, 331, 'Someone').rounds[0]!.key).toBe(a.rounds[0]!.key);
    expect(a.players.slice(1)).toEqual(DAILY_BOTS);
    expect(isGame(JSON.parse(JSON.stringify(a)))).toBe(true);
    expect(isGame({ ...a, players: a.players.slice(0, 1) })).toBe(false);
    expect(isGame({ ...a, scores: [1, 2] })).toBe(false);
  });
});

describe('computer contestants', () => {
  it('never use the answer: beliefs come from related facts only', () => {
    const g = newGame(BANK, people(2), 11);
    const key = currentRound(g).key;
    const truth = Math.log10(question(BANK, key).value);
    for (const level of ['easy', 'normal', 'hard'] as Level[]) {
      const b = belief(BANK, key, level);
      expect(Number.isFinite(b.mean) && b.sd > 0).toBe(true);
    }
    // Expert price beliefs come from neighbouring years, never the year itself.
    const ci = BANK.rough.commodities.findIndex((c) => c[0] === 'gold');
    const k = `p:${ci}:2000`;
    const neighbours = BANK.rough.prices
      .filter((p) => p[0] === ci && p[1] !== 2000 && Math.abs(p[1] - 2000) <= 3)
      .map((p) => Math.log10(p[2]));
    expect(expertPrior(BANK, k).mean).toBeCloseTo(
      neighbours.reduce((a, b) => a + b) / neighbours.length,
      9,
    );
    expect(familyPrior(BANK, k).mean).not.toBeCloseTo(Math.log10(question(BANK, k).value), 3);
    void truth;
  });

  it('a later contestant steps beside an earlier answer instead of tying it', () => {
    let g = newGame(
      BANK,
      [0, 1, 2, 3].map((i) => ({ name: `B${i}`, bot: 'normal' as const })),
      5,
    );
    const rng = new Rng(1);
    const answers: number[] = [];
    while (turn(g) >= 0) {
      const v = botGuess(g, BANK, 'normal', rng);
      answers.push(v);
      g = guess(g, BANK, v);
    }
    expect(new Set(answers).size).toBe(4);
    // Stepping beside a rival is worth more than tying it.
    const b = belief(BANK, currentRound(g).key, 'normal');
    expect(expectedValue(b.mean + 0.004, b.mean, b.sd, [b.mean])).toBeGreaterThan(
      expectedValue(b.mean, b.mean, b.sd, [b.mean]),
    );
  });

  it('levels are ordered: Hard beats Normal beats Easy beats Random', () => {
    const duel = (a: string, b: string) => {
      let winsA = 0;
      let winsB = 0;
      for (let seed = 1; seed <= 16; seed++) {
        const agents = [a, b].map((id) => AGENT_PRESETS.find((p) => p.id === id)!.create());
        let g = env.createInitialState({ players: 2 }, seed);
        const rng = new Rng(seed);
        while (!env.isTerminal(g)) {
          const p = env.getCurrentPlayer(g);
          g = env.applyAction(g, agents[(p + seed) % 2]!.selectAction(env, g, p, { rng }));
        }
        const w = winners(g);
        if (w.length === 1) {
          if ((w[0]! + seed) % 2 === 0) winsA++;
          else winsB++;
        }
      }
      return [winsA, winsB];
    };
    for (const [a, b] of [
      ['hard', 'normal'],
      ['normal', 'easy'],
      ['easy', 'random'],
    ] as const) {
      const [wa, wb] = duel(a, b);
      expect(wa, `${a} vs ${b}`).toBeGreaterThan(wb!);
    }
  });
});

describeAdapterContract(env, {
  configs: [undefined, { players: 4 }],
  playouts: 3,
  maxSteps: 40,
  checkObservation: (g, p) => {
    const o = observe(g, p);
    expect(o.me).toBe(p);
    expect(Object.keys(o).sort()).toEqual([
      'domain',
      'guesses',
      'key',
      'kind',
      'me',
      'round',
      'scores',
      'subject',
      'year',
    ]);
  },
});
