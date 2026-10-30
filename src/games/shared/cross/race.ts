/**
 * The race engine shared by the cross-board games. Each player has tokens that wait in a yard,
 * enter on their start square with an exit throw, run the loop round to their own arm and up their
 * home column to home. Token positions are steps along the player's route: −1 in the yard, 0 the
 * start square, up to `last` (home). The rules that differ between games are options: which throws
 * let a token out, extra throws on sixes and the penalty for three in a row, what a capture and a
 * token home earn (another throw, or a bonus move of so many squares), whether two tokens of one
 * colour block the way, the safe squares, and whether a six counts as seven once every token is out.
 *
 * Throws come from a generator stored in the state, so a game replays exactly from its seed and
 * actions: "roll", "pass", "move:<token>" and "bonus:<token>" (a bonus move).
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';
import { crossGeometry, route, startIndex, type CrossGeometry } from './geometry';

export interface RaceRules {
  /** Arm length of the board. */
  L: number;
  tokens: number;
  /** Throws that bring a token out of the yard (it lands on the start square). */
  exitRolls: number[];
  /** A six gives another throw; three sixes in a row end the turn ('forfeit') or also send the last token moved home to the yard ('yard'). */
  extraOnSix: boolean;
  threeSixes: 'forfeit' | 'yard';
  /** What a capture and a token reaching home earn: another throw, or a bonus move of n squares. */
  onCapture: 'roll' | number;
  onHome: 'roll' | number;
  /** Two tokens of one colour on a square: 'safe' cannot be captured; 'barrier' also cannot be passed or landed on by anyone. */
  pairs: 'safe' | 'barrier';
  /** Loop indices of the safe squares. */
  safe: (g: CrossGeometry) => number[];
  /** Once all of a player's tokens are out of the yard, a six moves seven. */
  sixAsSeven: boolean;
}

export interface RaceState {
  seed: number;
  rng: RngState;
  /** The colours (arms) in play, in turn order. */
  seats: number[];
  /** Token steps per seat: −1 yard, 0..last. */
  tokens: number[][];
  turn: number;
  die: number | null;
  /** Sixes thrown in a row this turn. */
  sixes: number;
  /** A pending bonus move of this many squares. */
  bonus: number;
  /** The token moved last (for the three-sixes penalty). */
  lastMoved: number | null;
  phase: 'roll' | 'move' | 'bonus' | 'over';
  winner: number | null;
  captures: number[];
  history: string[];
}

export interface RaceMove {
  token: number;
  from: number;
  to: number;
  /** Seats and tokens captured. */
  captured: [number, number][];
}

export interface RaceGame {
  rules: RaceRules;
  geo: CrossGeometry;
  /** Route cells per colour. */
  routes: ReturnType<typeof route>[];
  /** Steps from the start square to home. */
  last: number;
  safeSet: Set<number>;
}

export function raceGame(rules: RaceRules): RaceGame {
  const geo = crossGeometry(rules.L);
  const routes = [0, 1, 2, 3].map((p) => route(geo, p));
  return { rules, geo, routes, last: routes[0]!.length, safeSet: new Set(rules.safe(geo)) };
}

/** Loop index of a colour's step, or −1 off the loop (yard, home column, home). */
export function loopIndex(game: RaceGame, colour: number, step: number): number {
  const loopSteps = game.geo.loop.length - 1;
  if (step < 0 || step >= loopSteps) return -1;
  return (startIndex(game.geo, colour) + step) % game.geo.loop.length;
}

export function newRace(game: RaceGame, seats: number[], seed: number): RaceState {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    seats,
    tokens: seats.map(() => new Array<number>(game.rules.tokens).fill(-1)),
    turn: 0,
    die: null,
    sixes: 0,
    bonus: 0,
    lastMoved: null,
    phase: 'roll',
    winner: null,
    captures: seats.map(() => 0),
    history: [],
  };
}

/** Tokens of every seat on a loop square: [seat, token][]. */
function occupants(game: RaceGame, s: RaceState, loop: number): [number, number][] {
  const out: [number, number][] = [];
  s.seats.forEach((colour, seat) =>
    s.tokens[seat]!.forEach((step, t) => {
      if (loopIndex(game, colour, step) === loop) out.push([seat, t]);
    }),
  );
  return out;
}

/** A barrier: two tokens of one seat on a loop square. */
function barrierAt(game: RaceGame, s: RaceState, loop: number): number | null {
  const count = new Map<number, number>();
  for (const [seat] of occupants(game, s, loop)) count.set(seat, (count.get(seat) ?? 0) + 1);
  for (const [seat, n] of count) if (n >= 2) return seat;
  return null;
}

/** The legal moves of the seat to play for a distance (a throw or a bonus). */
export function movesFor(
  game: RaceGame,
  s: RaceState,
  distance: number,
  isBonus = false,
): RaceMove[] {
  const { rules } = game;
  const seat = s.turn;
  const colour = s.seats[seat]!;
  const mine = s.tokens[seat]!;
  const allOut = mine.every((x) => x >= 0);
  const d = !isBonus && rules.sixAsSeven && distance === 6 && allOut ? 7 : distance;
  const out: RaceMove[] = [];
  const seen = new Set<number>();
  mine.forEach((from, token) => {
    // Tokens on the same step are interchangeable: offer one.
    if (seen.has(from)) return;
    seen.add(from);
    let to: number;
    if (from < 0) {
      if (isBonus || !rules.exitRolls.includes(distance)) return;
      to = 0;
    } else {
      to = from + d;
      if (to > game.last) return;
    }
    // Barriers cannot be passed (nor the start square entered while one stands on it).
    if (rules.pairs === 'barrier') {
      for (let step = Math.max(0, from + 1); step <= Math.min(to, game.last - 1); step++) {
        const li = loopIndex(game, colour, step);
        if (li < 0) continue;
        const owner = barrierAt(game, s, li);
        if (owner !== null && (owner !== seat || step === to)) return;
      }
    }
    const li = loopIndex(game, colour, to);
    const captured: [number, number][] = [];
    if (li >= 0) {
      const there = occupants(game, s, li).filter(([st]) => st !== seat);
      if (there.length) {
        const safe = game.safeSet.has(li);
        const pair = there.length >= 2 && there.every(([st]) => st === there[0]![0]);
        if (pair && rules.pairs === 'safe') return;
        if (!safe) captured.push(...there);
      }
      if (
        rules.pairs === 'barrier' &&
        mine.filter((x) => loopIndex(game, colour, x) === li).length >= 2
      )
        return;
    }
    out.push({ token, from, to, captured });
  });
  return out;
}

function roll(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [1 + (x % 6), next];
}

const nextSeat = (s: RaceState) => (s.turn + 1) % s.seats.length;

export function currentMoves(game: RaceGame, s: RaceState): RaceMove[] {
  if (s.phase === 'move') return movesFor(game, s, s.die!);
  if (s.phase === 'bonus') return movesFor(game, s, s.bonus, true);
  return [];
}

export function legalActions(game: RaceGame, s: RaceState): string[] {
  if (s.phase === 'roll') return ['roll'];
  if (s.phase === 'move' || s.phase === 'bonus') {
    const moves = currentMoves(game, s);
    const prefix = s.phase === 'bonus' ? 'bonus' : 'move';
    return moves.length ? moves.map((m) => `${prefix}:${m.token}`) : ['pass'];
  }
  return [];
}

export function act(game: RaceGame, s: RaceState, action: string): RaceState {
  const next = actInner(game, s, action);
  return next === s ? s : { ...next, history: [...s.history, action] };
}

function endTurn(s: RaceState, again: boolean): RaceState {
  return again
    ? { ...s, die: null, bonus: 0, phase: 'roll' }
    : { ...s, die: null, bonus: 0, sixes: 0, lastMoved: null, phase: 'roll', turn: nextSeat(s) };
}

function actInner(game: RaceGame, s: RaceState, action: string): RaceState {
  const { rules } = game;
  if (s.phase === 'roll') {
    if (action !== 'roll') return s;
    const [die, rng] = roll(s.rng);
    const sixes = die === 6 && rules.extraOnSix ? s.sixes + 1 : 0;
    if (sixes >= 3) {
      // Three sixes in a row: the turn ends (and in some games the last token moved goes back).
      const tokens = s.tokens.map((row) => [...row]);
      if (rules.threeSixes === 'yard' && s.lastMoved !== null) {
        const step = tokens[s.turn]![s.lastMoved]!;
        if (step < game.last - (game.geo.L - 1)) tokens[s.turn]![s.lastMoved] = -1;
      }
      return {
        ...s,
        rng,
        tokens,
        die,
        sixes: 0,
        lastMoved: null,
        phase: 'roll',
        turn: nextSeat(s),
      };
    }
    return { ...s, rng, die, sixes, phase: 'move' };
  }
  if (s.phase !== 'move' && s.phase !== 'bonus') return s;
  const moves = currentMoves(game, s);
  const again = s.phase === 'move' && s.die === 6 && rules.extraOnSix;
  if (action === 'pass') {
    if (moves.length) return s;
    return s.phase === 'bonus' ? endTurn({ ...s }, s.sixes > 0) : endTurn(s, again);
  }
  const [kind, idx] = action.split(':');
  if (kind !== (s.phase === 'bonus' ? 'bonus' : 'move')) return s;
  const m = moves.find((x) => x.token === Number(idx));
  if (!m) return s;
  const tokens = s.tokens.map((row) => [...row]);
  tokens[s.turn]![m.token] = m.to;
  for (const [seat, t] of m.captured) tokens[seat]![t] = -1;
  const captures = [...s.captures];
  captures[s.turn] = captures[s.turn]! + m.captured.length;
  let next: RaceState = { ...s, tokens, captures, lastMoved: m.token };
  if (tokens[s.turn]!.every((x) => x === game.last))
    return { ...next, die: null, phase: 'over', winner: s.turn };
  // What the move earned: another throw or a bonus move.
  const earned: ('roll' | number)[] = [];
  if (m.captured.length) earned.push(rules.onCapture);
  if (m.to === game.last) earned.push(rules.onHome);
  const bonus = earned.find((e): e is number => typeof e === 'number');
  const extraRoll = earned.includes('roll');
  if (bonus !== undefined) {
    next = { ...next, die: null, bonus, phase: 'bonus' };
    if (!movesFor(game, next, bonus, true).length)
      next = endTurn(next, again || extraRoll || next.sixes > 0);
    return next;
  }
  return endTurn(next, again || extraRoll || (s.phase === 'bonus' && s.sixes > 0));
}

export function isValidRace(
  game: RaceGame,
  d: unknown,
  seatsOk: (seats: number[]) => boolean,
): d is RaceState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as RaceState;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Array.isArray(s.seats) || !seatsOk(s.seats)) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newRace(game, s.seats, s.seed);
  for (const a of s.history) {
    const next = act(game, g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([
      g.tokens,
      g.turn,
      g.die,
      g.sixes,
      g.bonus,
      g.phase,
      g.winner,
      g.rng,
      g.captures,
    ]) ===
    JSON.stringify([
      s.tokens,
      s.turn,
      s.die,
      s.sixes,
      s.bonus,
      s.phase,
      s.winner,
      s.rng,
      s.captures,
    ])
  );
}

/** Steps travelled by a seat's tokens (the yard counts as nothing). */
export const progressOf = (s: RaceState, seat: number) =>
  s.tokens[seat]!.reduce((n, x) => n + Math.max(0, x + 1), 0);
