import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import {
  applyReversi,
  countDiscs,
  createReversiState,
  legalActions,
  type ReversiRules,
  type ReversiState,
} from '../engine';
import { createReversiEnvironment } from '../environment';
import { ReversiSearchAgent, squareWeights } from '../search';

const R6: ReversiRules = { size: 6 };
const env6 = createReversiEnvironment({ id: 't6', version: '1.0.0', rulesetId: 't', rules: R6 });

/** Best final disc difference for the side to move, by plain minimax over the engine. */
function bruteForce(
  rules: ReversiRules,
  s: ReversiState,
  memo = new Map<string, number>(),
): number {
  if (s.result) {
    const [b, w] = countDiscs(s.board);
    return s.toMove === 0 ? b - w : w - b;
  }
  const key = s.board.join('') + s.toMove;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  let best = -Infinity;
  for (const a of legalActions(rules, s)) {
    const next = applyReversi(rules, s, a);
    // After the move it is the opponent's view; a pass keeps alternation through toMove.
    best = Math.max(best, -bruteForce(rules, next, memo));
  }
  memo.set(key, best);
  return best;
}

describe('ReversiSearchAgent', () => {
  it('builds corner-positive, X-square-negative weights', () => {
    const w = squareWeights(8);
    expect(w[0]).toBe(100);
    expect(w[9]).toBe(-50);
    expect(w[1]).toBe(-20);
    expect(w[3]).toBe(8);
  });

  it('its exact endgame move achieves the brute-force optimum on random 6×6 endgames', () => {
    const rng = new Rng(5);
    let checked = 0;
    for (let trial = 0; trial < 60 && checked < 12; trial++) {
      let s = createReversiState(R6);
      for (let k = 0; k < 24 && !s.result; k++)
        s = applyReversi(R6, s, rng.pick(legalActions(R6, s)));
      if (s.result) continue;
      const truth = bruteForce(R6, s);
      const agent = new ReversiSearchAgent(R6, {
        id: 'x',
        label: 'x',
        maxDepth: 1,
        endgameEmpties: 20,
      });
      const move = agent.selectAction(env6, s, s.toMove, { rng: new Rng(trial) });
      const achieved = -bruteForce(R6, applyReversi(R6, s, move));
      expect(achieved, s.history.join(',')).toBe(truth);
      checked++;
    }
    expect(checked).toBe(12);
  }, 60_000);

  it('takes an available corner over other moves', () => {
    const R8: ReversiRules = { size: 8 };
    const env8 = createReversiEnvironment({
      id: 't8',
      version: '1.0.0',
      rulesetId: 't',
      rules: R8,
    });
    // White at b2 (9) and c3 (18) on the long diagonal, Black at d4 (27): Black can take a1 (0).
    const s = createReversiState(R8);
    s.board.fill(0);
    s.board[27] = 1;
    s.board[18] = 2;
    s.board[9] = 2;
    s.board[36] = 2;
    s.board[45] = 1;
    const agent = new ReversiSearchAgent(R8, {
      id: 'm',
      label: 'm',
      maxDepth: 3,
      endgameEmpties: 0,
    });
    expect(legalActions(R8, s)).toContain(0);
    expect(agent.selectAction(env8, s, 0, { rng: new Rng(1) })).toBe(0);
  });
});
