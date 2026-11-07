import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { chooseAction } from '../ai';
import { riichiEnv } from '../ai-adapter';
import {
  act,
  canRon,
  claimOptions,
  decider,
  isValidRiichi,
  legalActions,
  newRiichi,
  observe,
  type RiichiGame,
} from '../engine';
import { kindOf } from '../tiles';

/** Tile ids for kinds, taking the next unused copy of each. */
function ids(kinds: number[], used = new Map<number, number>()): number[] {
  return kinds.map((k) => {
    const n = used.get(k) ?? 0;
    used.set(k, n + 1);
    return k * 4 + n;
  });
}

describe('Riichi deal and turns', () => {
  it('deals 13 each, the dealer draws a 14th, 70 tiles in the live wall', () => {
    const g = newRiichi(3);
    expect(g.tiles.map((h) => h.length)).toEqual([14, 13, 13, 13]);
    expect(g.wall).toHaveLength(69);
    expect(g.dead).toHaveLength(14);
    expect(new Set([...g.tiles.flat(), ...g.wall, ...g.dead]).size).toBe(136);
    expect(legalActions(g).filter((a) => a.startsWith('discard:'))).toHaveLength(14);
  });

  it('observations hide the other hands and the walls', () => {
    const g = newRiichi(3);
    const view = observe(g, 1);
    expect(view.tiles[0]!.every((t) => t === -1)).toBe(true);
    expect(view.tiles[1]).toEqual(g.tiles[1]);
    expect(view.wall.every((t) => t === -1)).toBe(true);
    expect(view.dead.filter((t) => t >= 0)).toHaveLength(1);
  });

  it('complete games end with the points conserved and replay', () => {
    for (const seed of [1, 2]) {
      let g = newRiichi(seed);
      for (let i = 0; i < 6000 && g.phase !== 'over'; i++)
        g = act(g, g.phase === 'handOver' ? 'next' : chooseAction(g, seed === 2));
      expect(g.phase).toBe('over');
      expect(g.scores.reduce((a, b) => a + b, 0) + g.sticks * 1000).toBe(100_000);
      expect(isValidRiichi(JSON.parse(JSON.stringify(g)))).toBe(true);
      expect(isValidRiichi({ ...g, scores: [100_000, 0, 0, 0] })).toBe(false);
    }
  });
});

describe('Riichi rules', () => {
  /** Seat 1 ready on 2p–5p (two-sided): 34p 123s 456s 789s 11m. */
  function readyGame(): RiichiGame {
    const used = new Map<number, number>();
    const g = newRiichi(5);
    const seat1 = ids([2, 3, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18], used);
    const discard = ids([4], used)[0]!;
    return {
      ...g,
      tiles: [g.tiles[0]!.filter((t) => !seat1.includes(t) && t !== discard), seat1, [], []],
      claim: null,
      phase: 'discard',
      turn: 0,
    };
  }

  it('ron on a ready hand; furiten when a wait is among your own discards', () => {
    const g = readyGame();
    const fiveP = 4 * 4 + 1;
    expect(canRon(g, 1, fiveP)).toBe(true);
    const furiten: RiichiGame = {
      ...g,
      discards: g.discards.map((d, i) =>
        i === 1 ? [{ tile: 4, called: false, riichi: false }] : d,
      ),
    };
    // A 2p (kind 1) among seat 1's discards: furiten on every wait.
    expect(canRon(furiten, 1, fiveP)).toBe(false);
  });

  it('chi only from the player before you; pon from anyone', () => {
    const g = readyGame();
    const twoS = 10 * 4 + 3;
    // Seat 1 holds 1s and 3s: chi on a 2s discarded by seat 0, not by seat 3.
    expect(claimOptions(g, 1, twoS, 0, 'discard').some((a) => a.startsWith('chi:'))).toBe(true);
    expect(claimOptions(g, 1, twoS, 3, 'discard').some((a) => a.startsWith('chi:'))).toBe(false);
    const oneM = 18 * 4 + 3;
    expect(claimOptions(g, 1, oneM, 2, 'discard')).toContain('pon');
  });

  it('after riichi the drawn tile is discarded (or the hand won)', () => {
    let g = newRiichi(11);
    // Play until somebody declares riichi.
    for (let i = 0; i < 4000 && !g.riichi.some(Boolean) && g.phase !== 'over'; i++)
      g = act(g, g.phase === 'handOver' ? 'next' : chooseAction(g, false));
    const seat = g.riichi.findIndex(Boolean);
    expect(seat).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 400 && g.phase !== 'handOver' && g.phase !== 'over'; i++) {
      if (g.phase === 'discard' && g.turn === seat) {
        const discards = legalActions(g).filter((a) => a.startsWith('discard:'));
        expect(discards).toEqual([`discard:${g.drawn}`]);
        expect(legalActions(g).some((a) => a.startsWith('riichi:') || a.startsWith('ankan:'))).toBe(
          false,
        );
      }
      g = act(g, chooseAction(g, false));
    }
  });

  it('claims are decided seat by seat; the current decider is the first in the queue', () => {
    let g = newRiichi(7);
    for (let i = 0; i < 2000 && g.phase !== 'claim'; i++)
      g = act(g, g.phase === 'handOver' ? 'next' : chooseAction(g, false));
    expect(g.phase).toBe('claim');
    expect(decider(g)).toBe(g.claim!.queue[0]);
    expect(legalActions(g)).toContain('pass');
    expect(kindOf(g.claim!.tile)).toBe(kindOf(g.discards[g.claim!.from]!.at(-1)!.tile));
  });
});

describeAdapterContract(riichiEnv, {
  configs: [undefined],
  playouts: 1,
  maxSteps: 30000,
  illegalActions: (g) => ['jump', 'discard:999', 'ron'].filter((a) => !legalActions(g).includes(a)),
});
