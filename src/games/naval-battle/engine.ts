/**
 * Naval Battle: two hidden 10 × 10 grids, each with a fleet of five ships (5, 4, 3, 3 and 2 cells),
 * placed in straight lines that do not overlap (they may touch). Players take turns firing at a cell
 * of the other grid and are told miss, hit, or which ship was sunk. The first to sink the whole
 * enemy fleet wins.
 *
 * Fleets: seat 0's may be placed by the player (stored in the state) or at random; seat 1's is
 * placed at random from the seed. Cells are numbered row × 10 + column.
 *
 * Actions: "fire:<cell>".
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const SIZE = 10;
export const FLEET = [5, 4, 3, 3, 2];

export interface Ship {
  cells: number[];
}

export type Shot = 'miss' | 'hit' | 'sunk';

export interface NavalGame {
  seed: number;
  fleets: [Ship[], Ship[]];
  /** Shots fired by each seat at the other's grid: cell → result. */
  shots: [Record<number, Shot>, Record<number, Shot>];
  turn: 0 | 1;
  phase: 'play' | 'over';
  winner: 0 | 1 | null;
  /** The last shot (for the table). */
  last: { seat: 0 | 1; cell: number; result: Shot; ship: number | null } | null;
  history: string[];
}

/** The cells of a ship of `length` starting at `cell`, horizontal or vertical, or null off the grid. */
export function shipCells(cell: number, length: number, vertical: boolean): number[] | null {
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  if (vertical ? r + length > SIZE : c + length > SIZE) return null;
  return Array.from({ length }, (_, i) => (vertical ? cell + i * SIZE : cell + i));
}

export function isValidFleet(fleet: Ship[]): boolean {
  if (fleet.length !== FLEET.length) return false;
  const lengths = fleet.map((s) => s.cells.length).sort((a, b) => b - a);
  if (lengths.join() !== [...FLEET].sort((a, b) => b - a).join()) return false;
  const used = new Set<number>();
  for (const s of fleet) {
    const cells = [...s.cells].sort((a, b) => a - b);
    const line = shipCells(
      cells[0]!,
      cells.length,
      cells.length > 1 && cells[1]! - cells[0]! === SIZE,
    );
    if (!line || line.join() !== cells.join()) return false;
    for (const x of cells) {
      if (used.has(x)) return false;
      used.add(x);
    }
  }
  return true;
}

/** A random fleet (rejection sampling from a generator). */
export function randomFleet(rng: RngState): [Ship[], RngState] {
  let r = rng;
  const rand = (n: number) => {
    const [x, next] = nextUint32(r);
    r = next;
    return x % n;
  };
  const used = new Set<number>();
  const fleet: Ship[] = [];
  for (const length of FLEET) {
    for (;;) {
      const cells = shipCells(rand(SIZE * SIZE), length, rand(2) === 1);
      if (cells && cells.every((x) => !used.has(x))) {
        cells.forEach((x) => used.add(x));
        fleet.push({ cells });
        break;
      }
    }
  }
  return [fleet, r];
}

export function newNaval(seed: number, fleet0?: Ship[]): NavalGame {
  let rng = seedRng(seed >>> 0);
  const [a, r1] = randomFleet(rng);
  rng = r1;
  const [b] = randomFleet(rng);
  return {
    seed: seed >>> 0,
    fleets: [fleet0 && isValidFleet(fleet0) ? fleet0 : a, b],
    shots: [{}, {}],
    turn: 0,
    phase: 'play',
    winner: null,
    last: null,
    history: [],
  };
}

export function legalActions(g: NavalGame): string[] {
  if (g.phase !== 'play') return [];
  const done = g.shots[g.turn];
  const out: string[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (!(i in done)) out.push(`fire:${i}`);
  return out;
}

export function act(g: NavalGame, action: string): NavalGame {
  if (g.phase !== 'play' || !action.startsWith('fire:')) return g;
  const cell = Number(action.slice(5));
  if (!Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE || cell in g.shots[g.turn])
    return g;
  const seat = g.turn;
  const enemy = g.fleets[seat === 0 ? 1 : 0];
  const shots = { ...g.shots[seat] };
  const ship = enemy.findIndex((s) => s.cells.includes(cell));
  let result: Shot = 'miss';
  if (ship >= 0) {
    shots[cell] = 'hit';
    const sunk = enemy[ship]!.cells.every((x) => shots[x] === 'hit' || shots[x] === 'sunk');
    if (sunk) for (const x of enemy[ship]!.cells) shots[x] = 'sunk';
    result = sunk ? 'sunk' : 'hit';
  } else shots[cell] = 'miss';
  const all: NavalGame['shots'] = seat === 0 ? [shots, g.shots[1]] : [g.shots[0], shots];
  const won = enemy.every((s) => s.cells.every((x) => shots[x] === 'sunk'));
  return {
    ...g,
    shots: all,
    turn: won ? seat : seat === 0 ? 1 : 0,
    phase: won ? 'over' : 'play',
    winner: won ? seat : null,
    last: {
      seat,
      cell,
      result,
      ship: ship >= 0 && result === 'sunk' ? enemy[ship]!.cells.length : null,
    },
    history: [...g.history, action],
  };
}

export function isValidNaval(d: unknown): d is NavalGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as NavalGame;
  if (
    !Number.isInteger(s.seed) ||
    s.seed < 0 ||
    !Array.isArray(s.fleets) ||
    !isValidFleet(s.fleets[0]!)
  )
    return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newNaval(s.seed, s.fleets[0]);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.fleets, g.shots, g.turn, g.phase]) ===
    JSON.stringify([s.fleets, s.shots, s.turn, s.phase])
  );
}

/** What a seat sees: its own fleet and both seats' shot results; the enemy fleet only once sunk or over. */
export function observe(g: NavalGame, seat: 0 | 1): NavalGame {
  if (g.phase === 'over') return g;
  const enemy = seat === 0 ? 1 : 0;
  const shots = g.shots[seat];
  const visible = g.fleets[enemy].filter((s) => s.cells.every((x) => shots[x] === 'sunk'));
  const fleets: [Ship[], Ship[]] = seat === 0 ? [g.fleets[0], visible] : [visible, g.fleets[1]];
  return { ...g, fleets };
}

/** Lengths of the enemy ships `seat` has not sunk yet. */
export function afloat(g: NavalGame, seat: 0 | 1): number[] {
  const enemy = g.fleets[seat === 0 ? 1 : 0];
  const shots = g.shots[seat];
  return enemy.filter((s) => !s.cells.every((x) => shots[x] === 'sunk')).map((s) => s.cells.length);
}
