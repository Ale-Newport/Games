/**
 * Pig, the simplest push-your-luck dice game: two players race to 100. On a turn a player rolls one
 * die as often as they like, adding each throw to the turn total, and holds to bank it; a 1 ends the
 * turn and loses the turn total. Dice come from a generator stored in the state.
 *
 * The optimal policy (the one that maximizes the chance of winning, after Neller and Presser) is
 * found by value iteration over (my score, opponent's score, turn total): about 0.7 s, once.
 * Actions: "roll", "hold".
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const GOAL = 100;

export interface PigGame {
  seed: number;
  rng: RngState;
  scores: [number, number];
  turn: 0 | 1;
  turnTotal: number;
  /** The last throw, or null. */
  last: number | null;
  phase: 'play' | 'over';
  winner: 0 | 1 | null;
  /** What just happened: a 1 lost the turn total, or a hold banked it. */
  event: { kind: 'pig' | 'hold'; player: 0 | 1; points: number } | null;
  history: string[];
}

export function newPig(seed: number): PigGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    scores: [0, 0],
    turn: (seed & 1) as 0 | 1,
    turnTotal: 0,
    last: null,
    phase: 'play',
    winner: null,
    event: null,
    history: [],
  };
}

export const legalActions = (g: PigGame) =>
  g.phase === 'over' ? [] : g.turnTotal > 0 ? ['roll', 'hold'] : ['roll'];

const other = (p: 0 | 1): 0 | 1 => (p === 0 ? 1 : 0);

export function act(g: PigGame, action: string): PigGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  if (action === 'hold') {
    const scores: [number, number] = [g.scores[0], g.scores[1]];
    scores[g.turn] += g.turnTotal;
    const event = { kind: 'hold' as const, player: g.turn, points: g.turnTotal };
    if (scores[g.turn] >= GOAL)
      return { ...g, scores, turnTotal: 0, phase: 'over', winner: g.turn, event, history };
    return { ...g, scores, turnTotal: 0, turn: other(g.turn), last: null, event, history };
  }
  const [x, rng] = nextUint32(g.rng);
  const die = 1 + (x % 6);
  if (die === 1)
    return {
      ...g,
      rng,
      last: 1,
      turnTotal: 0,
      turn: other(g.turn),
      event: { kind: 'pig', player: g.turn, points: g.turnTotal },
      history,
    };
  const turnTotal = g.turnTotal + die;
  // Reaching the goal wins at once (holding is automatic).
  if (g.scores[g.turn] + turnTotal >= GOAL) {
    const scores: [number, number] = [g.scores[0], g.scores[1]];
    scores[g.turn] += turnTotal;
    return {
      ...g,
      rng,
      last: die,
      scores,
      turnTotal: 0,
      phase: 'over',
      winner: g.turn,
      event: null,
      history,
    };
  }
  return { ...g, rng, last: die, turnTotal, event: null, history };
}

export function isValidPig(d: unknown): d is PigGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as PigGame;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => a === 'roll' || a === 'hold'))
    return false;
  let g = newPig(s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.scores, g.turn, g.turnTotal, g.phase, g.rng]) ===
    JSON.stringify([s.scores, s.turn, s.turnTotal, s.phase, s.rng])
  );
}

const idx = (i: number, j: number, k: number) => (i * GOAL + j) * GOAL + k;
let solved: Float64Array | null = null;

/** P(win) for the player to move with score i, opponent j and turn total k, playing optimally. */
export function winTable(): Float64Array {
  if (solved) return solved;
  const P = new Float64Array(GOAL * GOAL * GOAL);
  for (let iter = 0; iter < 500; iter++) {
    let delta = 0;
    for (let i = GOAL - 1; i >= 0; i--)
      for (let j = GOAL - 1; j >= 0; j--)
        for (let k = GOAL - 1 - i; k >= 0; k--) {
          const hold = i + k >= GOAL ? 1 : 1 - P[idx(j, i + k, 0)]!;
          let roll = (1 - P[idx(j, i, 0)]!) / 6;
          for (let r = 2; r <= 6; r++) roll += (i + k + r >= GOAL ? 1 : P[idx(i, j, k + r)]!) / 6;
          const v = Math.max(hold, roll);
          const d = Math.abs(v - P[idx(i, j, k)]!);
          if (d > delta) delta = d;
          P[idx(i, j, k)] = v;
        }
    if (delta < 1e-9) break;
  }
  solved = P;
  return P;
}

/** The chance the player to move wins, under optimal play by both. */
export const winChance = (g: PigGame) => {
  const P = winTable();
  const me = g.scores[g.turn];
  return P[idx(me, g.scores[other(g.turn)], Math.min(g.turnTotal, GOAL - 1 - me))]!;
};

/** The optimal choice: hold when banking is worth at least as much as rolling. */
export function optimalAction(g: PigGame): 'roll' | 'hold' {
  if (g.turnTotal === 0) return 'roll';
  const P = winTable();
  const i = g.scores[g.turn];
  const j = g.scores[other(g.turn)];
  const k = g.turnTotal;
  const hold = i + k >= GOAL ? 1 : 1 - P[idx(j, i + k, 0)]!;
  let roll = (1 - P[idx(j, i, 0)]!) / 6;
  for (let r = 2; r <= 6; r++) roll += (i + k + r >= GOAL ? 1 : P[idx(i, j, k + r)]!) / 6;
  return hold >= roll ? 'hold' : 'roll';
}

/** The classic rule of thumb: hold at 20 (or when the turn total reaches the goal). */
export const holdAt20 = (g: PigGame): 'roll' | 'hold' =>
  g.turnTotal >= 20 || g.scores[g.turn] + g.turnTotal >= GOAL
    ? g.turnTotal > 0
      ? 'hold'
      : 'roll'
    : 'roll';
