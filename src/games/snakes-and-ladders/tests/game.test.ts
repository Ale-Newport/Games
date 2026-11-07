import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { naiveAction, plannedAction, turnsLeft } from '../ai';
import { snakesEnv } from '../ai-adapter';
import { LADDERS, SNAKES, cellOf, expectedTurns, land } from '../engine';
import { act, isValidSnakes, legalActions, newSnakes, type SnakesGame } from '../match';

describe('Snakes and Ladders board', () => {
  it('numbers the board in a boustrophedon from the bottom left', () => {
    expect(cellOf(1)).toEqual([9, 0]);
    expect(cellOf(10)).toEqual([9, 9]);
    expect(cellOf(11)).toEqual([8, 9]);
    expect(cellOf(100)).toEqual([0, 0]);
  });

  it('ladders go up, snakes go down, and 100 needs the exact throw', () => {
    for (const [foot, top] of Object.entries(LADDERS)) expect(top).toBeGreaterThan(Number(foot));
    for (const [head, tail] of Object.entries(SNAKES)) expect(tail).toBeLessThan(Number(head));
    expect(land(2, 1)).toBe(22);
    expect(land(16, 1)).toBe(7);
    expect(land(97, 5)).toBe(97);
    expect(land(96, 4)).toBe(100);
  });

  it('expects about 35 turns with one die and 15 when choosing between two', () => {
    const { choice, classic } = expectedTurns();
    expect(classic[0]).toBeGreaterThan(30);
    expect(classic[0]).toBeLessThan(40);
    expect(choice[0]).toBeGreaterThan(12);
    expect(choice[0]).toBeLessThan(18);
    expect(choice[100]).toBe(0);
  });
});

describe('Snakes and Ladders play', () => {
  it('classic rolls move at once; Choice asks for a die', () => {
    let c = newSnakes('classic', 2, 4);
    c = act(c, 'roll');
    expect(c.turn).toBe(1);
    expect(c.pos[0]).toBeGreaterThan(0);
    let g = newSnakes('choice', 2, 4);
    g = act(g, 'roll');
    expect(g.phase).toBe('choose');
    expect(g.dice).toHaveLength(2);
    const before = g.pos[0]!;
    g = act(g, legalActions(g)[0]!);
    expect(g.pos[0]).not.toBe(before);
    expect(isValidSnakes(g)).toBe(true);
    expect(isValidSnakes({ ...g, pos: [99, 0] })).toBe(false);
  });

  it('the planner prefers the die that avoids a snake, and beats the big-step player', () => {
    const s: SnakesGame = {
      ...newSnakes('choice', 2, 1),
      pos: [15, 0],
      dice: [2, 6],
      phase: 'choose',
    };
    // 15 + 2 = 17 is a snake's head; 15 + 6 = 21 is a ladder's foot.
    expect(plannedAction(s)).toBe('use:1');
    expect(naiveAction(s)).toBe('use:1');
    const t: SnakesGame = { ...s, pos: [89, 0], dice: [4, 3] };
    // 93 is a snake's head, 92 is not: the planner avoids it, the big step does not.
    expect(plannedAction(t)).toBe('use:1');
    expect(naiveAction(t)).toBe('use:0');
    expect(turnsLeft()[94]).toBeLessThan(turnsLeft()[68]!);
    let wins = 0;
    for (let seed = 1; seed <= 60; seed++) {
      let g = newSnakes('choice', 2, seed);
      while (g.phase !== 'over') g = act(g, g.turn === 0 ? plannedAction(g) : naiveAction(g));
      if (g.winner === 0) wins++;
    }
    expect(wins).toBeGreaterThan(30);
  });
});

describeAdapterContract(snakesEnv, {
  configs: [undefined, { variant: 'classic', players: 4 }],
  playouts: 3,
  maxSteps: 4000,
  illegalActions: (g) => ['use:2', 'jump', 'use:1'].filter((a) => !legalActions(g).includes(a)),
});
