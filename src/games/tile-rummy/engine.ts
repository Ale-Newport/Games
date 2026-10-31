/**
 * Tile Rummy for 2–4 players: 104 numbered tiles (1–13 in four colours, two of each) and two
 * jokers. Everyone starts with 14 tiles. On a turn a player either plays — puts tiles from their
 * rack on the table, rearranging the table freely, as long as every set on the table ends up valid —
 * or draws a tile from the pool (passing when it is empty). A set is a run (three or more
 * consecutive numbers of one colour) or a group (three or four of one number in different colours);
 * a joker stands for any tile. A player's first play must be made from their own tiles alone and
 * be worth at least 30. The first to empty their rack wins and scores what the others still hold
 * (a joker counts 30), and the others lose their own totals. If the pool is empty and everyone
 * passes in turn, the lowest rack wins the same way.
 *
 * Tile ids: 0–103 are numbered (colour = ⌊id / 26⌋, number = ⌊(id mod 26) / 2⌋ + 1), 104 and 105
 * are jokers. Actions: "draw", "pass", and "play:<set>|<set>|…" with each set a comma list of tile
 * ids — the whole table after the play.
 */
import { nextUint32, seedRng } from '../../core/game-engine/random';
import { candidatePlays } from './plays';
import { HAND, INITIAL_MELD, rackValue, readSet, setValue, sortRack } from './sets';

export interface RummyGame {
  seed: number;
  players: number;
  racks: number[][];
  pool: number[];
  table: number[][];
  turn: number;
  /** Players who have made their initial meld. */
  melded: boolean[];
  /** Consecutive passes with an empty pool. */
  passes: number;
  phase: 'play' | 'over';
  winner: number | null;
  /** Final points per player (positive for the winner). */
  result: number[] | null;
  /** What the last action did, for the table. */
  event: { kind: 'play' | 'draw' | 'pass'; player: number; tiles: number } | null;
  history: string[];
}

export function newRummy(players: number, seed: number): RummyGame {
  let rng = seedRng(seed >>> 0);
  const tiles = Array.from({ length: 106 }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const [x, next] = nextUint32(rng);
    rng = next;
    const j = x % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return {
    seed: seed >>> 0,
    players,
    racks: Array.from({ length: players }, (_, p) =>
      sortRack(tiles.slice(p * HAND, (p + 1) * HAND)),
    ),
    pool: tiles.slice(players * HAND),
    table: [],
    turn: 0,
    melded: new Array<boolean>(players).fill(false),
    passes: 0,
    phase: 'play',
    winner: null,
    result: null,
    event: null,
    history: [],
  };
}

export const encodePlay = (table: number[][]) => `play:${table.map((s) => s.join(',')).join('|')}`;
export function decodePlay(action: string): number[][] | null {
  if (!action.startsWith('play:')) return null;
  const body = action.slice(5);
  if (!body) return [];
  const sets = body.split('|').map((s) => s.split(',').map(Number));
  return sets.every((s) => s.every((t) => Number.isInteger(t) && t >= 0 && t < 106)) ? sets : null;
}

const key = (set: readonly number[]) => [...set].sort((a, b) => a - b).join(',');

/** Why a proposed table is not a legal play for the player to move, or null when it is. */
export function playProblem(
  g: RummyGame,
  table: number[][],
): 'sets' | 'tiles' | 'nothing' | 'meld' | null {
  if (g.phase !== 'play') return 'tiles';
  if (table.some((s) => !readSet(s))) return 'sets';
  const before = g.table.flat();
  const after = table.flat();
  if (new Set(after).size !== after.length) return 'tiles';
  const rack = new Set(g.racks[g.turn]);
  const beforeSet = new Set(before);
  // Every table tile stays on the table; the new ones come from the rack.
  if (before.some((t) => !after.includes(t))) return 'tiles';
  const added = after.filter((t) => !beforeSet.has(t));
  if (added.some((t) => !rack.has(t))) return 'tiles';
  if (!added.length) return 'nothing';
  if (!g.melded[g.turn]) {
    // The first play leaves the table as it was and adds sets of the player's own tiles worth 30.
    const old = new Map<string, number>();
    for (const s of g.table) old.set(key(s), (old.get(key(s)) ?? 0) + 1);
    const fresh: number[][] = [];
    for (const s of table) {
      const k = key(s);
      if ((old.get(k) ?? 0) > 0) old.set(k, old.get(k)! - 1);
      else fresh.push(s);
    }
    if ([...old.values()].some((n) => n > 0)) return 'meld';
    if (fresh.some((s) => s.some((t) => beforeSet.has(t)))) return 'meld';
    if (fresh.reduce((a, s) => a + setValue(s), 0) < INITIAL_MELD) return 'meld';
  }
  return null;
}

export function legalActions(g: RummyGame): string[] {
  if (g.phase !== 'play') return [];
  // Agents choose among the plays the generator finds; any other valid table is accepted by `act`.
  const plays = candidatePlays(g.table, g.racks[g.turn]!, g.melded[g.turn]!).map(encodePlay);
  return [...plays, g.pool.length ? 'draw' : 'pass'];
}

function finish(g: RummyGame, winner: number): RummyGame {
  const values = g.racks.map(rackValue);
  // Out: the winner scores everything left. Blocked: the lowest rack scores the others minus its own.
  const out = values[winner] === 0;
  const result = values.map((v, p) =>
    p === winner ? values.reduce((a, x, q) => (q === winner ? a : a + x), 0) - (out ? 0 : v) : -v,
  );
  return { ...g, phase: 'over', winner, result };
}

export function act(g: RummyGame, action: string): RummyGame {
  if (g.phase !== 'play') return g;
  const history = [...g.history, action];
  const seat = g.turn;
  const next = (seat + 1) % g.players;
  if (action === 'draw' || action === 'pass') {
    if (action === 'draw' && !g.pool.length) return g;
    if (action === 'pass' && g.pool.length) return g;
    if (action === 'draw') {
      const [t, ...pool] = g.pool;
      const racks = g.racks.map((r, i) => (i === seat ? sortRack([...r, t!]) : r));
      return {
        ...g,
        racks,
        pool,
        turn: next,
        passes: 0,
        event: { kind: 'draw', player: seat, tiles: 1 },
        history,
      };
    }
    const passes = g.passes + 1;
    const passed = {
      ...g,
      passes,
      turn: next,
      event: { kind: 'pass' as const, player: seat, tiles: 0 },
      history,
    };
    if (passes >= g.players) {
      const values = g.racks.map(rackValue);
      const low = Math.min(...values);
      return finish(passed, values.indexOf(low));
    }
    return passed;
  }
  const table = decodePlay(action);
  if (!table || playProblem(g, table)) return g;
  const placed = new Set(table.flat());
  const before = new Set(g.table.flat());
  const used = [...placed].filter((t) => !before.has(t));
  const racks = g.racks.map((r, i) => (i === seat ? r.filter((t) => !placed.has(t)) : r));
  const played: RummyGame = {
    ...g,
    racks,
    table,
    melded: g.melded.map((m, i) => m || i === seat),
    passes: 0,
    turn: next,
    event: { kind: 'play', player: seat, tiles: used.length },
    history,
  };
  return racks[seat]!.length ? played : finish({ ...played, turn: seat }, seat);
}

export function isValidRummy(d: unknown): d is RummyGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as RummyGame;
  if (![2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newRummy(s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.racks, g.table, g.turn, g.phase, g.pool.length]) ===
    JSON.stringify([s.racks, s.table, s.turn, s.phase, s.pool?.length])
  );
}

/** What a seat may see: its own rack, the table, everyone's rack sizes; the pool's order hidden. */
export function observe(g: RummyGame, seat: number): RummyGame {
  if (g.phase === 'over') return { ...g, pool: g.pool.map(() => -1) };
  return {
    ...g,
    racks: g.racks.map((r, i) => (i === seat ? r : r.map(() => -1))),
    pool: g.pool.map(() => -1),
  };
}
