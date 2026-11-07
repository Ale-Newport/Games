import { describe, expect, it } from 'vitest';
import {
  CLOSING,
  COLS,
  ROWS,
  SPIRAL,
  flameCells,
  idx,
  newArena,
  rookieFor,
  stepArena,
  stepWithComputers,
  tacticianFor,
  type Arena,
  type BlastAction,
} from '../sim';

/** An arena with no crates and only seats 0 and 1 in play (the others out). */
const open = (s: Arena): Arena => ({
  ...s,
  grid: s.grid.map((c) => (c === '+' ? ' ' : c)),
  powers: {},
  blasters: s.blasters.map((b, i) => (i > 1 ? { ...b, alive: false } : b)),
});
const run = (s: Arena, a: BlastAction[], n: number) => {
  let t = s;
  for (let i = 0; i < n && !t.pause; i++) t = stepArena(t, a);
  return t;
};
function play(seed: number, policy: (s: Arena) => BlastAction, cap: number) {
  let s = newArena(seed);
  while (!s.over && s.steps < cap) s = stepWithComputers(s, policy(s));
  return s;
}

describe('Blast Arena', () => {
  it('pillars on the even cells, crates elsewhere, the corners left clear', () => {
    const s = newArena(1);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (r % 2 === 0 && c % 2 === 0) expect(s.grid[idx(c, r)]).toBe('#');
    expect(s.grid.filter((c) => c === '+').length).toBeGreaterThan(40);
    for (const b of s.blasters) {
      expect(s.grid[b.at]).toBe(' ');
      expect(s.grid[b.at + 1] === ' ' || s.grid[b.at - 1] === ' ').toBe(true);
    }
    for (const k of Object.keys(s.powers)) expect(s.grid[Number(k)]).toBe('+');
  });

  it('a walk from cell to cell takes its pace; walls, crates and bombs block', () => {
    let s = open(newArena(1));
    s = stepArena(s, ['right', 'idle', 'idle', 'idle']);
    expect(s.blasters[0]!.to).toBe(idx(2, 1));
    s = run(s, ['idle', 'idle', 'idle', 'idle'], 14);
    expect(s.blasters[0]!.at).toBe(idx(2, 1));
    const blocked = stepArena(s, ['down', 'idle', 'idle', 'idle']);
    expect(blocked.blasters[0]!.to).toBeNull();
  });

  it('a bomb bursts into a cross stopped by pillars and the first crate, and sets off others', () => {
    const s = newArena(1);
    const cells = flameCells(s, idx(1, 1), 2);
    expect(cells).toContain(idx(1, 1));
    expect(cells).not.toContain(idx(0, 1));
    let t: Arena = {
      ...open(newArena(1)),
      bombs: [
        { at: idx(3, 1), owner: 1, fuse: 1, flame: 2 },
        { at: idx(5, 1), owner: 1, fuse: 999, flame: 2 },
      ],
    };
    t = stepArena(t, ['idle', 'idle', 'idle', 'idle']);
    expect(t.bombs).toHaveLength(0);
    expect(t.fire[idx(7, 1)]).toBeDefined();
  });

  it('flame takes a blaster out; the last one standing wins the round, two rounds the match', () => {
    let s: Arena = {
      ...open(newArena(1)),
      bombs: [{ at: idx(1, 1), owner: 1, fuse: 1, flame: 2 }],
    };
    s = stepArena(s, ['idle', 'idle', 'idle', 'idle']);
    expect(s.blasters[0]!.alive).toBe(false);
    expect(s.roundWinner).toBe(1);
    expect(s.blasters[1]!.wins).toBe(1);
    let m: Arena = { ...s, blasters: s.blasters.map((b, i) => (i === 1 ? { ...b, wins: 2 } : b)) };
    for (let i = 0; i < 150; i++) m = stepArena(m, ['idle', 'idle', 'idle', 'idle']);
    expect(m.over).toBe(true);
    let next = s;
    for (let i = 0; i < 150; i++) next = stepArena(next, ['idle', 'idle', 'idle', 'idle']);
    expect(next.round).toBe(2);
    expect(next.blasters.every((b) => b.alive)).toBe(true);
  });

  it('power-ups add a bomb, a longer flame or speed', () => {
    let s = open(newArena(1));
    s = { ...s, powers: { [idx(2, 1)]: 'flame' } };
    s = run(stepArena(s, ['right', 'idle', 'idle', 'idle']), ['idle', 'idle', 'idle', 'idle'], 14);
    expect(s.blasters[0]!.flame).toBe(3);
    expect(s.powers[idx(2, 1)]).toBeUndefined();
  });

  it('in the last 40 seconds the arena closes in, spiralling inwards', () => {
    let s = open(newArena(1));
    s = { ...s, time: CLOSING + 1 };
    s = run(s, ['idle', 'idle', 'idle', 'idle'], 2);
    expect(s.grid[SPIRAL[0]!]).toBe('#');
    expect(SPIRAL[0]).toBe(idx(1, 1));
    // Seat 0 started there.
    expect(s.blasters[0]!.alive).toBe(false);
  });

  it('the tactician wins rounds; the rookie and an idle player do not', () => {
    let tactician = 0;
    let rookie = 0;
    for (let seed = 1; seed <= 10; seed++) {
      tactician += play(seed, (s) => tacticianFor(s, 0), 60 * 60 * 5).blasters[0]!.wins;
      rookie += play(seed, (s) => rookieFor(s, 0), 60 * 60 * 5).blasters[0]!.wins;
    }
    expect(tactician).toBeGreaterThan(rookie);
    expect(play(1, () => 'idle', 60 * 60 * 5).blasters[0]!.wins).toBeLessThan(2);
  }, 120_000);

  it('replays exactly from a seed', () => {
    expect(play(5, (s) => tacticianFor(s, 0), 3000)).toEqual(
      play(5, (s) => tacticianFor(s, 0), 3000),
    );
  }, 60_000);
});
