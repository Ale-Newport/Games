/** Static evaluation for Ultimate Tic-Tac-Toe used by the alpha-beta opponents (never by rules). */
import type { PlayerId } from '../../ai/protocols/types';
import { LINES, markOf, type Seat, type UtttState } from './engine';

/** Strategic value of each global position: center > corners > edges. */
const POSITION_WEIGHT = [2, 1.5, 2, 1.5, 3, 1.5, 2, 1.5, 2];

export function evaluateUttt(s: UtttState, player: PlayerId): number {
  const own = markOf(player as Seat);
  const opp = own === 1 ? 2 : 1;
  let score = 0;
  // Won local boards.
  for (let b = 0; b < 9; b++) {
    if (s.boards[b] === own) score += POSITION_WEIGHT[b]! * 2;
    else if (s.boards[b] === opp) score -= POSITION_WEIGHT[b]! * 2;
  }
  // Global lines still open to one side.
  for (const line of LINES) {
    let mine = 0;
    let theirs = 0;
    let dead = false;
    for (const b of line) {
      const status = s.boards[b];
      if (status === own) mine++;
      else if (status === opp) theirs++;
      else if (status === 3) dead = true;
    }
    if (dead || (mine > 0 && theirs > 0)) continue;
    if (mine) score += mine === 2 ? 10 : 2;
    if (theirs) score -= theirs === 2 ? 10 : 2;
  }
  // Two-in-a-row threats inside open local boards.
  for (let b = 0; b < 9; b++) {
    if (s.boards[b] !== 0) continue;
    const base = b * 9;
    for (const [x, y, z] of LINES) {
      const values = [s.cells[base + x], s.cells[base + y], s.cells[base + z]];
      const mine = values.filter((v) => v === own).length;
      const theirs = values.filter((v) => v === opp).length;
      if (mine === 2 && theirs === 0) score += 0.5 * POSITION_WEIGHT[b]!;
      if (theirs === 2 && mine === 0) score -= 0.5 * POSITION_WEIGHT[b]!;
    }
  }
  // Free choice is an advantage for whoever has it.
  if (s.forced < 0 && !s.result) score += s.toMove === player ? 1 : -1;
  return Math.tanh(score / 25);
}
