import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  CRAM,
  DOMINEERING,
  applyDominoAction,
  createDominoState,
  isValidDominoState,
  legalDominoActions,
  type DominoVariant,
} from '../engine';
import { createDominoEnv, dominoCodec } from '../environment';
import { DominoSearchAgent } from '../search';

/** Exact value for the side to move of an empty board (positive: the mover wins). */
function solve(v: DominoVariant, first: 0 | 1 = 0): number {
  const env = createDominoEnv(v, { id: v.id, version: '1', rulesetId: v.id });
  const agent = new DominoSearchAgent(v, { id: 'x', label: 'x', maxDepth: 99 });
  const s = createDominoState(v, first);
  agent.selectAction(env, s, first, { rng: new Rng(1) });
  return agent.lastStats!.value!;
}

describe('domino engine', () => {
  it('counts the opening placements of each variant', () => {
    expect(legalDominoActions(DOMINEERING, createDominoState(DOMINEERING, 0))).toHaveLength(56);
    expect(
      legalDominoActions(DOMINEERING, createDominoState(DOMINEERING, 1)).every((a) =>
        a.endsWith('h'),
      ),
    ).toBe(true);
    expect(legalDominoActions(CRAM, createDominoState(CRAM))).toHaveLength(24 + 25);
  });

  it('covers two cells, blocks overlaps, and ends when the next player is stuck', () => {
    const tiny: DominoVariant = { id: 't', rows: 2, cols: 2, allowed: [['v'], ['h']] };
    const s = applyDominoAction(tiny, createDominoState(tiny, 0), '0,0,v');
    expect(s.cells).toEqual([0, -1, 0, -1]);
    // Horizontal has no two free cells side by side: vertical wins at once.
    expect(s.result).toEqual({ winner: 0 });
    const cram = applyDominoAction(CRAM, createDominoState(CRAM), '0,0,h');
    expect(legalDominoActions(CRAM, cram)).not.toContain('0,1,v');
    expect(() => applyDominoAction(CRAM, cram, '0,1,h')).toThrow();
  });

  it('validates by replay and encodes placements uniquely', () => {
    const s = applyDominoAction(DOMINEERING, createDominoState(DOMINEERING, 1), '3,3,h');
    expect(isValidDominoState(DOMINEERING, JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidDominoState(DOMINEERING, { ...s, toMove: 1 })).toBe(false);
    const codec = dominoCodec(DOMINEERING);
    for (const a of ['0,0,v', '6,7,v', '7,6,h', '3,3,h'])
      expect(codec.decode(codec.encode(a))).toBe(a);
  });
});

describe('domino search (checked against known small cases)', () => {
  it('Cram: even × even boards are second-player wins, even × odd first-player wins', () => {
    const cram = (rows: number, cols: number): DominoVariant => ({ ...CRAM, rows, cols });
    expect(solve(cram(2, 2))).toBeLessThan(0);
    expect(solve(cram(2, 4))).toBeLessThan(0);
    expect(solve(cram(4, 4))).toBeLessThan(0);
    expect(solve(cram(2, 3))).toBeGreaterThan(0);
    expect(solve(cram(3, 4))).toBeGreaterThan(0);
  });

  it('Domineering: on a 2 × 2 board and a 3 × 3 board the first player wins', () => {
    const dom = (rows: number, cols: number): DominoVariant => ({ ...DOMINEERING, rows, cols });
    expect(solve(dom(2, 2), 0)).toBeGreaterThan(0);
    expect(solve(dom(2, 2), 1)).toBeGreaterThan(0);
    expect(solve(dom(3, 3), 0)).toBeGreaterThan(0);
    expect(solve(dom(3, 3), 1)).toBeGreaterThan(0);
  });
});
