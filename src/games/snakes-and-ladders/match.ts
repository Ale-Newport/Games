/**
 * A game of Snakes and Ladders: 2–4 players, whose turn, the dice (from a generator stored in the
 * state), and the winner. Actions: "roll" (in the classic game it also moves), and in the Choice
 * variant "use:0" or "use:1" to move by one of the two dice. Saves are validated by replay.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { LADDERS, SIZE, SNAKES, land } from './engine';

export type Variant = 'classic' | 'choice';

export interface SnakesGame {
  seed: number;
  rng: RngState;
  variant: Variant;
  players: number;
  pos: number[];
  turn: number;
  dice: number[] | null;
  phase: 'roll' | 'choose' | 'over';
  winner: number | null;
  /** The last move: who, from, the square reached by the throw, and where it ended. */
  last: { player: number; from: number; reached: number; to: number } | null;
  ladders: number[];
  snakes: number[];
  history: string[];
}

export function newSnakes(variant: Variant, players: number, seed: number): SnakesGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    variant,
    players,
    pos: new Array<number>(players).fill(0),
    turn: 0,
    dice: null,
    phase: 'roll',
    winner: null,
    last: null,
    ladders: new Array<number>(players).fill(0),
    snakes: new Array<number>(players).fill(0),
    history: [],
  };
}

function die(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [1 + (x % 6), next];
}

function moveBy(g: SnakesGame, d: number): SnakesGame {
  const from = g.pos[g.turn]!;
  const reached = from + d > SIZE ? from : from + d;
  const to = land(from, d);
  const pos = [...g.pos];
  pos[g.turn] = to;
  const ladders = [...g.ladders];
  const snakes = [...g.snakes];
  if (LADDERS[reached] !== undefined) ladders[g.turn]!++;
  if (SNAKES[reached] !== undefined) snakes[g.turn]!++;
  const last = { player: g.turn, from, reached, to };
  if (to === SIZE) return { ...g, pos, ladders, snakes, last, phase: 'over', winner: g.turn };
  return { ...g, pos, ladders, snakes, last, phase: 'roll', turn: (g.turn + 1) % g.players };
}

export function legalActions(g: SnakesGame): string[] {
  if (g.phase === 'roll') return ['roll'];
  if (g.phase === 'choose') return g.dice![0] === g.dice![1] ? ['use:0'] : ['use:0', 'use:1'];
  return [];
}

export function act(g: SnakesGame, action: string): SnakesGame {
  const next = actInner(g, action);
  return next === g ? g : { ...next, history: [...g.history, action] };
}

function actInner(g: SnakesGame, action: string): SnakesGame {
  if (g.phase === 'roll' && action === 'roll') {
    if (g.variant === 'classic') {
      const [d, rng] = die(g.rng);
      return moveBy({ ...g, rng, dice: [d] }, d);
    }
    const [a, r1] = die(g.rng);
    const [b, rng] = die(r1);
    return { ...g, rng, dice: [a, b], phase: 'choose' };
  }
  if (g.phase === 'choose' && legalActions(g).includes(action)) {
    const d = g.dice![Number(action.slice(4))]!;
    return moveBy(g, d);
  }
  return g;
}

export function isValidSnakes(d: unknown): d is SnakesGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SnakesGame;
  if (s.variant !== 'classic' && s.variant !== 'choice') return false;
  if (![2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newSnakes(s.variant, s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.pos, g.turn, g.dice, g.phase, g.winner, g.rng]) ===
    JSON.stringify([s.pos, s.turn, s.dice, s.phase, s.winner, s.rng])
  );
}
