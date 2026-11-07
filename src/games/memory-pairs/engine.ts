/**
 * Memory Pairs (concentration): face-down cards in a grid, every face twice. A turn turns two
 * cards over; a matching pair is taken and the same player goes again, otherwise both are turned
 * back and the turn passes. Solo, the aim is to clear the grid in as few turns as possible; against
 * the computer, the most pairs win (ties possible).
 *
 * Every card turned over is public knowledge (`known`): what each player remembers of it is their
 * own business. Cards are dealt from the seed.
 *
 * Actions: "flip:<i>".
 */
import { nextUint32, seedRng } from '../../core/game-engine/random';

export const SIZES: Record<string, [number, number]> = {
  small: [4, 4],
  medium: [4, 6],
  large: [6, 6],
};

export interface MemoryGame {
  size: string;
  seed: number;
  players: number;
  /** Face of each card, by position. */
  faces: number[];
  taken: boolean[];
  /** Faces seen so far, by position (public knowledge). */
  known: Record<number, number>;
  /** Order in which positions were turned over (for imperfect memories). */
  flips: number[];
  /** The card turned over first this turn, if any. */
  open: number | null;
  /** The last pair turned over (shown until the next flip). */
  last: [number, number] | null;
  turn: number;
  pairs: number[];
  turns: number[];
  phase: 'play' | 'over';
  history: string[];
}

export function newMemory(size: string, players: number, seed: number): MemoryGame {
  const [rows, cols] = SIZES[size] ?? SIZES.small!;
  const n = (rows * cols) / 2;
  let rng = seedRng(seed >>> 0);
  const faces = Array.from({ length: n * 2 }, (_, i) => Math.floor(i / 2));
  for (let i = faces.length - 1; i > 0; i--) {
    const [x, next] = nextUint32(rng);
    rng = next;
    const j = x % (i + 1);
    [faces[i], faces[j]] = [faces[j]!, faces[i]!];
  }
  return {
    size: SIZES[size] ? size : 'small',
    seed: seed >>> 0,
    players,
    faces,
    taken: faces.map(() => false),
    known: {},
    flips: [],
    open: null,
    last: null,
    turn: 0,
    pairs: new Array<number>(players).fill(0),
    turns: new Array<number>(players).fill(0),
    phase: 'play',
    history: [],
  };
}

export function legalActions(g: MemoryGame): string[] {
  if (g.phase !== 'play') return [];
  return g.faces.flatMap((_, i) => (!g.taken[i] && i !== g.open ? [`flip:${i}`] : []));
}

export function act(g: MemoryGame, action: string): MemoryGame {
  if (!legalActions(g).includes(action)) return g;
  const i = Number(action.slice(5));
  const known = { ...g.known, [i]: g.faces[i]! };
  const flips = [...g.flips, i];
  const history = [...g.history, action];
  if (g.open === null) return { ...g, known, flips, open: i, last: null, history };
  const a = g.open;
  const turns = g.turns.map((t, p) => (p === g.turn ? t + 1 : t));
  if (g.faces[a] === g.faces[i]) {
    const taken = g.taken.map((x, k) => x || k === a || k === i);
    const pairs = g.pairs.map((s, p) => (p === g.turn ? s + 1 : s));
    const over = taken.every(Boolean);
    return {
      ...g,
      known,
      flips,
      open: null,
      last: [a, i],
      taken,
      pairs,
      turns,
      phase: over ? 'over' : 'play',
      history,
    };
  }
  return {
    ...g,
    known,
    flips,
    open: null,
    last: [a, i],
    turns,
    turn: (g.turn + 1) % g.players,
    history,
  };
}

/** The winners when the grid is clear (the most pairs; everyone tied for most). */
export function winners(g: MemoryGame): number[] {
  const top = Math.max(...g.pairs);
  return g.pairs.flatMap((s, p) => (s === top ? [p] : []));
}

export function isValidMemory(d: unknown): d is MemoryGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as MemoryGame;
  if (!SIZES[s.size] || ![1, 2].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0)
    return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newMemory(s.size, s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.taken, g.open, g.pairs, g.turn, g.phase]) ===
    JSON.stringify([s.taken, s.open, s.pairs, s.turn, s.phase])
  );
}

/** What a player sees: faces of cards turned over so far (taken or remembered by the table); others hidden. */
export function observe(g: MemoryGame): MemoryGame {
  return { ...g, faces: g.faces.map((f, i) => (i in g.known ? f : -1)) };
}
