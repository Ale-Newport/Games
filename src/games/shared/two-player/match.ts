/**
 * Pure match flow for two-player games: modes (vs computer, hot-seat, watch AI), rounds, scores,
 * undo and save validation. Each game plugs in its rules through `TwoPlayerRules`. No React here.
 */
import { isRecord } from '../../../core/persistence/versioned';

export type Seat = 0 | 1;
export type Mode = 'ai' | 'local' | 'watch';
export type Speed = 'slow' | 'normal' | 'fast';

/** The minimal view of a game's rules that the match flow needs. */
export interface TwoPlayerRules<S, A> {
  create(firstPlayer: Seat): S;
  apply(state: S, action: A): S;
  isLegal(state: S, action: A): boolean;
  /** Removes the last `plies` actions (by replaying history). */
  undo(state: S, plies: number): S;
  toMove(state: S): Seat;
  /** Number of actions taken so far this round. */
  plies(state: S): number;
  /** Seat that took action number `ply` (0-based); supports passes and extra turns. */
  moverOfPly(state: S, ply: number): Seat;
  /** Null while playing; `{ winner: null }` for a draw. */
  outcome(state: S): { winner: Seat | null } | null;
  /** Structural validation for untrusted data (saves). */
  validate(data: unknown): data is S;
}

export interface MatchConfig<S, A> {
  rules: TwoPlayerRules<S, A>;
  /** Agent preset ids offered as computer difficulty levels, easiest first. */
  difficulties: readonly string[];
  /** Every agent preset id (watch mode may use any of them). */
  agentIds: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
}

export interface MatchSetup {
  mode: Mode;
  difficulty: string;
  /** The human's seat in vs-computer mode. */
  humanSeat: Seat;
  /** Display names for seat 0 and seat 1. */
  names: [string, string];
  /** Alternate which seat starts each round. */
  alternate: boolean;
  /** Agent preset ids for each seat in watch mode. */
  watchAgents: [string, string];
  speed: Speed;
}

export interface Scores {
  /** Wins of seat 0. Named after the first mark for compatibility with saved matches. */
  x: number;
  /** Wins of seat 1. */
  o: number;
  draws: number;
}

export interface MatchState<S> {
  setup: MatchSetup;
  round: S;
  roundNumber: number;
  scores: Scores;
  /** Whether the finished round has been written to statistics. */
  recorded: boolean;
}

export const SPEED_MS: Record<Speed, number> = { slow: 1100, normal: 600, fast: 220 };

export function defaultSetup<S, A>(
  cfg: MatchConfig<S, A>,
  playerName = 'Player 1',
  secondName = 'Player 2',
): MatchSetup {
  return {
    mode: 'ai',
    difficulty: cfg.defaultDifficulty,
    humanSeat: 0,
    names: [playerName, secondName],
    alternate: true,
    watchAgents: [...cfg.defaultWatch],
    speed: 'normal',
  };
}

export function firstPlayerFor(setup: MatchSetup, roundNumber: number): Seat {
  return setup.alternate && roundNumber % 2 === 0 ? 1 : 0;
}

export function newMatch<S, A>(cfg: MatchConfig<S, A>, setup: MatchSetup): MatchState<S> {
  return {
    setup,
    round: cfg.rules.create(firstPlayerFor(setup, 1)),
    roundNumber: 1,
    scores: { x: 0, o: 0, draws: 0 },
    recorded: false,
  };
}

export function isHumanTurn<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): boolean {
  if (cfg.rules.outcome(m.round)) return false;
  if (m.setup.mode === 'local') return true;
  if (m.setup.mode === 'ai') return cfg.rules.toMove(m.round) === m.setup.humanSeat;
  return false;
}

/** Applies an action and updates scores when it ends the round. */
export function applyMove<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
  action: A,
): MatchState<S> {
  const round = cfg.rules.apply(m.round, action);
  const outcome = cfg.rules.outcome(round);
  let scores = m.scores;
  if (outcome) {
    scores =
      outcome.winner === null
        ? { ...scores, draws: scores.draws + 1 }
        : outcome.winner === 0
          ? { ...scores, x: scores.x + 1 }
          : { ...scores, o: scores.o + 1 };
  }
  return { ...m, round, scores };
}

function pliesToUndo<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): number {
  const plies = cfg.rules.plies(m.round);
  for (let i = plies - 1; i >= 0; i--) {
    if (cfg.rules.moverOfPly(m.round, i) === m.setup.humanSeat) return plies - i;
  }
  return 0;
}

export function canUndo<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): boolean {
  if (cfg.rules.outcome(m.round) || m.setup.mode === 'watch') return false;
  if (m.setup.mode === 'local') return cfg.rules.plies(m.round) > 0;
  return pliesToUndo(cfg, m) > 0;
}

/** Local: removes one action. vs computer: removes back to before the human's last action. */
export function undo<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): MatchState<S> {
  if (!canUndo(cfg, m)) return m;
  const count = m.setup.mode === 'local' ? 1 : pliesToUndo(cfg, m);
  return { ...m, round: cfg.rules.undo(m.round, count) };
}

export function restartRound<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): MatchState<S> {
  if (cfg.rules.outcome(m.round)) return m;
  const first =
    cfg.rules.plies(m.round) > 0 ? cfg.rules.moverOfPly(m.round, 0) : cfg.rules.toMove(m.round);
  return { ...m, round: cfg.rules.create(first), recorded: false };
}

export function nextRound<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): MatchState<S> {
  const roundNumber = m.roundNumber + 1;
  return {
    ...m,
    round: cfg.rules.create(firstPlayerFor(m.setup, roundNumber)),
    roundNumber,
    recorded: false,
  };
}

export const markRecorded = <S>(m: MatchState<S>): MatchState<S> => ({ ...m, recorded: true });

/** Statistics mode key for the current setup (null = not recorded). */
export function statsMode(setup: MatchSetup): string | null {
  if (setup.mode === 'ai') return `vs-ai:${setup.difficulty}`;
  if (setup.mode === 'local') return 'local';
  return null;
}

export function isValidSetup<S, A>(cfg: MatchConfig<S, A>, data: unknown): data is MatchSetup {
  if (!isRecord(data)) return false;
  return (
    (data.mode === 'ai' || data.mode === 'local' || data.mode === 'watch') &&
    typeof data.difficulty === 'string' &&
    cfg.difficulties.includes(data.difficulty) &&
    (data.humanSeat === 0 || data.humanSeat === 1) &&
    Array.isArray(data.names) &&
    data.names.length === 2 &&
    data.names.every((n) => typeof n === 'string') &&
    typeof data.alternate === 'boolean' &&
    Array.isArray(data.watchAgents) &&
    data.watchAgents.length === 2 &&
    data.watchAgents.every((a) => typeof a === 'string' && cfg.agentIds.includes(a)) &&
    (data.speed === 'slow' || data.speed === 'normal' || data.speed === 'fast')
  );
}

export function isValidMatch<S, A>(cfg: MatchConfig<S, A>, data: unknown): data is MatchState<S> {
  if (!isRecord(data) || !isValidSetup(cfg, data.setup) || !cfg.rules.validate(data.round))
    return false;
  const s = data.scores;
  return (
    isRecord(s) &&
    [s.x, s.o, s.draws].every((n) => Number.isInteger(n) && (n as number) >= 0) &&
    Number.isInteger(data.roundNumber) &&
    (data.roundNumber as number) >= 1 &&
    typeof data.recorded === 'boolean'
  );
}

/** Versioned save spec (schema 1) for a game's match. */
export function matchSaveSpec<S, A>(cfg: MatchConfig<S, A>) {
  return { schema: 1, validate: (data: unknown): data is MatchState<S> => isValidMatch(cfg, data) };
}
