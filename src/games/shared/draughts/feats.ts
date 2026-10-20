/** Achievement helpers for draughts games: replays a finished game to find notable moves. */
import {
  applyMove,
  initialState,
  isKing,
  type DraughtsState,
  type DraughtsVariant,
  type Seat,
} from './engine';

export interface DraughtsFeats {
  /** A man of the seat was crowned. */
  crowned: boolean;
  /** Most pieces captured by the seat in a single move. */
  bestCapture: number;
}

/** Feats of `seat` (or of anyone when null) over the game's history. */
export function draughtsFeats(
  v: DraughtsVariant,
  s: DraughtsState,
  seat: Seat | null,
): DraughtsFeats {
  let state = initialState(v);
  const feats: DraughtsFeats = { crowned: false, bestCapture: 0 };
  for (const move of s.history) {
    const mover = state.toMove;
    const before = state.board.filter((p) => p !== 0).length;
    const wasMan = !isKing(state.board[move[0]!]!);
    state = applyMove(v, state, move);
    if (seat !== null && mover !== seat) continue;
    if (wasMan && isKing(state.board[move[move.length - 1]!]!)) feats.crowned = true;
    feats.bestCapture = Math.max(
      feats.bestCapture,
      before - state.board.filter((p) => p !== 0).length,
    );
  }
  return feats;
}
