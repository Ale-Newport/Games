import { describe, expect, it } from 'vitest';
import { allLines } from '../../../core/game-engine/grid';
import {
  createMnkState,
  legalCells,
  playCell,
  stateFromHistory,
  type MnkState,
} from '../../shared/mnk/engine';
import { MISERE, lostByForcedMove } from '../rules';

function explore(): Map<string, MnkState> {
  const seen = new Map<string, MnkState>();
  const visit = (s: MnkState) => {
    const key = s.board.join('');
    if (seen.has(key)) return;
    seen.set(key, s);
    for (const c of legalCells(MISERE, s)) visit(playCell(MISERE, s, c));
  };
  visit(createMnkState(MISERE));
  return seen;
}

describe('Misère Tic-Tac-Toe rules', () => {
  it('completing any line loses for the mover (both seats)', () => {
    for (const line of allLines(MISERE, 3)) {
      const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => !line.includes(c));
      // Choose two O cells that do not form a line with each other and a third filler.
      const history = [line[0]!, others[0]!, line[1]!, others[1]!, line[2]!];
      const s = stateFromHistory(MISERE, history);
      if (s.history.length !== 5 || !s.result) continue;
      expect(s.result).toMatchObject({ kind: 'win', winner: 1, reason: 'misere-line', line });
      const swapped = stateFromHistory(MISERE, history, 1);
      expect(swapped.result).toMatchObject({ kind: 'win', winner: 0, reason: 'misere-line' });
    }
  });

  it('enumerates every reachable position consistently', () => {
    const positions = explore();
    let terminal = 0;
    for (const s of positions.values()) {
      if (!s.result) continue;
      terminal++;
      if (s.result.kind === 'win') {
        // The loser (the last mover) owns the completed line.
        const loser = s.history.length % 2 === 1 ? 0 : 1;
        expect(s.result.winner).toBe(1 - loser);
        const mark = loser === 0 ? 1 : 2;
        expect(s.result.line.every((c) => s.board[c] === mark)).toBe(true);
      } else {
        expect(s.board.every((c) => c !== 0)).toBe(true);
      }
    }
    // Same reachable set as normal Tic-Tac-Toe (a line ends the game either way).
    expect(positions.size).toBe(5478);
    expect(terminal).toBe(958);
  });

  it('detects a forced losing move (the Squeeze)', () => {
    // X: 0, 5, 6, 7 · O: 1, 2, 3, 4 → X must take the last cell 8, completing 6-7-8.
    const s = stateFromHistory(MISERE, [0, 1, 5, 2, 6, 4, 7, 3]);
    expect(s.result).toBeNull();
    expect(legalCells(MISERE, s)).toEqual([8]);
    const end = playCell(MISERE, s, 8);
    expect(end.result).toMatchObject({
      kind: 'win',
      winner: 1,
      reason: 'misere-line',
      line: [6, 7, 8],
    });
    expect(lostByForcedMove(end)).toBe(true);
    const voluntary = stateFromHistory(MISERE, [0, 4, 1, 5, 2]);
    expect(voluntary.result?.kind).toBe('win');
    expect(lostByForcedMove(voluntary)).toBe(false);
  });
});
