/**
 * Gale, the bridge-building connection game (sold commercially under other names), at the classic
 * size: two interleaved grids of dots on an 11 × 11 lattice. Orange (seat 0) owns the 6 × 5 dots at
 * even rows and odd columns and must link the top row to the bottom row; Teal owns the 5 × 6 dots at
 * odd rows and even columns and must link the left column to the right column.
 *
 * A move builds a bridge between two adjacent dots of your color. Bridges never cross, so every
 * lattice point between four dots (the 41 "slots" at r + c even, 1 ≤ r, c ≤ 9) takes one bridge:
 * Orange's runs one way through it and Teal's the other. The first player to connect their sides
 * wins; the board cannot fill up without a winner. Rounds may alternate who opens.
 * Actions: the slot index r·11 + c.
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { isRecord } from '../../core/persistence/versioned';

export const S = 11;
export const SLOTS: readonly number[] = (() => {
  const out: number[] = [];
  for (let r = 1; r < S - 1; r++)
    for (let c = 1; c < S - 1; c++) if ((r + c) % 2 === 0) out.push(r * S + c);
  return out;
})();

export interface GaleState {
  /** owner[slot] = 0 free, 1 Orange bridge, 2 Teal bridge (indexed by lattice point). */
  bridges: number[];
  toMove: 0 | 1;
  first: 0 | 1;
  history: string[];
  result: { winner: 0 | 1; reason: 'connected' } | null;
}

/** Whether a lattice point holds a dot of `seat`. */
export const isDot = (seat: 0 | 1, r: number, c: number) =>
  r >= 0 &&
  c >= 0 &&
  r < S &&
  c < S &&
  (seat === 0 ? r % 2 === 0 && c % 2 === 1 : r % 2 === 1 && c % 2 === 0);

/** The two dots a bridge of `seat` through `slot` joins. */
export function bridgeEnds(seat: 0 | 1, slot: number): [number, number] {
  const r = Math.floor(slot / S);
  // Through an even-even point Orange runs across and Teal runs down; through odd-odd the reverse.
  const across = (r % 2 === 0) === (seat === 0);
  return across ? [slot - 1, slot + 1] : [slot - S, slot + S];
}

export function createGaleState(first: 0 | 1 = 0): GaleState {
  return {
    bridges: new Array<number>(S * S).fill(0),
    toMove: first,
    first,
    history: [],
    result: null,
  };
}

export function legalGaleActions(s: GaleState): string[] {
  if (s.result) return [];
  return SLOTS.filter((p) => s.bridges[p] === 0).map(String);
}

/** Whether seat's bridges join its two sides. */
export function connected(bridges: readonly number[], seat: 0 | 1): boolean {
  const seen = new Uint8Array(S * S);
  const stack: number[] = [];
  const start = (p: number) => {
    seen[p] = 1;
    stack.push(p);
  };
  // Orange starts from the top row, Teal from the left column.
  for (let i = 0; i < S; i++) {
    const p = seat === 0 ? i : i * S;
    if (isDot(seat, Math.floor(p / S), p % S)) start(p);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const r = Math.floor(p / S);
    const c = p % S;
    if (seat === 0 ? r === S - 1 : c === S - 1) return true;
    // Neighboring dots two steps away, through a slot holding this seat's bridge.
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const sr = r + dr;
      const sc = c + dc;
      if (sr < 0 || sc < 0 || sr >= S || sc >= S) continue;
      const slot = sr * S + sc;
      if (bridges[slot] !== seat + 1) continue;
      const q = (r + 2 * dr) * S + c + 2 * dc;
      if (!seen[q]) start(q);
    }
  }
  return false;
}

export function applyGaleAction(s: GaleState, a: string): GaleState {
  if (s.result || typeof a !== 'string' || !/^\d+$/.test(a))
    throw new IllegalActionError(`Illegal move ${String(a)}`);
  const slot = Number(a);
  if (!SLOTS.includes(slot) || s.bridges[slot] !== 0)
    throw new IllegalActionError(`Illegal move ${a}`);
  const bridges = s.bridges.slice();
  bridges[slot] = s.toMove + 1;
  const me = s.toMove;
  return {
    bridges,
    toMove: (1 - me) as 0 | 1,
    first: s.first,
    history: [...s.history, a],
    result: connected(bridges, me) ? { winner: me, reason: 'connected' } : null,
  };
}

export function replayGale(history: readonly string[], first: 0 | 1 = 0): GaleState {
  return history.reduce((s, a) => applyGaleAction(s, a), createGaleState(first));
}

export function isValidGaleState(data: unknown): data is GaleState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  try {
    return (
      JSON.stringify(replayGale(data.history as string[], data.first)) === JSON.stringify(data)
    );
  } catch {
    return false;
  }
}
