import { describe, expect, it } from 'vitest';
import {
  COLS,
  MOVE,
  ROWS,
  cruiserFor,
  idx,
  newTrails,
  stepTrails,
  stepWithRivals,
  strategistFor,
  type TrailAction,
  type Trails,
} from '../sim';

const moves = (s: Trails, acts: TrailAction[], n: number) => {
  let t = s;
  for (let i = 0; i < n * MOVE && !t.pause; i++) t = stepTrails(t, acts);
  return t;
};
function play(seed: number, rivals: number, policy: (s: Trails) => TrailAction, cap: number) {
  let s = newTrails(seed, rivals);
  while (!s.over && s.steps < cap) s = stepWithRivals(s, policy(s));
  return s;
}

describe('Neon Trails', () => {
  it('racers move a cell every four steps, leaving a trail; turning straight back is ignored', () => {
    let s = newTrails(1);
    const start = s.racers[0]!.at;
    s = moves(s, ['idle', 'idle'], 3);
    expect(s.racers[0]!.at).toBe(start + 3);
    expect(s.grid[start]).toBe(1);
    expect(s.grid[start + 1]).toBe(1);
    s = moves(s, ['left', 'idle'], 1);
    expect(s.racers[0]!.heading).toBe('right');
    s = moves(s, ['up', 'idle'], 1);
    expect(s.racers[0]!.at).toBe(start + 4 - COLS);
  });

  it('a racer hitting a trail or the edge is out, and the last one moving wins the round', () => {
    let s = newTrails(1);
    // Steer the player into the top edge.
    s = moves(s, ['up', 'idle'], ROWS);
    expect(s.racers[0]!.alive).toBe(false);
    expect(s.roundWinner).toBe(1);
    expect(s.racers[1]!.wins).toBe(1);
    const t0 = newTrails(1);
    let t: Trails = { ...t0, grid: t0.grid.map((v, i) => (i === t0.racers[0]!.at + 1 ? 2 : v)) };
    t = moves(t, ['idle', 'idle'], 1);
    expect(t.racers[0]!.alive).toBe(false);
  });

  it('head-on, both go out: a draw', () => {
    const s0 = newTrails(1);
    const a = idx(10, 10);
    let s: Trails = {
      ...s0,
      grid: s0.grid.map(() => 0),
      racers: [
        { ...s0.racers[0]!, at: a, heading: 'right', next: 'right' },
        { ...s0.racers[1]!, at: a + 2, heading: 'left', next: 'left' },
      ],
    };
    s = moves(s, ['idle', 'idle'], 1);
    expect(s.racers.every((r) => !r.alive)).toBe(true);
    expect(s.roundWinner).toBe(-1);
  });

  it('three round wins take the match', () => {
    let s = newTrails(1);
    s = { ...s, racers: s.racers.map((r, i) => (i === 1 ? { ...r, wins: 2 } : r)) };
    s = moves(s, ['up', 'idle'], ROWS);
    for (let i = 0; i < 120; i++) s = stepTrails(s, ['idle', 'idle']);
    expect(s.over).toBe(true);
  });

  it('three rivals start in four corners, apart', () => {
    const s = newTrails(2, 3);
    expect(s.racers).toHaveLength(4);
    expect(new Set(s.racers.map((r) => r.at)).size).toBe(4);
  });

  it('the strategist outlasts the cruiser; standing by wins nothing', () => {
    let strategist = 0;
    let cruiser = 0;
    for (let seed = 1; seed <= 4; seed++) {
      strategist += play(seed, 1, (s) => strategistFor(s, 0), 60 * 60 * 4).racers[0]!.wins;
      cruiser += play(seed, 1, (s) => cruiserFor(s, 0), 60 * 60 * 4).racers[0]!.wins;
    }
    expect(strategist).toBeGreaterThan(cruiser);
    expect(play(1, 1, () => 'idle', 60 * 60 * 4).racers[0]!.wins).toBe(0);
  }, 120_000);

  it('replays exactly from a seed', () => {
    expect(play(3, 3, (s) => strategistFor(s, 0), 2000)).toEqual(
      play(3, 3, (s) => strategistFor(s, 0), 2000),
    );
  }, 60_000);
});
