import { describe, expect, it } from 'vitest';
import { unwrap, wrap } from '../../../core/persistence/versioned';
import {
  SAVE_SPEC,
  applyMove,
  canUndo,
  defaultSetup,
  isHumanTurn,
  nextRound,
  newMatch,
  restartRound,
  statsMode,
  undo,
  type MatchState,
} from '../match';

const play = (m: MatchState, ...cells: number[]) => cells.reduce(applyMove, m);

describe('Tic-Tac-Toe match flow', () => {
  it('scores rounds and alternates the starting mark', () => {
    let m = newMatch({ ...defaultSetup('Ana'), mode: 'local' });
    expect(m.round.firstPlayer).toBe(0);
    m = play(m, 0, 3, 1, 4, 2);
    expect(m.scores).toEqual({ x: 1, o: 0, draws: 0 });
    m = nextRound(m);
    expect(m.roundNumber).toBe(2);
    expect(m.round.firstPlayer).toBe(1);
    expect(m.round.toMove).toBe(1);
    m = play(m, 0, 1, 2, 4, 3, 5, 7, 6, 8);
    expect(m.scores).toEqual({ x: 1, o: 0, draws: 1 });
    m = nextRound({ ...m, setup: { ...m.setup, alternate: false } });
    expect(m.round.firstPlayer).toBe(0);
  });

  it('knows whose turn is human', () => {
    const ai = newMatch({ ...defaultSetup(), mode: 'ai', humanSeat: 1, alternate: false });
    expect(isHumanTurn(ai)).toBe(false);
    expect(isHumanTurn(applyMove(ai, 4))).toBe(true);
    expect(isHumanTurn(newMatch({ ...defaultSetup(), mode: 'watch' }))).toBe(false);
  });

  it('undoes one move locally and the human move plus reply against the computer', () => {
    const local = play(newMatch({ ...defaultSetup(), mode: 'local' }), 4, 0);
    expect(undo(local).round.history).toEqual([4]);
    const ai = play(
      newMatch({ ...defaultSetup(), mode: 'ai', humanSeat: 0, alternate: false }),
      4,
      0,
    );
    expect(canUndo(ai)).toBe(true);
    expect(undo(ai).round.history).toEqual([]);
    // Computer (X) moved first, human (O) replied, computer moved: undo back to human's turn.
    const aiAsO = play(
      newMatch({ ...defaultSetup(), mode: 'ai', humanSeat: 1, alternate: false }),
      4,
      0,
      8,
    );
    expect(undo(aiAsO).round.history).toEqual([4]);
    expect(
      canUndo(play(newMatch({ ...defaultSetup(), mode: 'ai', humanSeat: 1, alternate: false }), 4)),
    ).toBe(false);
  });

  it('disables undo and restart after the round ends', () => {
    const done = play(newMatch({ ...defaultSetup(), mode: 'local' }), 0, 3, 1, 4, 2);
    expect(canUndo(done)).toBe(false);
    expect(undo(done)).toBe(done);
    expect(restartRound(done)).toBe(done);
    const mid = play(newMatch({ ...defaultSetup(), mode: 'local' }), 0, 3);
    expect(restartRound(mid).round.history).toEqual([]);
  });

  it('maps modes to statistics keys', () => {
    expect(statsMode({ ...defaultSetup(), mode: 'ai', difficulty: 'perfect' })).toBe(
      'vs-ai:perfect',
    );
    expect(statsMode({ ...defaultSetup(), mode: 'local' })).toBe('local');
    expect(statsMode({ ...defaultSetup(), mode: 'watch' })).toBeNull();
  });

  it('round-trips saves and rejects corrupted ones', () => {
    const m = play(newMatch(defaultSetup('Ana')), 4, 0, 8);
    const decoded = unwrap(SAVE_SPEC, JSON.parse(JSON.stringify(wrap(SAVE_SPEC, m))));
    expect(decoded).toMatchObject({ ok: true, data: m });
    const corrupt = { ...m, round: { ...m.round, board: m.round.board.map(() => 1) } };
    expect(unwrap(SAVE_SPEC, wrap(SAVE_SPEC, corrupt)).ok).toBe(false);
    expect(unwrap(SAVE_SPEC, wrap(SAVE_SPEC, { ...m, scores: { x: -1, o: 0, draws: 0 } })).ok).toBe(
      false,
    );
    expect(
      unwrap(
        SAVE_SPEC,
        wrap(SAVE_SPEC, { ...m, setup: { ...m.setup, watchAgents: ['nope', 'random'] } }),
      ).ok,
    ).toBe(false);
  });
});
