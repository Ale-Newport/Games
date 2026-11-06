/** Pure match flow for the Tic-Tac-Toe UI: modes, rounds, scores, undo. No React here. */
import { isRecord } from '../../core/persistence/versioned';
import { AGENT_PRESETS, DIFFICULTIES, type Difficulty } from './ai';
import { isValidState, newRound, play, undo as undoRound, type Seat, type TttState } from './rules';

export type Mode = 'ai' | 'local' | 'watch';
export type Speed = 'slow' | 'normal' | 'fast';

export interface MatchSetup {
  mode: Mode;
  difficulty: Difficulty;
  /** The human's seat in vs-computer mode (0 = X, 1 = O). */
  humanSeat: Seat;
  /** Display names for X and O. */
  names: [string, string];
  /** Alternate which mark starts each round. */
  alternate: boolean;
  /** Agent preset ids for X and O in watch mode. */
  watchAgents: [string, string];
  speed: Speed;
}

export interface Scores {
  x: number;
  o: number;
  draws: number;
}

export interface MatchState {
  setup: MatchSetup;
  round: TttState;
  roundNumber: number;
  scores: Scores;
  /** Whether the finished round has been written to statistics. */
  recorded: boolean;
}

export const SPEED_MS: Record<Speed, number> = { slow: 1100, normal: 600, fast: 220 };

export function defaultSetup(playerName = 'Player 1', secondName = 'Player 2'): MatchSetup {
  return {
    mode: 'ai',
    difficulty: 'medium',
    humanSeat: 0,
    names: [playerName, secondName],
    alternate: true,
    watchAgents: ['perfect', 'medium'],
    speed: 'normal',
  };
}

export function firstPlayerFor(setup: MatchSetup, roundNumber: number): Seat {
  return setup.alternate && roundNumber % 2 === 0 ? 1 : 0;
}

export function newMatch(setup: MatchSetup): MatchState {
  return {
    setup,
    round: newRound(firstPlayerFor(setup, 1)),
    roundNumber: 1,
    scores: { x: 0, o: 0, draws: 0 },
    recorded: false,
  };
}

export function isHumanTurn(m: MatchState): boolean {
  if (m.round.result) return false;
  if (m.setup.mode === 'local') return true;
  if (m.setup.mode === 'ai') return m.round.toMove === m.setup.humanSeat;
  return false;
}

/** Applies a move and updates scores when it ends the round. */
export function applyMove(m: MatchState, cell: number): MatchState {
  const round = play(m.round, cell);
  let scores = m.scores;
  if (round.result) {
    scores =
      round.result.kind === 'draw'
        ? { ...scores, draws: scores.draws + 1 }
        : round.result.winner === 0
          ? { ...scores, x: scores.x + 1 }
          : { ...scores, o: scores.o + 1 };
  }
  return { ...m, round, scores };
}

export function canUndo(m: MatchState): boolean {
  if (m.round.result || m.setup.mode === 'watch') return false;
  if (m.setup.mode === 'local') return m.round.history.length > 0;
  // vs computer: there must be a human move to take back.
  return pliesToUndo(m) > 0;
}

function pliesToUndo(m: MatchState): number {
  const { history, firstPlayer } = m.round;
  // Seat that made the move at ply i is firstPlayer for even i, the other seat for odd i.
  for (let i = history.length - 1; i >= 0; i--) {
    const seat = i % 2 === 0 ? firstPlayer : ((1 - firstPlayer) as Seat);
    if (seat === m.setup.humanSeat) return history.length - i;
  }
  return 0;
}

/** Local: removes one move. vs computer: removes back to before the human's last move. */
export function undo(m: MatchState): MatchState {
  if (!canUndo(m)) return m;
  const count = m.setup.mode === 'local' ? 1 : pliesToUndo(m);
  return { ...m, round: undoRound(m.round, count) };
}

export function restartRound(m: MatchState): MatchState {
  if (m.round.result) return m;
  return { ...m, round: newRound(m.round.firstPlayer), recorded: false };
}

export function nextRound(m: MatchState): MatchState {
  const roundNumber = m.roundNumber + 1;
  return {
    ...m,
    round: newRound(firstPlayerFor(m.setup, roundNumber)),
    roundNumber,
    recorded: false,
  };
}

export const markRecorded = (m: MatchState): MatchState => ({ ...m, recorded: true });

/** Statistics mode key for the current setup (null = not recorded). */
export function statsMode(setup: MatchSetup): string | null {
  if (setup.mode === 'ai') return `vs-ai:${setup.difficulty}`;
  if (setup.mode === 'local') return 'local';
  return null;
}

const agentIds = new Set(AGENT_PRESETS.map((a) => a.id));

export function isValidSetup(data: unknown): data is MatchSetup {
  if (!isRecord(data)) return false;
  return (
    (data.mode === 'ai' || data.mode === 'local' || data.mode === 'watch') &&
    DIFFICULTIES.includes(data.difficulty as Difficulty) &&
    (data.humanSeat === 0 || data.humanSeat === 1) &&
    Array.isArray(data.names) &&
    data.names.length === 2 &&
    data.names.every((n) => typeof n === 'string') &&
    typeof data.alternate === 'boolean' &&
    Array.isArray(data.watchAgents) &&
    data.watchAgents.length === 2 &&
    data.watchAgents.every((a) => typeof a === 'string' && agentIds.has(a)) &&
    (data.speed === 'slow' || data.speed === 'normal' || data.speed === 'fast')
  );
}

export function isValidMatch(data: unknown): data is MatchState {
  if (!isRecord(data) || !isValidSetup(data.setup) || !isValidState(data.round)) return false;
  const s = data.scores;
  return (
    isRecord(s) &&
    [s.x, s.o, s.draws].every((n) => Number.isInteger(n) && (n as number) >= 0) &&
    Number.isInteger(data.roundNumber) &&
    (data.roundNumber as number) >= 1 &&
    typeof data.recorded === 'boolean'
  );
}

export const SAVE_SPEC = { schema: 1, validate: isValidMatch };
