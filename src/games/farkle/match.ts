/**
 * A game of Farkle for 1–4 players: whose turn, the dice rolled and the dice set aside, the points
 * at stake, banked scores, the 500 opening rule, and the final round once someone reaches 10 000
 * (every other player gets one more turn; the highest score wins). Dice come from a generator
 * stored in the state. Actions: "roll", and "keep:<counts>:roll" or "keep:<counts>:bank" to set
 * aside a scoring choice (six digits, dice per face) and roll on or bank.
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import { OPENING, TARGET, canScore, countsOf, scoringChoices, type Counts } from './engine';

export interface FarkleGame {
  seed: number;
  rng: RngState;
  players: number;
  scores: number[];
  opened: boolean[];
  turn: number;
  /** The dice of the last roll (values), or null before rolling. */
  dice: number[] | null;
  /** Dice set aside this turn (values). */
  aside: number[];
  stake: number;
  phase: 'roll' | 'choose' | 'over';
  /** The seat that first reached the target (the others get one more turn), or null. */
  finalFrom: number | null;
  winner: number | null;
  farkles: number[];
  /** Turns finished per seat (a solo game is scored by turns to 10 000). */
  turns: number[];
  /** What just happened, for the table: a farkle, hot dice, a bank. */
  event: { kind: 'farkle' | 'hot' | 'bank'; player: number; points: number } | null;
  history: string[];
}

export function newFarkle(players: number, seed: number): FarkleGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    players,
    scores: new Array<number>(players).fill(0),
    opened: new Array<boolean>(players).fill(false),
    turn: 0,
    dice: null,
    aside: [],
    stake: 0,
    phase: 'roll',
    finalFrom: null,
    winner: null,
    farkles: new Array<number>(players).fill(0),
    turns: new Array<number>(players).fill(0),
    event: null,
    history: [],
  };
}

export const rollCounts = (g: FarkleGame): Counts | null => (g.dice ? countsOf(g.dice) : null);

/** Whether banking `stake` is allowed (the opening rule, and beating the leader in the final round). */
export function canBank(g: FarkleGame, stake: number): boolean {
  if (!g.opened[g.turn] && stake < OPENING) return false;
  if (g.finalFrom !== null) {
    const leader = Math.max(...g.scores);
    return g.scores[g.turn]! + stake > leader;
  }
  return stake > 0;
}

export function legalActions(g: FarkleGame): string[] {
  if (g.phase === 'roll') return ['roll'];
  if (g.phase !== 'choose') return [];
  const out: string[] = [];
  for (const ch of scoringChoices(rollCounts(g)!)) {
    const code = ch.keep.join('');
    out.push(`keep:${code}:roll`);
    if (canBank(g, g.stake + ch.points)) out.push(`keep:${code}:bank`);
  }
  return out;
}

/** Ends the turn: the next seat, or the end of the game after the final round. */
function nextTurn(prev: FarkleGame): FarkleGame {
  const turns = [...prev.turns];
  turns[prev.turn]!++;
  const g = { ...prev, turns };
  const turn = (g.turn + 1) % g.players;
  if (g.finalFrom !== null && turn === g.finalFrom) {
    const top = Math.max(...g.scores);
    return { ...g, dice: null, aside: [], stake: 0, phase: 'over', winner: g.scores.indexOf(top) };
  }
  return { ...g, dice: null, aside: [], stake: 0, phase: 'roll', turn };
}

export function act(g: FarkleGame, action: string): FarkleGame {
  if (!legalActions(g).includes(action)) return g;
  const next = actInner(g, action);
  return { ...next, history: [...g.history, action] };
}

function actInner(g: FarkleGame, action: string): FarkleGame {
  if (action === 'roll') {
    // Hot dice: when all six are aside, all six roll again.
    const aside = g.aside.length >= 6 ? [] : g.aside;
    let rng = g.rng;
    const dice = Array.from({ length: 6 - aside.length }, () => {
      const [x, next] = nextUint32(rng);
      rng = next;
      return 1 + (x % 6);
    });
    if (!canScore(countsOf(dice))) {
      const farkles = [...g.farkles];
      farkles[g.turn]!++;
      return nextTurn({
        ...g,
        rng,
        farkles,
        event: { kind: 'farkle', player: g.turn, points: g.stake },
      });
    }
    return { ...g, rng, dice, aside, phase: 'choose', event: null };
  }
  const [, code, then] = action.split(':');
  const keep = code!.split('').map(Number) as Counts;
  const points = scoringChoices(rollCounts(g)!).find((c) => c.keep.join('') === code)!.points;
  const aside = [...g.aside, ...keep.flatMap((k, f) => new Array<number>(k).fill(f + 1))];
  const stake = g.stake + points;
  if (then === 'bank') {
    const scores = [...g.scores];
    scores[g.turn] = scores[g.turn]! + stake;
    const opened = [...g.opened];
    opened[g.turn] = true;
    const finalFrom = g.finalFrom ?? (scores[g.turn]! >= TARGET ? g.turn : null);
    const banked = {
      ...g,
      scores,
      opened,
      finalFrom,
      event: { kind: 'bank' as const, player: g.turn, points: stake },
    };
    if (g.players === 1 && scores[0]! >= TARGET) {
      const turns = [g.turns[0]! + 1];
      return { ...banked, turns, dice: null, aside: [], stake: 0, phase: 'over', winner: 0 };
    }
    return nextTurn(banked);
  }
  return {
    ...g,
    aside,
    stake,
    dice: null,
    phase: 'roll',
    event: aside.length >= 6 ? { kind: 'hot', player: g.turn, points: stake } : null,
  };
}

export function isValidFarkle(d: unknown): d is FarkleGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as FarkleGame;
  if (![1, 2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newFarkle(s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.scores, g.turn, g.dice, g.aside, g.stake, g.phase, g.rng]) ===
    JSON.stringify([s.scores, s.turn, s.dice, s.aside, s.stake, s.phase, s.rng])
  );
}
