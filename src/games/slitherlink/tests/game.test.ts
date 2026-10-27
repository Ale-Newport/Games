import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { logicMove, slitherActions, solverMove } from '../ai';
import { slitherEnv } from '../ai-adapter';
import {
  CROSS,
  DIFFICULTIES,
  LINE,
  UNKNOWN,
  countSolutions,
  cycleEdge,
  generateSlither,
  geometry,
  isSingleLoop,
  isValidSlitherState,
  logicSolve,
  loopOf,
  newSlither,
  nextStep,
  redoMove,
  ruleBreaks,
  setEdges,
  undoMove,
} from '../engine';

describe('Slitherlink geometry and loops', () => {
  it('indexes edges, cells and vertices', () => {
    const geo = geometry(2, 3);
    expect(geo.edges).toBe(3 * 3 + 2 * 4);
    expect(geo.cellEdges[0]).toEqual([0, 3, 9, 10]);
    expect(geo.vertexEdges[0]).toHaveLength(2);
    expect(geo.vertexEdges[5]).toHaveLength(4);
  });

  it('turns a region into its boundary loop and checks it', () => {
    const geo = geometry(3, 3);
    const one = loopOf(geo, [false, false, false, false, true, false, false, false, false]);
    expect(isSingleLoop(geo, one)).toBe(true);
    expect(one.filter(Boolean)).toHaveLength(4);
    // Two separate squares are two loops.
    const two = loopOf(geo, [true, false, true, false, false, false, false, false, false]);
    expect(isSingleLoop(geo, two)).toBe(false);
  });

  it('generates puzzles with one loop the techniques draw, for every size', () => {
    for (const spec of Object.values(DIFFICULTIES)) {
      const p = generateSlither(spec, 5);
      const geo = geometry(p.rows, p.cols);
      expect(isSingleLoop(geo, p.solution)).toBe(true);
      p.clues.forEach((n, i) => {
        if (n !== null) expect(geo.cellEdges[i]!.filter((e) => p.solution[e]).length).toBe(n);
      });
      const r = countSolutions(geo, p.clues, 2);
      expect(r.count).toBe(1);
      expect(r.first).toEqual(p.solution);
      const g = logicSolve(geo, p.clues);
      expect(g.solved).toBe(true);
      expect(g.edges.map((s) => s === LINE)).toEqual(p.solution);
    }
  });

  it('explains steps that agree with the loop', () => {
    const p = generateSlither(DIFFICULTIES.hard!, 3);
    const geo = geometry(p.rows, p.cols);
    const edges = p.solution.map(() => UNKNOWN as 0 | 1 | 2);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const step = nextStep(geo, p.clues, edges);
      if (!step) break;
      seen.add(step.technique);
      for (const { edge, value } of step.set) {
        expect(value === LINE).toBe(p.solution[edge]);
        edges[edge] = value;
      }
    }
    expect(edges.every((s) => s !== UNKNOWN)).toBe(true);
    expect(seen.has('cell-count') && seen.has('vertex')).toBe(true);
  });
});

describe('Slitherlink play', () => {
  it('draws, crosses, undoes, flags breaks and saves', () => {
    let s = newSlither('easy', 4);
    const on = s.puzzle.solution.indexOf(true);
    const off = s.puzzle.solution.indexOf(false);
    expect(cycleEdge(UNKNOWN)).toBe(LINE);
    expect(cycleEdge(LINE)).toBe(CROSS);
    expect(cycleEdge(CROSS)).toBe(UNKNOWN);
    s = setEdges(s, [{ edge: off, value: LINE }]);
    expect(s.mistakes).toBe(1);
    s = undoMove(s);
    expect(s.edges[off]).toBe(UNKNOWN);
    s = redoMove(s);
    expect(s.edges[off]).toBe(LINE);
    s = setEdges(s, [{ edge: off, value: UNKNOWN }]);
    // Three lines at one dot is a break.
    const geo = geometry(s.puzzle.rows, s.puzzle.cols);
    const busy = geo.vertexEdges.find((es) => es.length >= 3)!;
    const broken = setEdges(
      s,
      busy.slice(0, 3).map((edge) => ({ edge, value: LINE })),
    );
    expect(ruleBreaks(broken).vertices.size).toBeGreaterThan(0);
    expect(isValidSlitherState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidSlitherState({ ...s, seed: s.seed + 1 })).toBe(false);
    s = setEdges(
      s,
      s.puzzle.solution.flatMap((x, edge) => (x ? [{ edge, value: LINE }] : [])),
    );
    expect(s.solved).toBe(true);
    expect(on).toBeGreaterThanOrEqual(0);
  });

  it('lets both solvers finish', () => {
    for (const move of [logicMove, solverMove]) {
      let s = newSlither('medium', 6);
      for (let i = 0; i < 300 && !s.solved; i++) s = slitherEnv.applyAction(s, move(s));
      expect(s.solved).toBe(true);
    }
  });
});

describeAdapterContract(slitherEnv, {
  configs: [undefined],
  playouts: 6,
  maxSteps: 200,
  illegalActions: (s) => ['9999:l', '0:q', 'x'].filter((a) => !slitherActions(s).includes(a)),
});
