/**
 * A backgammon match: games to a target score with the doubling cube (and the Crawford rule:
 * no doubling in the game right after a player gets within one point of winning). Dice come from
 * a generator stored in the state, so a match replays exactly from its seed and actions.
 *
 * Actions: "roll", "double", "take", "drop", "pass" (no legal play), and "play:" followed by the
 * steps as from/to pairs ("play:13/10,10/9"; 25 is the bar, 0 is off).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import {
  applyStep,
  legalPlays,
  opp,
  posKey,
  startPosition,
  target,
  winValue,
  type Play,
  type Position,
  type Side,
} from './engine';

export type Phase = 'roll' | 'move' | 'doubled' | 'game-over' | 'match-over';

export interface MatchState {
  seed: number;
  rng: RngState;
  matchTo: number;
  score: [number, number];
  /** This game is the Crawford game (no doubling). */
  crawford: boolean;
  /** The Crawford game has been played (or skipped) in this match. */
  crawfordDone: boolean;
  pos: Position;
  turn: Side;
  dice: [number, number] | null;
  phase: Phase;
  cube: number;
  /** Who may double next: the owner, or null when the cube is in the middle. */
  cubeOwner: Side | null;
  /** The last game's result, for the table. */
  lastWin: { side: Side; points: number; kind: 1 | 2 | 3; dropped: boolean } | null;
  history: string[];
  games: number;
}

function roll(rng: RngState): [[number, number], RngState] {
  const [a, r1] = nextUint32(rng);
  const [b, r2] = nextUint32(r1);
  return [[1 + (a % 6), 1 + (b % 6)], r2];
}

/** A new game: the opening roll (rerolled on ties) decides who starts, with those two dice. */
function openGame(s: MatchState): MatchState {
  let rng = s.rng;
  let dice: [number, number];
  do [dice, rng] = roll(rng);
  while (dice[0] === dice[1]);
  const turn: Side = dice[0] > dice[1] ? 0 : 1;
  return {
    ...s,
    rng,
    pos: startPosition(),
    turn,
    // The starter plays side 0's die and side 1's die together.
    dice: turn === 0 ? dice : [dice[1], dice[0]],
    phase: 'move',
    cube: 1,
    cubeOwner: null,
  };
}

export function newMatch(matchTo: number, seed: number): MatchState {
  const base: MatchState = {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    matchTo,
    score: [0, 0],
    crawford: false,
    crawfordDone: false,
    pos: startPosition(),
    turn: 0,
    dice: null,
    phase: 'roll',
    cube: 1,
    cubeOwner: null,
    lastWin: null,
    history: [],
    games: 1,
  };
  return openGame(base);
}

export const playsOf = (s: MatchState): Play[] =>
  s.phase === 'move' && s.dice ? legalPlays(s.pos, s.turn, s.dice) : [];

export function canDouble(s: MatchState): boolean {
  if (s.phase !== 'roll' || s.crawford || s.matchTo === 1) return false;
  if (s.cubeOwner !== null && s.cubeOwner !== s.turn) return false;
  return s.cube < 64;
}

export const playKey = (pl: Play) =>
  `play:${pl.steps.map((st) => `${st.from}/${st.to}`).join(',')}`;

/** Ends the current game: points to the winner, the match score, Crawford bookkeeping. */
function finishGame(s: MatchState, winner: Side, kind: 1 | 2 | 3, dropped: boolean): MatchState {
  const points = s.cube * kind;
  const score: [number, number] = [s.score[0], s.score[1]];
  score[winner] = Math.min(s.matchTo, score[winner] + points);
  const over = score[winner] >= s.matchTo;
  const wasCrawford = s.crawford;
  const crawfordNext =
    !over && !s.crawfordDone && !wasCrawford && score.some((x) => x === s.matchTo - 1);
  return {
    ...s,
    score,
    phase: over ? 'match-over' : 'game-over',
    dice: null,
    lastWin: { side: winner, points, kind, dropped },
    crawford: crawfordNext,
    crawfordDone: s.crawfordDone || wasCrawford,
  };
}

/** Applies an action, or returns the state unchanged when it is not legal now. */
export function act(s: MatchState, action: string): MatchState {
  const next = actInner(s, action);
  return next === s ? s : { ...next, history: [...s.history, action] };
}

function actInner(s: MatchState, action: string): MatchState {
  switch (s.phase) {
    case 'roll': {
      if (action === 'roll') {
        const [dice, rng] = roll(s.rng);
        return { ...s, rng, dice, phase: 'move' };
      }
      if (action === 'double' && canDouble(s)) return { ...s, phase: 'doubled' };
      return s;
    }
    case 'doubled': {
      // The opponent of `turn` answers.
      if (action === 'take')
        return { ...s, cube: s.cube * 2, cubeOwner: opp(s.turn), phase: 'roll' };
      if (action === 'drop') return finishGame(s, s.turn, 1, true);
      return s;
    }
    case 'move': {
      const plays = playsOf(s);
      if (action === 'pass') {
        if (plays.length) return s;
        return { ...s, turn: opp(s.turn), dice: null, phase: 'roll' };
      }
      if (!action.startsWith('play:')) return s;
      const chosen = plays.find((pl) => playKey(pl) === action);
      if (!chosen) return s;
      const pos = chosen.result;
      if (pos.off[s.turn] === 15)
        return finishGame({ ...s, pos }, s.turn, winValue(pos, s.turn), false);
      return { ...s, pos, turn: opp(s.turn), dice: null, phase: 'roll' };
    }
    case 'game-over': {
      if (action !== 'next') return s;
      return { ...openGame({ ...s, games: s.games + 1 }), lastWin: s.lastWin };
    }
    default:
      return s;
  }
}

export function legalActions(s: MatchState): string[] {
  switch (s.phase) {
    case 'roll':
      return canDouble(s) ? ['roll', 'double'] : ['roll'];
    case 'doubled':
      return ['take', 'drop'];
    case 'move': {
      const plays = playsOf(s);
      return plays.length ? plays.map(playKey) : ['pass'];
    }
    case 'game-over':
      return ['next'];
    default:
      return [];
  }
}

/** Who must act now: the side to roll or move, or the one answering a double. */
export const actor = (s: MatchState): Side => (s.phase === 'doubled' ? opp(s.turn) : s.turn);

/** Applies single checker steps one by one (for the table's partial moves); null when illegal. */
export function stepOnce(pos: Position, side: Side, from: number, die: number): Position | null {
  const st = target(pos, side, from, die);
  return st ? applyStep(pos, side, st) : null;
}

export function isValidMatch(d: unknown): d is MatchState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as MatchState;
  if (![1, 3, 5, 7].includes(s.matchTo) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newMatch(s.matchTo, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    posKey(g.pos) === posKey(s.pos) &&
    JSON.stringify([g.score, g.phase, g.turn, g.dice, g.cube, g.cubeOwner, g.rng]) ===
      JSON.stringify([s.score, s.phase, s.turn, s.dice, s.cube, s.cubeOwner, s.rng])
  );
}
