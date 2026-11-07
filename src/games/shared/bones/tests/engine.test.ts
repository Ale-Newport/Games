import { describe, expect, it } from 'vitest';
import { heavyAction, plannerAction, sampleWorld } from '../ai';
import {
  ALL_FIVES,
  BLOCK,
  DRAW,
  TILES,
  act,
  fivesCount,
  isValidBones,
  legalActions,
  newBones,
  observe,
  openArms,
  pips,
  tileOf,
  type BonesGame,
  type Layout,
} from '../engine';
import { seedRng } from '../../../../core/game-engine/random';

const t = tileOf;
const layoutOf = (centre: number, arms: [number, number][][]): Layout => ({
  centre,
  arms: [0, 1, 2, 3].map((i) => (arms[i] ?? []).map(([tile, outer]) => ({ tile, outer }))),
});

describe('Dominoes deal and opening', () => {
  it('deals 7 each (5 each for 3–4 in draw games) and opens with the highest double', () => {
    const g = newBones(DRAW, 3, 5);
    expect(g.hands.map((h) => h.length)).toEqual([5, 5, 5]);
    expect(g.boneyard).toHaveLength(13);
    expect(new Set([...g.hands.flat(), ...g.boneyard]).size).toBe(28);
    const doubles = g.hands.flat().filter((x) => TILES[x]![0] === TILES[x]![1]);
    const top = Math.max(...doubles.map(pips));
    const legal = legalActions(g);
    expect(legal).toHaveLength(1);
    expect(pips(Number(legal[0]!.split(':')[1]))).toBe(top);
    expect(g.hands[g.turn]).toContain(Number(legal[0]!.split(':')[1]));
    expect(newBones(BLOCK, 4, 1).boneyard).toHaveLength(0);
  });
});

describe('Dominoes play', () => {
  it('matches open ends, draws when stuck, passes when the boneyard is empty', () => {
    const base = newBones(DRAW, 2, 1);
    let g: BonesGame = {
      ...base,
      hands: [[t(1, 2), t(0, 0)], [t(5, 5)]],
      boneyard: [t(3, 4), t(2, 6)],
      layout: layoutOf(t(6, 6), [[[t(6, 2), 2]], [[t(6, 1), 1]]]),
      turn: 0,
    };
    expect(legalActions(g)).toEqual([`play:${t(1, 2)}:0`, `play:${t(1, 2)}:1`]);
    g = act(g, `play:${t(1, 2)}:0`);
    expect(g.layout!.arms[0]!.at(-1)).toEqual({ tile: t(1, 2), outer: 1 });
    // Seat 1 holds 5-5 facing 1 and 1: it draws 3-4 (no fit), then 2-6 (no fit), then passes.
    expect(legalActions(g)).toEqual(['draw']);
    g = act(g, 'draw');
    expect(g.voids[1]).toEqual([1]);
    g = act(act(g, 'draw'), 'pass');
    expect(g.turn).toBe(0);
    expect(g.passes).toBe(1);
  });

  it('a block with nobody able to play goes to the lowest hand, which scores the difference', () => {
    const base = newBones(BLOCK, 2, 1);
    const g: BonesGame = {
      ...base,
      hands: [[t(0, 1)], [t(5, 6), t(4, 4)]],
      layout: layoutOf(t(3, 3), [[[t(3, 2), 2]], [[t(3, 2), 2]]]),
      turn: 0,
    };
    const end = act(act(g, 'pass'), 'pass');
    expect(end.phase).toBe('handOver');
    expect(end.event).toMatchObject({ kind: 'blocked', winner: 0, points: 19 - 1, pips: [1, 19] });
    expect(end.scores).toEqual([18, 0]);
    expect(legalActions(end)).toEqual(['next']);
    const next = act(end, 'next');
    // The winner leads the next hand with any tile.
    expect(next.turn).toBe(0);
    expect(legalActions(next)).toHaveLength(7);
  });

  it('going out scores the other hands; reaching the target ends the game', () => {
    const base = newBones(BLOCK, 3, 1);
    const g: BonesGame = {
      ...base,
      scores: [40, 0, 0],
      hands: [[t(2, 5)], [t(6, 6)], [t(4, 6)]],
      layout: layoutOf(t(2, 2), []),
      turn: 0,
    };
    const end = act(g, `play:${t(2, 5)}:0`);
    expect(end.event).toMatchObject({ kind: 'domino', winner: 0, points: 22 });
    expect(end.phase).toBe('over');
    expect(end.winner).toBe(0);
  });
});

describe('All fives', () => {
  it('counts open ends with doubles twice and the spinner whole until both sides are played', () => {
    expect(fivesCount(ALL_FIVES, layoutOf(t(5, 5), []))).toBe(10);
    // Spinner 5-5 with 5-0 on the right: the spinner (10) plus 0.
    expect(fivesCount(ALL_FIVES, layoutOf(t(5, 5), [[[t(5, 0), 0]]]))).toBe(10);
    // Both sides played: 0 + 3; the spinner no longer counts, and top/bottom open.
    const both = layoutOf(t(5, 5), [[[t(5, 0), 0]], [[t(5, 3), 3]]]);
    expect(fivesCount(ALL_FIVES, both)).toBe(3);
    expect(openArms(ALL_FIVES, both)).toEqual([0, 1, 2, 3]);
    // A double at an end counts both halves: 0 + 3-3 → 6, plus 5-2 on top → 8.
    const d = layoutOf(t(5, 5), [
      [[t(5, 0), 0]],
      [
        [t(5, 3), 3],
        [t(3, 3), 3],
      ],
      [[t(5, 2), 2]],
    ]);
    expect(fivesCount(ALL_FIVES, d)).toBe(0 + 6 + 2);
    // Without a spinner (draw games) only two arms are open.
    expect(openArms(DRAW, both)).toEqual([0, 1]);
  });

  it('scores a multiple of five at once', () => {
    const base = newBones(ALL_FIVES, 2, 1);
    const g: BonesGame = {
      ...base,
      hands: [[t(5, 0), t(1, 1)], [t(2, 2)]],
      layout: layoutOf(t(5, 5), []),
      turn: 0,
    };
    const next = act(g, `play:${t(5, 0)}:0`);
    expect(next.event).toEqual({ kind: 'fives', player: 0, points: 10 });
    expect(next.scores).toEqual([10, 0]);
  });
});

describe('Dominoes information and players', () => {
  it('observations hide the other hands and the boneyard; saves replay', () => {
    let g = newBones(DRAW, 2, 9);
    for (let i = 0; i < 6; i++) g = act(g, heavyAction(g));
    expect(g.phase).toBe('play');
    const view = observe(g, 0);
    expect(view.hands[1]!.every((x) => x === -1)).toBe(true);
    expect(view.boneyard.every((x) => x === -1)).toBe(true);
    expect(view.hands[0]).toEqual(g.hands[0]);
    expect(isValidBones(JSON.parse(JSON.stringify(g)), DRAW)).toBe(true);
    expect(isValidBones({ ...g, scores: [99, 0] }, DRAW)).toBe(false);
    expect(isValidBones(g, BLOCK)).toBe(false);
  });

  it('sampled deals respect hand sizes, unseen tiles and known voids', () => {
    let g = newBones(DRAW, 3, 4);
    for (let i = 0; i < 15 && g.phase === 'play'; i++) g = act(g, heavyAction(g));
    const view = observe(g, g.turn);
    const [world] = sampleWorld(
      { ...view, voids: view.voids.map((v, p) => (p === g.turn ? v : [6])) },
      g.turn,
      seedRng(3),
    );
    world.hands.forEach((h, p) => {
      expect(h).toHaveLength(g.hands[p]!.length);
      if (p !== g.turn) expect(h.every((x) => !TILES[x]!.includes(6))).toBe(true);
    });
    expect(world.hands[g.turn]).toEqual(g.hands[g.turn]);
    expect(new Set([...world.hands.flat(), ...world.boneyard]).size).toBe(
      world.hands.flat().length + world.boneyard.length,
    );
  });

  it('the planner beats the heavy player in block dominoes', () => {
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let g = newBones(BLOCK, 2, seed);
      const me = seed & 1;
      while (g.phase !== 'over')
        g = act(g, g.phase === 'play' && g.turn === me ? plannerAction(g) : heavyAction(g));
      if (g.winner === me) wins++;
    }
    // 88 of 100 in the benchmark.
    expect(wins).toBeGreaterThanOrEqual(14);
  });
});
