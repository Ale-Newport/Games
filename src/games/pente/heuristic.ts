/** Static evaluation and move ordering for Pente opponents (never used by the rules). */
import type { PlayerId } from '../../ai/protocols/types';
import { LINE_DIRECTIONS } from '../../core/game-engine/grid';
import {
  CAPTURES_TO_WIN,
  SIZE,
  capturesAt,
  isLegal,
  other,
  stoneOf,
  type PenteState,
  type Seat,
} from './engine';

const WINDOW = [0, 1, 14, 180, 3_000];
/** Value of having captured n pairs (the fifth wins outright). */
const CAPTURE_VALUE = [0, 220, 520, 1_200, 3_200];

const windows: Int16Array[] = [];
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    for (const [dr, dc] of LINE_DIRECTIONS) {
      const er = r + dr * 4;
      const ec = c + dc * 4;
      if (er < 0 || er >= SIZE || ec < 0 || ec >= SIZE) continue;
      windows.push(Int16Array.from({ length: 5 }, (_, k) => (r + dr * k) * SIZE + (c + dc * k)));
    }
  }
}
const windowsAt: Int16Array[][] = Array.from({ length: SIZE * SIZE }, () => []);
for (const w of windows) for (const i of w) windowsAt[i]!.push(w);

interface WindowSummary {
  score: number;
  /** Empty points that would complete five for `mark` / for the opponent. */
  ownFives: Set<number>;
  oppFives: Set<number>;
}

/** Window score for `mark` with tempo: the side to move's windows weigh 1.5× (it acts first). */
function windowScore(board: readonly number[], mark: number, markToMove: boolean): WindowSummary {
  let score = 0;
  const ownFives = new Set<number>();
  const oppFives = new Set<number>();
  for (const w of windows) {
    let mine = 0;
    let theirs = 0;
    let empty = -1;
    for (let k = 0; k < 5; k++) {
      const v = board[w[k]!];
      if (v === mark) mine++;
      else if (v !== 0) theirs++;
      else empty = w[k]!;
    }
    if (mine && !theirs) {
      score += (WINDOW[mine] ?? 0) * (markToMove ? 1.5 : 1);
      if (mine === 4) ownFives.add(empty);
    } else if (theirs && !mine) {
      score -= (WINDOW[theirs] ?? 0) * (markToMove ? 1 : 1.5);
      if (theirs === 4) oppFives.add(empty);
    }
  }
  return { score, ownFives, oppFives };
}

/** Own pairs that the opponent could capture next move (XX bracketed on one side, open on the other). */
function vulnerablePairs(board: readonly number[], seat: Seat): number {
  const opp = other(seat);
  let count = 0;
  for (let i = 0; i < board.length; i++)
    if (board[i] === 0) count += capturesAt(board as never, i, opp).length / 2;
  return count;
}

export function evaluatePente(s: PenteState, player: PlayerId): number {
  const me = player as Seat;
  const opp = other(me);
  const myTurn = s.toMove === me;
  const w = windowScore(s.board, stoneOf(me), myTurn);
  // Immediate tactics the horizon would otherwise miss: a four for the side to move wins next move;
  // two different completion points for the side that just moved cannot both be blocked.
  if (myTurn && w.ownFives.size > 0) return 0.98;
  if (!myTurn && w.oppFives.size > 0) return -0.98;
  if (myTurn && w.oppFives.size >= 2) return -0.9;
  if (!myTurn && w.ownFives.size >= 2) return 0.9;
  let score = w.score;
  score +=
    (CAPTURE_VALUE[Math.min(4, s.captures[me])] ?? 0) -
    (CAPTURE_VALUE[Math.min(4, s.captures[opp])] ?? 0);
  // Pairs at risk matter more for the side not to move.
  const risk = vulnerablePairs(s.board, me) * (myTurn ? 60 : 160);
  const chances = vulnerablePairs(s.board, opp) * (myTurn ? 160 : 60);
  score += chances - risk;
  if (s.captures[me] === CAPTURES_TO_WIN - 1) score += chances * 4;
  if (s.captures[opp] === CAPTURES_TO_WIN - 1) score -= risk * 4;
  return Math.tanh(score / 4_000);
}

/** Candidate points: legal points within distance 2 of a stone, best quick score first, top `k`. */
export function penteCandidates(s: PenteState, k: number): number[] {
  const near = new Set<number>();
  for (let i = 0; i < s.board.length; i++) {
    if (!s.board[i]) continue;
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
        const j = rr * SIZE + cc;
        if (isLegal(s, j)) near.add(j);
      }
    }
  }
  if (near.size === 0) {
    for (let i = 0; i < s.board.length; i++) if (isLegal(s, i)) near.add(i);
  }
  const me = s.toMove;
  const mark = stoneOf(me);
  const oppMark = stoneOf(other(me));
  const quick = (i: number) => {
    let attack = 0;
    let defense = 0;
    for (const w of windowsAt[i]!) {
      let mine = 0;
      let theirs = 0;
      for (let q = 0; q < 5; q++) {
        const v = s.board[w[q]!];
        if (v === mark) mine++;
        else if (v === oppMark) theirs++;
      }
      if (!theirs) attack += (WINDOW[mine + 1] ?? 100_000) - (WINDOW[mine] ?? 0);
      if (!mine) defense += (WINDOW[theirs + 1] ?? 100_000) - (WINDOW[theirs] ?? 0);
    }
    const take = capturesAt(s.board, i, me).length / 2;
    const deny = capturesAt(s.board, i, other(me)).length / 2;
    return attack * 1.1 + defense + take * 900 + deny * 600;
  };
  return [...near]
    .map((i) => ({ i, v: quick(i) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, k)
    .map((x) => x.i);
}
