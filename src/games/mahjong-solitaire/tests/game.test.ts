import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { strategistAction, visibleFaces } from '../ai';
import { mahjongEnv } from '../ai-adapter';
import {
  CROSSROADS,
  PYRAMID,
  act,
  dealSolution,
  freePairs,
  isFree,
  isValidMahjong,
  legalActions,
  matches,
  newMahjong,
  tilesLeft,
  type MahjongGame,
} from '../engine';

describe('Mahjong solitaire rules', () => {
  it('layouts have whole groups of four and no floating tiles', () => {
    for (const def of [CROSSROADS, PYRAMID]) {
      expect(def.slots.length % 4).toBe(0);
      const at = new Set(def.slots.map((s) => `${s.x},${s.y},${s.z}`));
      expect(at.size).toBe(def.slots.length);
      expect(def.slots.every((s) => s.z === 0 || at.has(`${s.x},${s.y},${s.z - 1}`))).toBe(true);
    }
    expect(PYRAMID.slots).toHaveLength(144);
    expect(CROSSROADS.slots).toHaveLength(84);
  });

  it('a tile is free with nothing on top and an open side', () => {
    const all = () => true;
    const idx = (x: number, y: number, z: number) =>
      PYRAMID.slots.findIndex((s) => s.x === x && s.y === y && s.z === z);
    // A corner of the bottom layer: open on the left.
    expect(isFree(PYRAMID, all, idx(0, 0, 0))).toBe(true);
    // Inside the bottom row: both sides taken.
    expect(isFree(PYRAMID, all, idx(5, 0, 0))).toBe(false);
    // Covered by the layer above.
    expect(isFree(PYRAMID, all, idx(1, 1, 0))).toBe(false);
    // The top of the pyramid.
    expect(isFree(PYRAMID, all, idx(5, 2, 4))).toBe(true);
  });

  it('flowers match flowers, seasons match seasons, others only themselves', () => {
    expect(matches(34, 37)).toBe(true);
    expect(matches(38, 41)).toBe(true);
    expect(matches(34, 38)).toBe(false);
    expect(matches(5, 5)).toBe(true);
    expect(matches(5, 6)).toBe(false);
  });

  it('every deal can be cleared by the order it was built from', () => {
    for (const layout of ['crossroads', 'pyramid'])
      for (let seed = 1; seed <= 5; seed++) {
        let g = newMahjong(layout, seed);
        for (const [a, b] of dealSolution(layout, seed)) {
          const next = act(g, `pair:${a},${b}`);
          expect(next).not.toBe(g);
          g = next;
        }
        expect(g.phase).toBe('won');
        expect(tilesLeft(g)).toBe(0);
      }
  });

  it('shuffles are limited and keep the faces; saves replay', () => {
    let g = newMahjong('crossroads', 3);
    const before = [...g.faces].sort((a, b) => a - b);
    g = act(g, 'shuffle');
    expect(g.shuffles).toBe(2);
    expect([...g.faces].sort((a, b) => a - b)).toEqual(before);
    g = act(
      g,
      legalActions(g).find((a) => a.startsWith('pair:'))!,
    );
    expect(isValidMahjong(JSON.parse(JSON.stringify(g)))).toBe(true);
    expect(isValidMahjong({ ...g, shuffles: 3 })).toBe(false);
    const none: MahjongGame = { ...g, shuffles: 0 };
    expect(legalActions(none)).not.toContain('shuffle');
  });
});

describe('Mahjong solitaire players', () => {
  it('covered faces are hidden from the view', () => {
    const g = newMahjong('pyramid', 1);
    const seen = visibleFaces(g);
    // Every tile with another on top: one under each tile of layers 1–4 (40 + 16 + 12 + 4).
    expect(seen.filter((f) => f === -2)).toHaveLength(72);
  });

  it('the strategist clears most deals', () => {
    let won = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let g = newMahjong('crossroads', seed);
      while (g.phase === 'play') g = act(g, strategistAction(g));
      if (g.phase === 'won') won++;
      expect(freePairs(g).length === 0 || g.phase === 'won').toBe(true);
    }
    expect(won).toBeGreaterThanOrEqual(17);
  });
});

describeAdapterContract(mahjongEnv, {
  configs: [undefined, { layout: 'pyramid' }],
  playouts: 2,
  maxSteps: 2000,
  illegalActions: (g) => ['jump', 'pair:0,0'].filter((a) => !legalActions(g).includes(a)),
});
