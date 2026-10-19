import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  createMnkState,
  legalCells,
  playCell,
  stateFromHistory,
  type MnkRules,
  type MnkState,
} from '../engine';
import { MnkSolver, buildSymmetries } from '../solver';

/** Plain negamax without any pruning tricks: the reference the fast solver must agree with. */
function naiveValue(rules: MnkRules, s: MnkState, memo = new Map<string, number>()): number {
  if (s.result) return s.result.kind === 'draw' ? 0 : s.result.winner === s.toMove ? 1 : -1;
  const key = s.board.join('');
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  let best = -1;
  for (const c of legalCells(rules, s))
    best = Math.max(best, 0 - naiveValue(rules, playCell(rules, s, c), memo) || 0);
  memo.set(key, best);
  return best;
}

function allPositions(rules: MnkRules): MnkState[] {
  const seen = new Map<string, MnkState>();
  const visit = (s: MnkState) => {
    const key = s.board.join('');
    if (seen.has(key)) return;
    seen.set(key, s);
    for (const c of legalCells(rules, s)) visit(playCell(rules, s, c));
  };
  visit(createMnkState(rules));
  return [...seen.values()];
}

describe('MnkSolver', () => {
  it('builds valid symmetry permutations', () => {
    for (const [r, c, n] of [
      [3, 3, 8],
      [4, 4, 8],
      [3, 4, 4],
    ] as const) {
      const perms = buildSymmetries(r, c);
      expect(perms).toHaveLength(n);
      for (const p of perms)
        expect([...p].sort((a, b) => a - b)).toEqual(Array.from({ length: r * c }, (_, i) => i));
    }
  });

  for (const misere of [false, true]) {
    it(`agrees with plain negamax on every 3×3 position (${misere ? 'misère' : 'normal'})`, () => {
      const rules = { rows: 3, cols: 3, k: 3, misere };
      const solver = new MnkSolver(rules);
      const memo = new Map<string, number>();
      for (const s of allPositions(rules))
        expect(solver.value(s), s.board.join('')).toBe(naiveValue(rules, s, memo));
    });
  }

  it('knows the classic results: 3×3 is a draw; misère 3×3 is a draw only via the center opening', () => {
    const normal = new MnkSolver({ rows: 3, cols: 3, k: 3 });
    expect(normal.value(createMnkState({ rows: 3, cols: 3, k: 3 }))).toBe(0);
    const misere = { rows: 3, cols: 3, k: 3, misere: true };
    const values = new MnkSolver(misere).moveValues(createMnkState(misere));
    expect([...values.entries()].filter(([, v]) => v === 0).map(([c]) => c)).toEqual([4]);
  });

  it('agrees with plain negamax on random late-game 4×4 positions', () => {
    const rules = { rows: 4, cols: 4, k: 4 };
    const rng = new Rng(42);
    const solver = new MnkSolver(rules);
    let checked = 0;
    for (let trial = 0; trial < 300 && checked < 150; trial++) {
      let s = createMnkState(rules);
      for (let i = 0; i < 7 && !s.result; i++)
        s = playCell(rules, s, rng.pick(legalCells(rules, s)));
      if (s.result) continue;
      expect(solver.value(s)).toBe(naiveValue(rules, s));
      checked++;
    }
    expect(checked).toBe(150);
  });

  it('finds forced wins and losses in 4×4 positions', () => {
    const rules = { rows: 4, cols: 4, k: 4 };
    const solver = new MnkSolver(rules);
    // X: 0,1,2 with 3 open → X to move wins.
    expect(solver.value(stateFromHistory(rules, [0, 4, 1, 5, 2, 8]))).toBe(1);
    // X has two open threats (row 0 at 3, and column at 12); O to move loses.
    expect(solver.value(stateFromHistory(rules, [0, 5, 1, 6, 2, 9, 4, 10, 8, 15]))).toBe(1);
  });
});
