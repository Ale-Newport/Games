import { describe, expect, it } from 'vitest';
import {
  CLASSIC,
  N,
  neighbour,
  newSnake,
  pace,
  pathfinderPolicy,
  stepSnake,
  WRAPAROUND,
  type Snake,
} from '../sim';

/** Advances to the next move with one action. */
const move = (rules: typeof CLASSIC, s: Snake, a: Parameters<typeof stepSnake>[2]) => {
  let t = stepSnake(rules, s, a);
  while (t.timer !== pace(t.eaten) && !t.over) t = stepSnake(rules, t, 'idle');
  return t;
};

describe('Snake simulation', () => {
  it('moves a cell per beat and turns, but never straight back', () => {
    const s = newSnake(CLASSIC, 1);
    const head = s.body[0]!;
    const t = move(CLASSIC, s, 'left');
    expect(t.body[0]).toBe(head + 1);
    const u = move(CLASSIC, t, 'up');
    expect(u.body[0]).toBe(head + 1 - N);
    expect(u.body).toHaveLength(3);
  });

  it('eating grows the snake and scores; the pace quickens', () => {
    const s0 = newSnake(CLASSIC, 2);
    const s: Snake = { ...s0, apple: s0.body[0]! + 1, timer: 1 };
    const t = stepSnake(CLASSIC, s, 'idle');
    expect(t.body).toHaveLength(4);
    expect(t.score).toBe(10);
    expect(t.apple).not.toBe(s.apple);
    expect(pace(0)).toBeGreaterThan(pace(20));
  });

  it('walls kill in the classic game and wrap around in the other', () => {
    const edge = (rules: typeof CLASSIC): Snake => ({
      ...newSnake(rules, 3),
      body: [N * 5 + N - 1, N * 5 + N - 2, N * 5 + N - 3],
      dir: 'right',
      next: 'right',
      timer: 1,
      apple: 0,
    });
    expect(stepSnake(CLASSIC, edge(CLASSIC), 'idle').over).toBe(true);
    const w = stepSnake(WRAPAROUND, edge(WRAPAROUND), 'idle');
    expect(w.over).toBe(false);
    expect(w.body[0]).toBe(N * 5);
    expect(neighbour(0, 'up', true)).toBe((N - 1) * N);
  });

  it('biting itself ends the run', () => {
    const body = [N * 5 + 5, N * 5 + 6, N * 6 + 6, N * 6 + 5, N * 6 + 4];
    const s: Snake = {
      ...newSnake(CLASSIC, 4),
      body,
      dir: 'left',
      next: 'down',
      timer: 1,
      apple: 0,
    };
    expect(stepSnake(CLASSIC, s, 'idle').over).toBe(true);
  });

  it('blocks appear every fifth apple in the wraparound game; a sprint runs out', () => {
    const s0 = newSnake(WRAPAROUND, 5);
    const s: Snake = { ...s0, eaten: 4, apple: s0.body[0]! + 1, timer: 1 };
    expect(stepSnake(WRAPAROUND, s, 'idle').blocks).toHaveLength(1);
    let t = newSnake(WRAPAROUND, 6, 10);
    for (let i = 0; i < 12; i++) t = stepSnake(WRAPAROUND, t, 'idle');
    expect(t.over).toBe(true);
    expect(t.events).toContain('time');
  });

  it('the pathfinder grows long without crashing early', () => {
    let s = newSnake(CLASSIC, 7);
    while (!s.over && s.steps < 60 * 60) s = stepSnake(CLASSIC, s, pathfinderPolicy(CLASSIC, s));
    expect(s.body.length).toBeGreaterThan(25);
  });
});
