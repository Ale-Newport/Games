import { describe, expect, it } from 'vitest';
import { mnkTwoPlayerRules } from '../../mnk/match';
import { applyMove, defaultSetup, newMatch, nextRound, type MatchConfig } from '../match';
import type { MnkState } from '../../mnk/engine';

const base: MatchConfig<MnkState, number> = {
  rules: mnkTwoPlayerRules({ rows: 3, cols: 3, k: 3 }),
  difficulties: ['easy'],
  agentIds: ['easy'],
  defaultDifficulty: 'easy',
  defaultWatch: ['easy', 'easy'],
};

describe('two-player match flow', () => {
  it('alternates the starting seat by default', () => {
    const m = newMatch(base, defaultSetup(base));
    expect(m.round.firstPlayer).toBe(0);
    expect(nextRound(base, m).round.firstPlayer).toBe(1);
  });

  it('keeps a fixed first seat (Black opens) in every round', () => {
    const cfg = { ...base, fixedFirstSeat: 0 as const };
    let m = newMatch(cfg, { ...defaultSetup(cfg), alternate: true });
    for (let round = 0; round < 4; round++) {
      expect(m.round.firstPlayer).toBe(0);
      expect(m.round.toMove).toBe(0);
      m = nextRound(cfg, applyMove(cfg, m, 4));
    }
  });
});
