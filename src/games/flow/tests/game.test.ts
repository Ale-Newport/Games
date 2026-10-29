import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { Rng } from '../../../core/game-engine/random';
import { greedyMove, linkActions, solverMove } from '../ai';
import { linkEnv } from '../ai-adapter';
import {
  SPECS,
  extendStroke,
  generateLinks,
  hintColor,
  isSolved,
  isValidLinkState,
  joined,
  neighbours,
  newLinks,
  revealPath,
  startStroke,
} from '../engine';

describe('Color Links generator', () => {
  it('cuts a full path into stretches of three or more cells, one per color', () => {
    for (const level of Object.keys(SPECS)) {
      const p = generateLinks(level, 4);
      const n = p.size;
      expect(p.pairs).toHaveLength(SPECS[level]!.colors);
      const cells = p.solution.flat();
      expect(new Set(cells).size).toBe(n * n);
      p.solution.forEach((s, k) => {
        expect(s.length).toBeGreaterThanOrEqual(3);
        expect([s[0], s[s.length - 1]]).toEqual(p.pairs[k]);
        s.slice(1).forEach((c, i) => expect(neighbours(n, s[i]!)).toContain(c));
      });
      expect(isSolved(p, p.solution)).toBe(true);
      expect(generateLinks(level, 4)).toEqual(p);
    }
  });
});

describe('Color Links drawing', () => {
  it('starts from dots, extends, cuts its own path and other colors, and finishes', () => {
    let s = newLinks('easy', 6);
    const ref = s.puzzle.solution[0]!;
    let r = startStroke(s, ref[0]!);
    expect(r.color).toBe(0);
    s = r.state;
    for (const c of ref.slice(1, 3)) s = extendStroke(s, 0, c);
    expect(s.paths[0]).toEqual(ref.slice(0, 3));
    s = extendStroke(s, 0, ref[1]!);
    expect(s.paths[0]).toEqual(ref.slice(0, 2));
    r = startStroke(s, ref[1]!);
    expect(r.state.paths[0]).toEqual(ref.slice(0, 2));
    // Revealing another color's path cuts color 0 where they overlap.
    for (let k = 0; k < s.puzzle.pairs.length; k++) s = revealPath(s, k);
    expect(s.solved).toBe(true);
    expect(s.hints).toBe(s.puzzle.pairs.length);
  });

  it('hints pick a color that differs from the reference', () => {
    const s = newLinks('medium', 2);
    const k = hintColor(s);
    expect(joined(s.puzzle, k, revealPath(s, k).paths[k]!)).toBe(true);
  });

  it('the solver and greedy agents act legally; saves validate', () => {
    let s = newLinks('easy', 9);
    while (!s.solved) {
      const a = solverMove(s);
      expect(linkActions(s)).toContain(a);
      s = linkEnv.applyAction(s, a);
    }
    let g = newLinks('medium', 9);
    const rng = new Rng(4);
    while (linkActions(g).length) g = linkEnv.applyAction(g, greedyMove(g, rng));
    const t = startStroke(newLinks('easy', 9), newLinks('easy', 9).puzzle.pairs[1]![0]).state;
    expect(isValidLinkState(t)).toBe(true);
    expect(isValidLinkState({ ...t, paths: t.paths.map(() => [0, 2]) })).toBe(false);
    expect(isValidLinkState({ ...t, solved: true })).toBe(false);
  });
});

describeAdapterContract(linkEnv, {
  configs: [undefined, { level: 'medium' }],
  playouts: 4,
  maxSteps: 100,
  illegalActions: (s) => ['0:999', '99:0', 'x'].filter((a) => !linkActions(s).includes(a)),
});
