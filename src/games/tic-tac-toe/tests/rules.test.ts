import { describe, expect, it } from 'vitest';
import {
  isValidState,
  legalMoves,
  newRound,
  play,
  replay,
  threats,
  wonByFork,
  winnerMarkCount,
  type TttState,
} from '../rules';

function explore(): Map<string, TttState> {
  const seen = new Map<string, TttState>();
  const visit = (s: TttState) => {
    const key = s.board.join('');
    if (seen.has(key)) return;
    seen.set(key, s);
    for (const cell of legalMoves(s)) visit(play(s, cell));
  };
  visit(newRound(0));
  return seen;
}

describe('Tic-Tac-Toe rules (exhaustive)', () => {
  const positions = explore();
  const terminal = [...positions.values()].filter((s) => s.result);

  it('reaches exactly the 5,478 legal positions', () => {
    expect(positions.size).toBe(5478);
  });

  it('has the known 958 terminal positions: 626 X wins, 316 O wins, 16 draws', () => {
    expect(terminal).toHaveLength(958);
    expect(terminal.filter((s) => s.result?.kind === 'win' && s.result.winner === 0)).toHaveLength(
      626,
    );
    expect(terminal.filter((s) => s.result?.kind === 'win' && s.result.winner === 1)).toHaveLength(
      316,
    );
    expect(terminal.filter((s) => s.result?.kind === 'draw')).toHaveLength(16);
  });

  it('never allows moves after the game ends and keeps mark counts consistent', () => {
    for (const s of positions.values()) {
      const x = s.board.filter((c) => c === 1).length;
      const o = s.board.filter((c) => c === 2).length;
      expect(x - o === 0 || x - o === 1).toBe(true);
      if (s.result) expect(legalMoves(s)).toEqual([]);
      else expect(legalMoves(s).length).toBe(9 - x - o);
    }
  });
});

describe('Tic-Tac-Toe rules (cases)', () => {
  it('lets O move first when configured', () => {
    const s = play(newRound(1), 4);
    expect(s.board[4]).toBe(2);
    expect(s.toMove).toBe(0);
  });

  it('detects a fork win and the fastest possible win', () => {
    // X: corner, center, then opposite... X 0, O 1, X 4, O 8, X 6 → threats at 3 and 2; O 2, X 3 wins.
    const s = replay([0, 1, 4, 8, 6, 2, 3]);
    expect(s.result).toMatchObject({ kind: 'win', winner: 0, line: [0, 3, 6] });
    expect(wonByFork(s)).toBe(true);
    expect(winnerMarkCount(s)).toBe(4);
    const quick = replay([0, 3, 1, 4, 2]);
    expect(winnerMarkCount(quick)).toBe(3);
    expect(wonByFork(quick)).toBe(false);
  });

  it('reports threats for both seats', () => {
    const s = replay([0, 4, 1]);
    expect(threats(s, 0)).toEqual([2]);
    expect(threats(s, 1)).toEqual([]);
  });

  it('validates saved states', () => {
    expect(isValidState(JSON.parse(JSON.stringify(replay([4, 0, 8]))))).toBe(true);
    expect(isValidState({ board: [], toMove: 0, firstPlayer: 0, history: [], result: null })).toBe(
      false,
    );
    expect(isValidState('x')).toBe(false);
  });
});
