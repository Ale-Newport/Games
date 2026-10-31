/**
 * A game of Shut the Box for 1–4 players: each plays one turn on a fresh box; the lowest score wins,
 * and shutting the box wins at once. Dice come from a generator stored in the state. Actions:
 * "roll:2" or "roll:1" (one die, when allowed), and "shut:<mask>" (the tiles to shut, as a number).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { ALL_OPEN, boxScore, oneDieAllowed, shutOptions } from './engine';

export interface ShutGame {
  seed: number;
  rng: RngState;
  players: number;
  /** The box of the player to move. */
  box: number;
  /** Final scores of the turns played so far (null for players still to play). */
  scores: (number | null)[];
  turn: number;
  dice: number[] | null;
  phase: 'roll' | 'shut' | 'over';
  winners: number[];
  history: string[];
}

export function newShut(players: number, seed: number): ShutGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    players,
    box: ALL_OPEN,
    scores: new Array<number | null>(players).fill(null),
    turn: 0,
    dice: null,
    phase: 'roll',
    winners: [],
    history: [],
  };
}

export const throwTotal = (g: ShutGame) => (g.dice ? g.dice.reduce((a, b) => a + b, 0) : 0);

export function legalActions(g: ShutGame): string[] {
  if (g.phase === 'roll') return oneDieAllowed(g.box) ? ['roll:2', 'roll:1'] : ['roll:2'];
  if (g.phase === 'shut') return shutOptions(g.box, throwTotal(g)).map((m) => `shut:${m}`);
  return [];
}

/** Ends the current player's turn with the box as it is. */
function finishTurn(g: ShutGame): ShutGame {
  const scores = [...g.scores];
  scores[g.turn] = boxScore(g.box);
  // Shutting the box wins at once.
  if (g.box === 0) return { ...g, scores, dice: null, phase: 'over', winners: [g.turn] };
  if (g.turn + 1 >= g.players) {
    const best = Math.min(...(scores as number[]));
    return {
      ...g,
      scores,
      dice: null,
      phase: 'over',
      winners: scores.flatMap((s, p) => (s === best ? [p] : [])),
    };
  }
  return { ...g, scores, dice: null, phase: 'roll', turn: g.turn + 1, box: ALL_OPEN };
}

export function act(g: ShutGame, action: string): ShutGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  if (action.startsWith('roll:')) {
    let rng = g.rng;
    const dice = Array.from({ length: Number(action.slice(5)) }, () => {
      const [x, next] = nextUint32(rng);
      rng = next;
      return 1 + (x % 6);
    });
    const next = { ...g, rng, dice, history };
    return shutOptions(
      g.box,
      dice.reduce((a, b) => a + b, 0),
    ).length
      ? { ...next, phase: 'shut' }
      : finishTurn(next);
  }
  const box = g.box & ~Number(action.slice(5));
  const next = { ...g, box, dice: null, phase: 'roll' as const, history };
  return box === 0 ? finishTurn(next) : next;
}

export function isValidShut(d: unknown): d is ShutGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as ShutGame;
  if (![1, 2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newShut(s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.box, g.scores, g.turn, g.dice, g.phase, g.rng]) ===
    JSON.stringify([s.box, s.scores, s.turn, s.dice, s.phase, s.rng])
  );
}
