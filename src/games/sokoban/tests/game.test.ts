import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyMove, sokobanActions, solverMove, solverPlan } from '../ai';
import { sokobanEnv } from '../ai-adapter';
import {
  TIERS,
  deadBoxes,
  isValidSokobanState,
  levelAt,
  levelCount,
  liveCells,
  newSokoban,
  parseLevel,
  solvePushes,
  stepPlayer,
  undo,
  walkTo,
} from '../engine';

describe('Sokoban levels', () => {
  it('parses the notation and keeps one crate per goal', () => {
    const w = parseLevel('#####|#@$.#|#####', 1);
    expect(w).toMatchObject({ width: 5, height: 3, boxes: [7], goals: [8], player: 6, pushes: 1 });
    for (const tier of TIERS) {
      expect(levelCount(tier)).toBeGreaterThanOrEqual(30);
      const w2 = levelAt(tier, 0);
      expect(w2.boxes.length).toBe(w2.goals.length);
    }
  });

  it(
    'every sampled level is solved by the solver in its stored number of pushes',
    { timeout: 60_000 },
    () => {
      for (const tier of TIERS)
        for (const i of [0, Math.floor(levelCount(tier) / 2), levelCount(tier) - 1]) {
          const w = levelAt(tier, i);
          expect(solvePushes(w, w.boxes, w.player, 2_000_000)).toHaveLength(w.pushes);
        }
    },
  );
});

describe('Sokoban play', () => {
  it('walks, pushes only into free cells, undoes and detects dead crates', () => {
    let s = newSokoban('easy', 0);
    const w = s.warehouse;
    expect(liveCells(w).size).toBeGreaterThan(w.goals.length);
    const before = s.player;
    const acts = sokobanActions(s);
    expect(acts.length).toBeGreaterThan(0);
    s = stepPlayer(s, acts[0] as 'U');
    expect(s.moves).toBe(1);
    s = undo(s);
    expect(s.player).toBe(before);
    expect(deadBoxes(s)).toEqual([]);
    const corner = parseLevel('#####|#$  #|# @.#|#####', 9);
    const st = {
      ...newSokoban('easy', 0),
      warehouse: corner,
      boxes: corner.boxes,
      player: corner.player,
    };
    expect(deadBoxes(st)).toEqual([6]);
    expect(walkTo(corner, corner.boxes, corner.player, 13)).toEqual(['R']);
  });

  it('the solver plan finishes the level in the fewest pushes', () => {
    let s = newSokoban('medium', 3);
    const plan = solverPlan(s)!;
    for (const d of plan) s = stepPlayer(s, d);
    expect(s.solved).toBe(true);
    expect(s.pushes).toBe(s.warehouse.pushes);
  });

  it('agents choose legal steps and saves validate', () => {
    let s = newSokoban('easy', 4);
    const rng = new Rng(3);
    for (let i = 0; i < 30 && !s.solved; i++) {
      const g = greedyMove(s, rng);
      expect(sokobanActions(s)).toContain(g);
      s = stepPlayer(s, g);
    }
    const t = stepPlayer(newSokoban('easy', 4), solverMove(newSokoban('easy', 4), rng));
    expect(isValidSokobanState(t)).toBe(true);
    expect(isValidSokobanState({ ...t, index: 9999 })).toBe(false);
    expect(isValidSokobanState({ ...t, boxes: [t.player, ...t.boxes.slice(1)] })).toBe(false);
    expect(isValidSokobanState({ ...t, solved: true })).toBe(false);
  });
});

describeAdapterContract(sokobanEnv, {
  configs: [undefined, { tier: 'medium', index: 2 }],
  playouts: 3,
  maxSteps: 650,
  illegalActions: (s) => ['X', 'up', ''].filter((a) => !sokobanActions(s).includes(a as 'U')),
});
