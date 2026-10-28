import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { hashiActions, logicMove, solverMove } from '../ai';
import { hashiEnv } from '../ai-adapter';
import {
  DIFFICULTIES,
  applyStep,
  connected,
  countSolutions,
  cycleBridge,
  freshBounds,
  generateHashi,
  hintStep,
  islandCounts,
  isValidHashiState,
  logicSolve,
  newHashi,
  nextStep,
  pairsOf,
  redoMove,
  setBridge,
  undoMove,
} from '../engine';

describe('Bridges rules', () => {
  it('finds facing islands and crossings', () => {
    // A plus: islands left/right and top/bottom of an empty centre.
    const { pairs, crossings } = pairsOf(3, 3, [1, 3, 5, 7]);
    expect(pairs).toHaveLength(2);
    expect(crossings[0]).toEqual([1]);
    expect(crossings[1]).toEqual([0]);
  });

  it('generates seas with one solution the techniques reach, for every size', () => {
    for (const spec of Object.values(DIFFICULTIES)) {
      const p = generateHashi(spec, 5);
      expect(p.islands.length).toBeGreaterThanOrEqual(Math.floor(spec.islands * 0.85));
      p.islands.forEach((isl, i) => {
        const sum = p.pairs.reduce(
          (s, q, j) => s + (q.a === i || q.b === i ? p.solution[j]! : 0),
          0,
        );
        expect(sum).toBe(isl.n);
      });
      p.pairs.forEach((_, q) => {
        if (p.solution[q]) for (const x of p.crossings[q]!) expect(p.solution[x]).toBe(0);
      });
      expect(connected(p, p.solution)).toBe(true);
      const r = countSolutions(p, 2);
      expect(r.count).toBe(1);
      expect(r.first).toEqual(p.solution);
      const g = logicSolve(p);
      expect(g.solved).toBe(true);
      expect(g.bounds.lo).toEqual(p.solution);
    }
  });

  it('only deduces what the solution agrees with', () => {
    const p = generateHashi(DIFFICULTIES.hard!, 3);
    const b = freshBounds(p);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const step = nextStep(p, b);
      if (!step) break;
      seen.add(step.technique);
      applyStep(b, step);
      b.lo.forEach((l, q) => {
        expect(p.solution[q]!).toBeGreaterThanOrEqual(l);
        expect(p.solution[q]!).toBeLessThanOrEqual(b.hi[q]!);
      });
    }
    expect(seen.has('at-least') || seen.has('full')).toBe(true);
  });
});

describe('Bridges play', () => {
  it('cycles bridges, refuses crossings, undoes, counts mistakes and saves', () => {
    let s = newHashi('easy', 4);
    const q = s.puzzle.solution.findIndex((n) => n > 0);
    s = cycleBridge(s, q);
    expect(s.bridges[q]).toBe(1);
    s = cycleBridge(cycleBridge(s, q), q);
    expect(s.bridges[q]).toBe(0);
    s = undoMove(s);
    expect(s.bridges[q]).toBe(2);
    s = redoMove(s);
    expect(s.bridges[q]).toBe(0);
    const crossing = s.puzzle.crossings.findIndex((c) => c.length);
    if (crossing >= 0) {
      const t = setBridge(s, crossing, 1);
      expect(setBridge(t, s.puzzle.crossings[crossing]![0]!, 1)).toBe(t);
    }
    const empty = s.puzzle.solution.findIndex((n) => n === 0);
    if (empty >= 0 && !s.puzzle.crossings[empty]!.length) {
      expect(setBridge(s, empty, 1).mistakes).toBe(1);
    }
    expect(isValidHashiState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidHashiState({ ...s, seed: s.seed + 1 })).toBe(false);
    for (let i = 0; i < s.puzzle.pairs.length; i++) s = setBridge(s, i, s.puzzle.solution[i]!);
    expect(s.solved).toBe(true);
    expect(islandCounts(s)).toEqual(s.puzzle.islands.map((x) => x.n));
  });

  it('gives a hint that matches the solution and lets both solvers finish', () => {
    const s0 = newHashi('medium', 6);
    const h = hintStep(s0)!;
    expect(h.count).toBeLessThanOrEqual(s0.puzzle.solution[h.pair]!);
    for (const move of [logicMove, solverMove]) {
      let s = s0;
      for (let i = 0; i < 200 && !s.solved; i++) s = hashiEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
    }
  });
});

describeAdapterContract(hashiEnv, {
  configs: [undefined, { difficulty: 'hard' }],
  playouts: 8,
  maxSteps: 200,
  illegalActions: (s) => ['999:1', '0:3', 'x'].filter((a) => !hashiActions(s).includes(a)),
});
