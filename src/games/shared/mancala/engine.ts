/**
 * Two-row mancala games (catalog #061 Kalah, #062 Oware, #064 Congkak). Each player owns a row of
 * pits; seat 0's pits are 0…n−1 (left to right along the bottom), seat 1's are n…2n−1 (right to
 * left along the top), so sowing runs counter-clockwise through increasing indices. A move picks
 * up every seed of one of your non-empty pits and sows them one per pit onward.
 *
 * Variant rules:
 * - stores: the mover's store sits after their last pit and receives seeds while sowing (never the
 *   opponent's); ending in it gives another turn (Kalah, Congkak).
 * - relay: if the last seed lands in a pit that was not empty, pick up that pit and keep sowing
 *   (Congkak).
 * - capture 'empty': ending in one of your own pits that was empty captures it and the seeds
 *   opposite (when there are any). capture 'two-three' (Oware): ending in an opponent's pit that
 *   now holds 2 or 3 captures it, and so on backward while the pits hold 2 or 3; a capture that
 *   would take every opponent seed (grand slam) captures nothing.
 * - skipOrigin: a pit with 12 or more seeds skips its own pit when it laps the board (Oware).
 * - mustFeed: if the opponent has no seeds you must give them some when you can (Oware).
 * - pieRule: after the first player's opening turn the second player may "swap", taking over the
 *   first player's side (Congkak); the first player then moves on the other side.
 *
 * Endings: store games end as soon as either row is empty, Oware when the side to move cannot play;
 * every seed still on the board goes to the player on whose side it lies. Oware also ends as soon as someone has captured more than half the seeds. Threefold
 * repetition or the ply limit ends the game the same way (each keeps their own side). Most seeds
 * win; equal is a draw.
 *
 * Actions: the absolute pit index as a string ("3"), or "swap".
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export interface MancalaVariant {
  id: string;
  pits: number;
  seeds: number;
  stores: boolean;
  relay: boolean;
  capture: 'empty' | 'two-three';
  skipOrigin: boolean;
  mustFeed: boolean;
  /** After the first player's opening turn, the second player may swap sides (pie rule). */
  pieRule: boolean;
  plyLimit: number;
}

export const KALAH: MancalaVariant = {
  id: 'kalah',
  pits: 6,
  seeds: 4,
  stores: true,
  relay: false,
  capture: 'empty',
  skipOrigin: false,
  mustFeed: false,
  pieRule: false,
  plyLimit: 400,
};

export const OWARE: MancalaVariant = {
  id: 'oware',
  pits: 6,
  seeds: 4,
  stores: false,
  relay: false,
  capture: 'two-three',
  skipOrigin: true,
  mustFeed: true,
  pieRule: false,
  plyLimit: 400,
};

export const CONGKAK: MancalaVariant = {
  id: 'congkak',
  pits: 7,
  seeds: 7,
  stores: true,
  relay: true,
  capture: 'empty',
  skipOrigin: false,
  mustFeed: false,
  pieRule: false,
  plyLimit: 400,
};

export interface MancalaState {
  pits: number[];
  /** Stores (or, in Oware, captured seeds). */
  stores: [number, number];
  toMove: 0 | 1;
  /** Seat that made each move (a move ending in your store gives another turn). */
  movers: (0 | 1)[];
  history: string[];
  keys: string[];
  result: { winner: 0 | 1 | null; reason: 'empty' | 'majority' | 'repetition' | 'limit' } | null;
}

const keyOf = (s: Pick<MancalaState, 'pits' | 'stores' | 'toMove'>) =>
  `${s.pits.join(',')}|${s.stores.join(',')}|${s.toMove}`;

export function createMancalaState(v: MancalaVariant): MancalaState {
  const s: MancalaState = {
    pits: new Array<number>(2 * v.pits).fill(v.seeds),
    stores: [0, 0],
    toMove: 0,
    movers: [],
    history: [],
    keys: [],
    result: null,
  };
  s.keys = [keyOf(s)];
  return s;
}

export const owner = (v: MancalaVariant, pit: number): 0 | 1 => (pit < v.pits ? 0 : 1);
export const opposite = (v: MancalaVariant, pit: number) => 2 * v.pits - 1 - pit;
const sideSum = (v: MancalaVariant, pits: readonly number[], seat: 0 | 1) =>
  pits.slice(seat * v.pits, (seat + 1) * v.pits).reduce((a, b) => a + b, 0);

interface Sown {
  pits: number[];
  stores: [number, number];
  again: boolean;
}

/** The result of sowing from `pit` (no legality checks, no game-end handling). */
export function sow(
  v: MancalaVariant,
  s: Pick<MancalaState, 'pits' | 'stores' | 'toMove'>,
  pit: number,
): Sown {
  const n = v.pits;
  const me = s.toMove;
  const pits = s.pits.slice();
  const stores: [number, number] = [...s.stores];
  let hand = pits[pit]!;
  pits[pit] = 0;
  // Positions: 0…2n−1 are pits; −1 stands for the mover's store.
  let pos = pit;
  let last = pit;
  let inStore = false;
  let laps = 0;
  for (;;) {
    while (hand > 0) {
      // Step to the next position.
      if (inStore) {
        inStore = false;
        pos = me === 0 ? n : 0;
      } else if (v.stores && pos === (me === 0 ? n - 1 : 2 * n - 1)) {
        inStore = true;
      } else {
        pos = (pos + 1) % (2 * n);
        if (pos === pit && v.skipOrigin) pos = (pos + 1) % (2 * n);
      }
      if (inStore) stores[me]++;
      else pits[pos]!++;
      hand--;
      last = pos;
      laps++;
    }
    if (inStore) return { pits, stores, again: true };
    // Relay sowing: a last seed into a pit that already held seeds keeps going.
    if (v.relay && pits[last]! > 1 && laps < 10_000) {
      hand = pits[last]!;
      pits[last] = 0;
      continue;
    }
    break;
  }
  if (v.capture === 'empty') {
    const opp = opposite(v, last);
    if (owner(v, last) === me && pits[last] === 1 && pits[opp]! > 0) {
      stores[me] += pits[opp]! + 1;
      pits[opp] = 0;
      pits[last] = 0;
    }
  } else if (owner(v, last) !== me) {
    const taken: number[] = [];
    for (let p = last; owner(v, p) !== me && (pits[p] === 2 || pits[p] === 3); p--) taken.push(p);
    const total = taken.reduce((a, p) => a + pits[p]!, 0);
    // Grand slam: taking every opponent seed is not allowed (the move captures nothing).
    if (taken.length && total < sideSum(v, pits, owner(v, last))) {
      for (const p of taken) pits[p] = 0;
      stores[me] += total;
    }
  }
  return { pits, stores, again: false };
}

/** The second player's one chance to swap sides: right after the first player's opening turn. */
export const canSwap = (v: MancalaVariant, s: MancalaState) =>
  v.pieRule &&
  !s.result &&
  s.toMove === 1 &&
  s.history.length > 0 &&
  s.movers.every((m) => m === 0);

export function legalMancalaActions(v: MancalaVariant, s: MancalaState): string[] {
  if (s.result) return [];
  const me = s.toMove;
  const swap = canSwap(v, s) ? ['swap'] : [];
  const own = Array.from({ length: v.pits }, (_, i) => me * v.pits + i).filter(
    (p) => s.pits[p]! > 0,
  );
  if (v.mustFeed && sideSum(v, s.pits, (1 - me) as 0 | 1) === 0) {
    const feeding = own.filter((p) => sideSum(v, sow(v, s, p).pits, (1 - me) as 0 | 1) > 0);
    return [...feeding.map(String), ...swap];
  }
  return [...own.map(String), ...swap];
}

/** Ends the game, handing the seeds still on the board to their side's owner (or the keeper). */
function finish(
  v: MancalaVariant,
  pits: number[],
  stores: [number, number],
  reason: NonNullable<MancalaState['result']>['reason'],
) {
  const final: [number, number] = [
    stores[0] + sideSum(v, pits, 0),
    stores[1] + sideSum(v, pits, 1),
  ];
  const winner = final[0] === final[1] ? null : final[0] > final[1] ? 0 : 1;
  return {
    pits: pits.map(() => 0),
    stores: final,
    result: { winner, reason } as MancalaState['result'],
  };
}

export function applyMancalaAction(v: MancalaVariant, s: MancalaState, a: string): MancalaState {
  if (s.result || !legalMancalaActions(v, s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const me = s.toMove;
  if (a === 'swap') {
    // Mirror the board: the second player now owns the side the first player built.
    const n = v.pits;
    const pits = s.pits.map((_, i) => s.pits[(i + n) % (2 * n)]!);
    const stores: [number, number] = [s.stores[1], s.stores[0]];
    const base = { pits, stores, toMove: 0 as const };
    return {
      ...base,
      movers: [...s.movers, me],
      history: [...s.history, a],
      keys: [...s.keys, keyOf(base)],
      result: null,
    };
  }
  const sown = sow(v, s, Number(a));
  const toMove = sown.again ? me : ((1 - me) as 0 | 1);
  const movers = [...s.movers, me];
  const history = [...s.history, a];
  const base = { pits: sown.pits, stores: sown.stores, toMove };
  const keys = [...s.keys, keyOf(base)];
  const next: MancalaState = { ...base, movers, history, keys, result: null };
  const total = 2 * v.pits * v.seeds;
  if (!v.stores && Math.max(...sown.stores) > total / 2) {
    return {
      ...next,
      result: { winner: sown.stores[0] > sown.stores[1] ? 0 : 1, reason: 'majority' },
    };
  }
  // Store games end as soon as either row is empty; Oware when the side to move cannot play.
  const rowEmpty = v.stores && (sideSum(v, sown.pits, 0) === 0 || sideSum(v, sown.pits, 1) === 0);
  if (rowEmpty || legalMancalaActions(v, next).length === 0)
    return { ...next, ...finish(v, sown.pits, sown.stores, 'empty') };
  if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    return { ...next, ...finish(v, sown.pits, sown.stores, 'repetition') };
  if (history.length >= v.plyLimit)
    return { ...next, ...finish(v, sown.pits, sown.stores, 'limit') };
  return next;
}

export function replayMancala(v: MancalaVariant, history: readonly string[]): MancalaState {
  return history.reduce((s, a) => applyMancalaAction(v, s, a), createMancalaState(v));
}

export function isValidMancalaState(v: MancalaVariant, data: unknown): data is MancalaState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayMancala(v, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
