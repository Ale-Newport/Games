/**
 * Bao la Kujifunza — the "learners' Bao" of East Africa — on a 4 × 8 board of pits. Each player owns
 * two rows (16 pits: a front row facing the opponent and a back row), all starting with 2 seeds.
 * South (seat 0) moves first.
 *
 * A player's 16 pits form their own ring (seeds never leave it except by capture). A move takes the
 * seeds of one of your pits holding at least two and sows them one per pit around your ring, in the
 * direction you choose. When a sowing ends:
 * - in a front-row pit that already held seeds, with seeds in the opponent's front pit opposite:
 *   those seeds are captured and sown into your front row starting at the end pit (kichwa) on the
 *   side of the capture — the left end for the left half, the right end for the right half — moving
 *   toward the center, and the turn continues from where that sowing ends;
 * - otherwise in a pit that already held seeds: pick them all up and keep sowing in the same
 *   direction (relay);
 * - in an empty pit: the turn ends.
 * Capturing is compulsory: if some move captures at the end of its first sowing, only capturing
 * moves may be played. A player whose front row is empty, or who has no pit with two seeds, loses.
 * Sowing that would go on forever stops after 400 relays; after 300 plies the side with more seeds
 * wins (equal is a draw).
 *
 * Pits are stored per player as a ring: index 0–7 is the front row from the player's left to right,
 * 8–15 the back row from right to left, so "+" runs clockwise as the player sees it. Board index =
 * seat·16 + ring index. Actions: "3+" or "3-" (ring index and direction).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const RING = 16;
export const PLY_LIMIT = 300;
const RELAY_LIMIT = 400;

export interface BaoState {
  pits: number[];
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 | null; reason: 'front' | 'stuck' | 'limit' } | null;
}

export function createBaoState(): BaoState {
  return { pits: new Array<number>(2 * RING).fill(2), toMove: 0, history: [], result: null };
}

/** The opponent's front pit facing ring index `i` (0–7) of `seat`. */
export const facing = (seat: 0 | 1, i: number) => (1 - seat) * RING + (7 - i);

/** Plays a turn on copies of the pits; returns the new pits and whether the first sowing captured. */
export function playTurn(pits0: readonly number[], seat: 0 | 1, start: number, dir: 1 | -1) {
  const pits = pits0.slice();
  const at = (i: number) => seat * RING + (((i % RING) + RING) % RING);
  let hand = pits[at(start)]!;
  pits[at(start)] = 0;
  let pos = start;
  let current = dir;
  let firstCaptures = false;
  for (let step = 0; step < RELAY_LIMIT; step++) {
    // Sow the hand one seed per pit, starting just after `pos` (or at `pos` for a capture sowing).
    while (hand > 0) {
      pos = (((pos + current) % RING) + RING) % RING;
      pits[at(pos)]!++;
      hand--;
    }
    const here = pits[at(pos)]!;
    const opp = pos < 8 ? facing(seat, pos) : -1;
    if (pos < 8 && here > 1 && pits[opp]! > 0) {
      if (step === 0) firstCaptures = true;
      hand = pits[opp]!;
      pits[opp] = 0;
      // Sow the catch from the end of the front row on the capture's side, toward the center.
      current = pos < 4 ? 1 : -1;
      pos = pos < 4 ? -1 : 8;
      continue;
    }
    if (here > 1) {
      hand = here;
      pits[at(pos)] = 0;
      continue;
    }
    break;
  }
  return { pits, firstCaptures };
}

const frontEmpty = (pits: readonly number[], seat: 0 | 1) =>
  pits.slice(seat * RING, seat * RING + 8).every((x) => x === 0);

export function legalBaoActions(s: BaoState): string[] {
  if (s.result) return [];
  const seat = s.toMove;
  const all: { a: string; captures: boolean }[] = [];
  for (let i = 0; i < RING; i++) {
    if (s.pits[seat * RING + i]! < 2) continue;
    for (const d of [1, -1] as const)
      all.push({
        a: `${i}${d === 1 ? '+' : '-'}`,
        captures: playTurn(s.pits, seat, i, d).firstCaptures,
      });
  }
  const capturing = all.filter((m) => m.captures);
  return (capturing.length ? capturing : all).map((m) => m.a);
}

/** Whether the player to move is forced to capture (some move captures on its first sowing). */
export function mustCapture(s: BaoState): boolean {
  const first = legalBaoActions(s)[0];
  if (first === undefined) return false;
  const dir = first.endsWith('+') ? 1 : -1;
  return playTurn(s.pits, s.toMove, Number(first.slice(0, -1)), dir).firstCaptures;
}

export function applyBaoAction(s: BaoState, a: string): BaoState {
  if (s.result || !legalBaoActions(s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove;
  const start = Number(a.slice(0, -1));
  const dir = a.endsWith('+') ? 1 : -1;
  const { pits } = playTurn(s.pits, me, start, dir);
  const toMove = (1 - me) as 0 | 1;
  const history = [...s.history, a];
  const next: BaoState = { pits, toMove, history, result: null };
  if (frontEmpty(pits, toMove)) next.result = { winner: me, reason: 'front' };
  else if (legalBaoActions(next).length === 0) next.result = { winner: me, reason: 'stuck' };
  else if (history.length >= PLY_LIMIT) {
    const mine = pits.slice(0, RING).reduce((x, y) => x + y, 0);
    const theirs = pits.slice(RING).reduce((x, y) => x + y, 0);
    next.result = { winner: mine === theirs ? null : mine > theirs ? 0 : 1, reason: 'limit' };
  }
  return next;
}

export function replayBao(history: readonly string[]): BaoState {
  return history.reduce((s, a) => applyBaoAction(s, a), createBaoState());
}

export function isValidBaoState(data: unknown): data is BaoState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayBao(data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
