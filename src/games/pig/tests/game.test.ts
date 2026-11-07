import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { pigEnv } from '../ai-adapter';
import {
  act,
  holdAt20,
  isValidPig,
  legalActions,
  newPig,
  optimalAction,
  winChance,
  winTable,
  type PigGame,
} from '../engine';

describe('Pig rules', () => {
  it('rolls add to the turn total, a 1 loses it, holding banks it', () => {
    let g = newPig(2);
    expect(legalActions(g)).toEqual(['roll']);
    let saw1 = false;
    let banked = false;
    for (let i = 0; i < 200 && (!saw1 || !banked); i++) {
      const before = g;
      g = act(g, g.turnTotal >= 8 ? 'hold' : 'roll');
      if (g.last === 1 && before.turnTotal > 0 && g.event?.kind === 'pig') {
        saw1 = true;
        expect(g.turnTotal).toBe(0);
        expect(g.turn).not.toBe(before.turn);
      }
      if (g.event?.kind === 'hold') {
        banked = true;
        expect(g.scores[before.turn]).toBe(before.scores[before.turn] + before.turnTotal);
      }
    }
    expect(saw1 && banked).toBe(true);
    expect(isValidPig(g)).toBe(true);
    expect(isValidPig({ ...g, scores: [99, 0] })).toBe(false);
  });
});

describe('Pig solved', () => {
  it('matches the published value: the first player wins 53.06% with perfect play', () => {
    const P = winTable();
    expect(P[0]).toBeCloseTo(0.5306, 3);
  });

  it('the optimal policy holds at 21 from the start and rolls on when far behind', () => {
    const at = (scores: [number, number], turnTotal: number): PigGame => ({
      ...newPig(0),
      scores,
      turn: 0,
      turnTotal,
    });
    expect(optimalAction(at([0, 0], 20))).toBe('roll');
    expect(optimalAction(at([0, 0], 21))).toBe('hold');
    // Far behind (50 to 95), it keeps rolling past 20.
    expect(optimalAction(at([50, 95], 25))).toBe('roll');
    // Close to the goal, it holds anything that wins.
    expect(optimalAction(at([95, 0], 5))).toBe('hold');
    expect(holdAt20(at([0, 0], 20))).toBe('hold');
    expect(winChance(at([0, 0], 0))).toBeCloseTo(0.5306, 3);
  });

  it('the optimal player beats the hold-at-20 player over 4000 games', () => {
    let wins = 0;
    for (let seed = 1; seed <= 4000; seed++) {
      let g = newPig(seed);
      while (g.phase !== 'over') g = act(g, g.turn === 0 ? optimalAction(g) : holdAt20(g));
      if (g.winner === 0) wins++;
    }
    // Fixed seeds; about 54% is expected (one standard error is 0.8%), even would be 2000.
    expect(wins).toBeGreaterThan(2080);
  });
});

describeAdapterContract(pigEnv, {
  configs: [undefined],
  playouts: 3,
  maxSteps: 4000,
  illegalActions: (g) => ['jump', 'pass', 'hold'].filter((a) => !legalActions(g).includes(a)),
});
