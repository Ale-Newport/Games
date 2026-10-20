import { describe, expect, it } from 'vitest';
import { mnkTwoPlayerRules } from '../../mnk/match';
import {
  agreeDraw,
  applyMove,
  canUndo,
  chargeClock,
  defaultSetup,
  flagFall,
  isValidMatch,
  newMatch,
  nextRound,
  resign,
  restartRound,
  roundOutcome,
  timeLeft,
  type MatchConfig,
} from '../match';
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

  const timed: MatchConfig<MnkState, number> = {
    ...base,
    timeControls: [{ id: '1+2', initialMs: 60_000, incrementMs: 2_000 }],
  };

  it('charges thinking time to the mover and adds the increment', () => {
    let m = newMatch(timed, { ...defaultSetup(timed), timeControl: '1+2' });
    expect(m.clock?.remaining).toEqual([60_000, 60_000]);
    m = applyMove(timed, m, 4, 5_000);
    expect(m.clock?.remaining).toEqual([57_000, 60_000]);
    expect(timeLeft(m, 1, 1_500)).toBe(58_500);
    expect(canUndo(timed, m)).toBe(false); // no take-backs on the clock
    m = chargeClock(timed, m, 10_000);
    expect(m.clock?.remaining).toEqual([57_000, 50_000]);
    expect(restartRound(timed, m).clock?.remaining).toEqual([60_000, 60_000]);
    expect(isValidMatch(timed, JSON.parse(JSON.stringify(m)))).toBe(true);
    expect(isValidMatch(timed, { ...m, clock: { ...m.clock, remaining: [-1, 3] } })).toBe(false);
    expect(
      newMatch(timed, { ...defaultSetup(timed), mode: 'watch', timeControl: '1+2' }).clock,
    ).toBe(null);
  });

  it('ends a round by flag fall, resignation or agreement and scores it', () => {
    const m = newMatch(timed, { ...defaultSetup(timed), timeControl: '1+2' });
    const flagged = flagFall(timed, m, 0);
    expect(roundOutcome(timed, flagged)).toEqual({ winner: 1, reason: 'timeout' });
    expect(flagged.scores).toEqual({ x: 0, o: 1, draws: 0 });
    expect(() => applyMove(timed, flagged, 4)).toThrow();
    // The side with time left cannot win (e.g. a lone king): the flag fall is a draw.
    const cannotMate = { ...timed, canWinOnTime: () => false };
    expect(roundOutcome(cannotMate, flagFall(cannotMate, m, 0))?.winner).toBe(null);
    const resigned = resign(timed, m, 1);
    expect(roundOutcome(timed, resigned)).toEqual({ winner: 0, reason: 'resign' });
    expect(resign(timed, resigned, 0)).toBe(resigned); // already over
    expect(agreeDraw(timed, m).scores.draws).toBe(1);
    const next = nextRound(timed, resigned);
    expect(next.adjudication).toBe(null);
    expect(roundOutcome(timed, next)).toBe(null);
  });
});
