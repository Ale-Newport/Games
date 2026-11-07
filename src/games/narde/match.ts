/**
 * A Narde match: games to a target score (1 for a plain win, 2 for a mars). An opening die each
 * (rerolled on ties) decides who starts; then each turn is a roll and a play. Dice come from a
 * generator stored in the state, so a match replays exactly from its seed and actions.
 *
 * Actions: "roll", "pass" (no legal play), "next" (the next game) and "play:" with the steps as
 * from/to pairs ("play:24/18,24/18"; 0 is off).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';
import {
  legalPlays,
  opp,
  posKey,
  startPosition,
  winValue,
  type Play,
  type Position,
  type Side,
} from './engine';

export type Phase = 'roll' | 'move' | 'game-over' | 'match-over';

export interface NardeMatch {
  seed: number;
  rng: RngState;
  matchTo: number;
  score: [number, number];
  pos: Position;
  turn: Side;
  dice: [number, number] | null;
  phase: Phase;
  /** Whether each side is still to play its first turn of the game (for the head rule). */
  first: [boolean, boolean];
  /** The opening dice of the current game, for the table. */
  opening: [number, number];
  lastWin: { side: Side; points: number; mars: boolean } | null;
  history: string[];
  games: number;
}

function die(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [1 + (x % 6), next];
}

function openGame(s: NardeMatch): NardeMatch {
  let rng = s.rng;
  let a: number;
  let b: number;
  do {
    [a, rng] = die(rng);
    [b, rng] = die(rng);
  } while (a === b);
  return {
    ...s,
    rng,
    pos: startPosition(),
    turn: a > b ? 0 : 1,
    dice: null,
    phase: 'roll',
    first: [true, true],
    opening: [a, b],
  };
}

export function newNarde(matchTo: number, seed: number): NardeMatch {
  return openGame({
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    matchTo,
    score: [0, 0],
    pos: startPosition(),
    turn: 0,
    dice: null,
    phase: 'roll',
    first: [true, true],
    opening: [1, 2],
    lastWin: null,
    history: [],
    games: 1,
  });
}

export const playsOf = (s: NardeMatch): Play[] =>
  s.phase === 'move' && s.dice ? legalPlays(s.pos, s.turn, s.dice, s.first[s.turn]) : [];

export const playKey = (pl: Play) =>
  `play:${pl.steps.map((st) => `${st.from}/${st.to}`).join(',')}`;

function endTurn(s: NardeMatch, pos: Position): NardeMatch {
  const first: [boolean, boolean] = [s.first[0], s.first[1]];
  first[s.turn] = false;
  if (pos.off[s.turn] === 15) {
    const value = winValue(pos, s.turn);
    const score: [number, number] = [s.score[0], s.score[1]];
    score[s.turn] = Math.min(s.matchTo, score[s.turn] + value);
    return {
      ...s,
      pos,
      first,
      score,
      dice: null,
      phase: score[s.turn] >= s.matchTo ? 'match-over' : 'game-over',
      lastWin: { side: s.turn, points: value, mars: value === 2 },
    };
  }
  return { ...s, pos, first, turn: opp(s.turn), dice: null, phase: 'roll' };
}

export function act(s: NardeMatch, action: string): NardeMatch {
  const next = actInner(s, action);
  return next === s ? s : { ...next, history: [...s.history, action] };
}

function actInner(s: NardeMatch, action: string): NardeMatch {
  switch (s.phase) {
    case 'roll': {
      if (action !== 'roll') return s;
      const [a, r1] = die(s.rng);
      const [b, rng] = die(r1);
      return { ...s, rng, dice: [a, b], phase: 'move' };
    }
    case 'move': {
      const plays = playsOf(s);
      if (action === 'pass') return plays.length ? s : endTurn(s, s.pos);
      const chosen = action.startsWith('play:')
        ? plays.find((pl) => playKey(pl) === action)
        : undefined;
      return chosen ? endTurn(s, chosen.result) : s;
    }
    case 'game-over':
      return action === 'next'
        ? { ...openGame({ ...s, games: s.games + 1 }), lastWin: s.lastWin }
        : s;
    default:
      return s;
  }
}

export function legalActions(s: NardeMatch): string[] {
  switch (s.phase) {
    case 'roll':
      return ['roll'];
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

export function isValidNarde(d: unknown): d is NardeMatch {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as NardeMatch;
  if (![1, 3, 5].includes(s.matchTo) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newNarde(s.matchTo, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    posKey(g.pos) === posKey(s.pos) &&
    JSON.stringify([g.score, g.phase, g.turn, g.dice, g.first, g.rng]) ===
      JSON.stringify([s.score, s.phase, s.turn, s.dice, s.first, s.rng])
  );
}
