import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  createGravityState,
  dropDisc,
  gravityFromHistory,
  legalColumns,
  type GravityRules,
  type GravityState,
} from '../engine';
import { createGravityEnvironment } from '../environment';
import { GravitySearchAgent } from '../search';

const C4: GravityRules = { rows: 6, cols: 7, k: 4 };
const env = createGravityEnvironment({
  id: 'test-c4',
  version: '1.0.0',
  rulesetId: 't',
  rules: C4,
});

/** Exact value for the side to move (1 win, 0 draw, -1 loss) by plain memoized negamax. */
function exact(s: GravityState, memo = new Map<string, number>()): number {
  if (s.result) return s.result.kind === 'draw' ? 0 : -1;
  const key = s.board.join('');
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  let best = -1;
  for (const c of legalColumns(C4, s)) {
    best = Math.max(best, 0 - exact(dropDisc(C4, s, c), memo) || 0);
    if (best === 1) break;
  }
  memo.set(key, best);
  return best;
}

describe('GravitySearchAgent', () => {
  const agent = () => new GravitySearchAgent(C4, { id: 't', label: 't', maxDepth: 42 });

  it('takes an immediate win and blocks a single threat', () => {
    const win = gravityFromHistory(C4, [0, 6, 1, 6, 2]); // Yellow to move... Red has 0,1,2 on the bottom
    expect(agent().selectAction(env, win, 1, { rng: new Rng(1) })).toBe(3); // Yellow must block
    const own = gravityFromHistory(C4, [0, 6, 1, 6, 2, 5]); // Red to move with three in a row
    expect(agent().selectAction(env, own, 0, { rng: new Rng(1) })).toBe(3);
  });

  it('agrees with exact negamax on random late-game positions', () => {
    const rng = new Rng(11);
    let checked = 0;
    for (let trial = 0; trial < 400 && checked < 40; trial++) {
      let s = createGravityState(C4);
      for (let i = 0; i < 30 && !s.result; i++) s = dropDisc(C4, s, rng.pick(legalColumns(C4, s)));
      if (s.result) continue;
      const truth = exact(s);
      const a = agent();
      const col = a.selectAction(env, s, s.toMove, { rng: new Rng(trial) });
      const after = dropDisc(C4, s, col);
      // The chosen move must achieve the exact value of the position.
      const achieved = after.result
        ? after.result.kind === 'draw'
          ? 0
          : 1
        : 0 - exact(after) || 0;
      expect(achieved, `history ${s.history.join(',')}`).toBe(truth);
      checked++;
    }
    expect(checked).toBe(40);
  }, 60_000);

  it('respects its time budget', () => {
    const a = new GravitySearchAgent(C4, { id: 't', label: 't', maxDepth: 30, timeLimitMs: 150 });
    const start = performance.now();
    a.selectAction(env, createGravityState(C4), 0, { rng: new Rng(2) });
    expect(performance.now() - start).toBeLessThan(400);
    expect(a.lastStats?.depth).toBeGreaterThanOrEqual(6);
  });
});
