import { describe, expect, it } from 'vitest';
import { chooseThrow, decide } from '../ai';
import { act, beaters, isValidDuel, newDuel, observe, outcome, type Duel } from '../engine';

const play = (g: Duel, a: number, b: number) => act(act(g, `throw:${a}`), `throw:${b}`);

describe('Throw duels', () => {
  it('three throws: paper > rock > scissors > paper', () => {
    expect(outcome(3, 1, 0)).toBe(1);
    expect(outcome(3, 2, 1)).toBe(1);
    expect(outcome(3, 0, 2)).toBe(1);
    expect(outcome(3, 0, 1)).toBe(-1);
    expect(outcome(3, 2, 2)).toBe(0);
  });

  it('five throws: each beats two and loses to two', () => {
    for (let x = 0; x < 5; x++) {
      expect(beaters(5, x)).toHaveLength(2);
      expect([0, 1, 2, 3, 4].filter((y) => outcome(5, x, y) === 1)).toHaveLength(2);
    }
    // Rock (0) beats scissors (4) and lizard (3); the wizard (1) beats rock and scissors.
    expect([outcome(5, 0, 4), outcome(5, 0, 3), outcome(5, 1, 0), outcome(5, 1, 4)]).toEqual([
      1, 1, 1, 1,
    ]);
  });

  it('rounds count wins, ties do not; the match ends at the target', () => {
    let g = newDuel(3, 3, 1);
    g = play(g, 1, 0);
    g = play(g, 0, 0);
    expect(g.wins).toEqual([1, 0]);
    g = play(play(g, 1, 0), 1, 0);
    expect(g.phase).toBe('over');
    expect(g.winner).toBe(0);
    expect(act(g, 'throw:0')).toBe(g);
  });

  it('seat 1 never sees the pending throw; saves replay', () => {
    const g = act(newDuel(3, 5, 1), 'throw:2');
    expect(observe(g, 1).pending).toBe(-1);
    expect(observe(g, 0).pending).toBe(2);
    expect(isValidDuel(JSON.parse(JSON.stringify(g)), 3)).toBe(true);
    expect(isValidDuel({ ...g, wins: [3, 0] }, 3)).toBe(false);
    expect(isValidDuel(g, 5)).toBe(false);
  });
});

describe('Throw readers', () => {
  /** Plays `rounds` rounds of seat 0 by `p0` against seat 1 by `p1`; returns seat 0's share of decided rounds. */
  function share(
    n: number,
    p0: (g: Duel) => number,
    p1: (g: Duel) => number,
    rounds = 120,
  ): number {
    let g = newDuel(n, 1000, 7);
    for (let i = 0; i < rounds; i++) g = act(act(g, `throw:${p0(g)}`), `throw:${p1(g)}`);
    return g.wins[0] / (g.wins[0] + g.wins[1]);
  }

  it('decisions depend only on finished rounds', () => {
    const g = play(play(newDuel(3, 1000, 2), 0, 1), 0, 2);
    const pendingA = act(g, 'throw:0');
    const pendingB = act(g, 'throw:2');
    expect(chooseThrow(pendingA, 1, 'meta')).toBe(chooseThrow(pendingB, 1, 'meta'));
    expect(decide(newDuel(3, 5, 1), 1, 'meta').read).toBe(false);
  });

  it('readers punish predictable players; the mind reader beats the others', () => {
    const cycler = (g: Duel) => g.rounds.length % g.n;
    expect(share(3, (g) => chooseThrow(g, 0, 'frequency'), cycler)).toBeLessThan(0.1);
    expect(share(3, (g) => chooseThrow(g, 0, 'meta'), cycler)).toBeGreaterThan(0.9);
    expect(
      share(
        3,
        (g) => chooseThrow(g, 0, 'meta'),
        (g) => chooseThrow(g, 1, 'markov'),
      ),
    ).toBeGreaterThan(0.75);
    expect(
      share(
        5,
        (g) => chooseThrow(g, 0, 'meta'),
        (g) => chooseThrow(g, 1, 'frequency'),
      ),
    ).toBeGreaterThan(0.85);
    // Nobody reads a random player.
    const r = share(
      3,
      (g) => chooseThrow(g, 0, 'meta'),
      (g) => chooseThrow(g, 1, 'random'),
      400,
    );
    expect(r).toBeGreaterThan(0.4);
    expect(r).toBeLessThan(0.6);
  });
});
