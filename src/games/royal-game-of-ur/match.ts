/**
 * A game of Ur: whose turn, the throw (four binary dice from a generator stored in the state),
 * moves, extra turns on rosettes, and the winner. Actions: "throw", "pass" (a 0 or no legal move),
 * and "move:<square>" (0 enters a waiting piece). Saves are validated by replaying the actions.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import {
  PIECES,
  applyMove,
  legalMoves,
  opp,
  posKey,
  startPosition,
  type Side,
  type UrMove,
  type UrPosition,
} from './engine';

export interface UrGame {
  seed: number;
  rng: RngState;
  pos: UrPosition;
  turn: Side;
  /** The four dice of the current throw (true = marked tip up), or null before throwing. */
  dice: boolean[] | null;
  phase: 'throw' | 'move' | 'over';
  winner: Side | null;
  /** Pieces each side has captured, for the table and achievements. */
  captures: [number, number];
  history: string[];
}

export const rollOf = (g: UrGame) => (g.dice ? g.dice.filter(Boolean).length : 0);

export function newUr(seed: number): UrGame {
  // The first player is decided by the seed's lowest bit.
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    pos: startPosition(),
    turn: (seed & 1) as Side,
    dice: null,
    phase: 'throw',
    winner: null,
    captures: [0, 0],
    history: [],
  };
}

export const movesOf = (g: UrGame): UrMove[] =>
  g.phase === 'move' ? legalMoves(g.pos, g.turn, rollOf(g)) : [];

export function legalActions(g: UrGame): string[] {
  if (g.phase === 'throw') return ['throw'];
  if (g.phase === 'move') {
    const moves = movesOf(g);
    return moves.length ? moves.map((m) => `move:${m.from}`) : ['pass'];
  }
  return [];
}

export function act(g: UrGame, action: string): UrGame {
  const next = actInner(g, action);
  return next === g ? g : { ...next, history: [...g.history, action] };
}

function actInner(g: UrGame, action: string): UrGame {
  if (g.phase === 'throw') {
    if (action !== 'throw') return g;
    const [x, rng] = nextUint32(g.rng);
    const dice = [0, 1, 2, 3].map((i) => ((x >>> i) & 1) === 1);
    return { ...g, rng, dice, phase: 'move' };
  }
  if (g.phase !== 'move') return g;
  const moves = movesOf(g);
  if (action === 'pass')
    return moves.length ? g : { ...g, turn: opp(g.turn), dice: null, phase: 'throw' };
  const from = action.startsWith('move:') ? Number(action.slice(5)) : NaN;
  const m = moves.find((x) => x.from === from);
  if (!m) return g;
  const pos = applyMove(g.pos, g.turn, m);
  const captures: [number, number] = [g.captures[0], g.captures[1]];
  if (m.capture) captures[g.turn]++;
  if (pos.off[g.turn] === PIECES)
    return { ...g, pos, captures, dice: null, phase: 'over', winner: g.turn };
  return {
    ...g,
    pos,
    captures,
    dice: null,
    phase: 'throw',
    turn: m.rosette ? g.turn : opp(g.turn),
  };
}

export function isValidUr(d: unknown): d is UrGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as UrGame;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newUr(s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    posKey(g.pos) === posKey(s.pos) &&
    JSON.stringify([g.turn, g.dice, g.phase, g.winner, g.rng, g.captures]) ===
      JSON.stringify([s.turn, s.dice, s.phase, s.winner, s.rng, s.captures])
  );
}
