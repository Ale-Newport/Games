/**
 * A game of Senet: whose turn, the throw (four sticks from a generator stored in the state), moves,
 * extra throws on 1, 4 and 5, and the winner. Actions: "throw", "pass" (no legal move) and
 * "move:<square>". Saves are validated by replaying the actions.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import {
  PIECES,
  applyMove,
  extraThrow,
  legalMoves,
  opp,
  posKey,
  startPosition,
  type Side,
  type SenetMove,
  type SenetPosition,
} from './engine';

export interface SenetGame {
  seed: number;
  rng: RngState;
  pos: SenetPosition;
  turn: Side;
  /** The four sticks of the current throw (true = light face up), or null before throwing. */
  dice: boolean[] | null;
  phase: 'throw' | 'move' | 'over';
  winner: Side | null;
  /** Swaps (attacks) each side has made, for the table and achievements. */
  captures: [number, number];
  history: string[];
}

/** The throw: the light faces up, or 5 when none is. */
export const rollOf = (g: SenetGame) => (g.dice ? g.dice.filter(Boolean).length || 5 : 0);

export function newSenet(seed: number): SenetGame {
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

export const movesOf = (g: SenetGame): SenetMove[] =>
  g.phase === 'move' ? legalMoves(g.pos, g.turn, rollOf(g)) : [];

export function legalActions(g: SenetGame): string[] {
  if (g.phase === 'throw') return ['throw'];
  if (g.phase === 'move') {
    const moves = movesOf(g);
    return moves.length ? moves.map((m) => `move:${m.from}`) : ['pass'];
  }
  return [];
}

export function act(g: SenetGame, action: string): SenetGame {
  const next = actInner(g, action);
  return next === g ? g : { ...next, history: [...g.history, action] };
}

function actInner(g: SenetGame, action: string): SenetGame {
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
  if (m.swap) captures[g.turn]++;
  if (pos.off[g.turn] === PIECES)
    return { ...g, pos, captures, dice: null, phase: 'over', winner: g.turn };
  return {
    ...g,
    pos,
    captures,
    dice: null,
    phase: 'throw',
    turn: extraThrow(rollOf(g)) ? g.turn : opp(g.turn),
  };
}

export function isValidSenet(d: unknown): d is SenetGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SenetGame;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newSenet(s.seed);
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
