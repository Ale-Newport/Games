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
  /** Fresh copy of this round's starting position (defaults to `create` with the same first mover). */
  restart?(state: S): S;
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
  /**
   * Seat that always moves first (e.g. Black in Gomoku, Go and Reversi). When set, the
   * "alternate who starts" option is ignored and hidden; players pick their seat instead.
   */
  fixedFirstSeat?: Seat;
  /** Chess-style clocks offered in the menu (vs computer and two-player modes). */
  timeControls?: readonly TimeControl[];
  /** Whether `seat` can still win when the other side runs out of time (default: yes). */
  canWinOnTime?: (state: S, seat: Seat) => boolean;
}

export interface TimeControl {
  id: string;
  initialMs: number;
  incrementMs: number;
}

/** Remaining time per seat when a time control is active. */
export interface ClockState {
  initialMs: number;
  incrementMs: number;
  remaining: [number, number];
}

/** A round ended outside the rules: resignation, flag fall or agreed draw. */
export interface Adjudication {
  winner: Seat | null;
  reason: 'resign' | 'timeout' | 'agreement';
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
  /** Time control id from `MatchConfig.timeControls`; absent or 'none' = untimed. */
  timeControl?: string;
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
  clock?: ClockState | null;
  adjudication?: Adjudication | null;
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

function startingSeat<S, A>(cfg: MatchConfig<S, A>, setup: MatchSetup, roundNumber: number): Seat {
  return cfg.fixedFirstSeat ?? firstPlayerFor(setup, roundNumber);
}

function clockFor<S, A>(cfg: MatchConfig<S, A>, setup: MatchSetup): ClockState | null {
  if (setup.mode === 'watch') return null;
  const tc = cfg.timeControls?.find((c) => c.id === setup.timeControl);
  return tc
    ? {
        initialMs: tc.initialMs,
        incrementMs: tc.incrementMs,
        remaining: [tc.initialMs, tc.initialMs],
      }
    : null;
}

export function newMatch<S, A>(cfg: MatchConfig<S, A>, setup: MatchSetup): MatchState<S> {
  return {
    setup,
    round: cfg.rules.create(startingSeat(cfg, setup, 1)),
    roundNumber: 1,
    scores: { x: 0, o: 0, draws: 0 },
    recorded: false,
    clock: clockFor(cfg, setup),
    adjudication: null,
  };
}

/** The round's result, from the rules or from an adjudication (resignation, time, agreement). */
export function roundOutcome<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
): { winner: Seat | null } | null {
  return m.adjudication ?? cfg.rules.outcome(m.round);
}

function addResult(scores: Scores, winner: Seat | null): Scores {
  if (winner === null) return { ...scores, draws: scores.draws + 1 };
  return winner === 0 ? { ...scores, x: scores.x + 1 } : { ...scores, o: scores.o + 1 };
}

export function isHumanTurn<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): boolean {
  if (roundOutcome(cfg, m)) return false;
  if (m.setup.mode === 'local') return true;
  if (m.setup.mode === 'ai') return cfg.rules.toMove(m.round) === m.setup.humanSeat;
  return false;
}

/**
 * Applies an action and updates scores when it ends the round. With a clock, `elapsedMs` (the
 * mover's thinking time) is charged to the mover, who then receives the increment.
 */
export function applyMove<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
  action: A,
  elapsedMs = 0,
): MatchState<S> {
  if (m.adjudication) throw new Error('The round is already over');
  const mover = cfg.rules.toMove(m.round);
  const round = cfg.rules.apply(m.round, action);
  const outcome = cfg.rules.outcome(round);
  const scores = outcome ? addResult(m.scores, outcome.winner) : m.scores;
  let clock = m.clock ?? null;
  if (clock) {
    const remaining: [number, number] = [...clock.remaining];
    remaining[mover] = Math.max(0, remaining[mover] - elapsedMs) + clock.incrementMs;
    clock = { ...clock, remaining };
  }
  return { ...m, round, scores, clock };
}

/** Time `seat` has left after `elapsedMs` more of its current turn (Infinity when untimed). */
export function timeLeft<S>(m: MatchState<S>, seat: Seat, elapsedMs = 0): number {
  return m.clock ? m.clock.remaining[seat] - elapsedMs : Infinity;
}

/** Charges `elapsedMs` to the side to move without moving (e.g. when leaving for the menu). */
export function chargeClock<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
  elapsedMs: number,
): MatchState<S> {
  if (!m.clock || roundOutcome(cfg, m)) return m;
  const seat = cfg.rules.toMove(m.round);
  const remaining: [number, number] = [...m.clock.remaining];
  remaining[seat] = Math.max(0, remaining[seat] - elapsedMs);
  return { ...m, clock: { ...m.clock, remaining } };
}

function adjudicate<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
  adjudication: Adjudication,
): MatchState<S> {
  if (roundOutcome(cfg, m)) return m;
  return { ...m, adjudication, scores: addResult(m.scores, adjudication.winner) };
}

export function resign<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>, seat: Seat): MatchState<S> {
  return adjudicate(cfg, m, { winner: (1 - seat) as Seat, reason: 'resign' });
}

export function agreeDraw<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): MatchState<S> {
  return adjudicate(cfg, m, { winner: null, reason: 'agreement' });
}

/** `seat` ran out of time: it loses, unless the opponent could never win (then it is a draw). */
export function flagFall<S, A>(
  cfg: MatchConfig<S, A>,
  m: MatchState<S>,
  seat: Seat,
): MatchState<S> {
  if (!m.clock || roundOutcome(cfg, m)) return m;
  const opponent = (1 - seat) as Seat;
  const remaining: [number, number] = [...m.clock.remaining];
  remaining[seat] = 0;
  const winner = (cfg.canWinOnTime?.(m.round, opponent) ?? true) ? opponent : null;
  return adjudicate(cfg, { ...m, clock: { ...m.clock, remaining } }, { winner, reason: 'timeout' });
}

function pliesToUndo<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): number {
  const plies = cfg.rules.plies(m.round);
  for (let i = plies - 1; i >= 0; i--) {
    if (cfg.rules.moverOfPly(m.round, i) === m.setup.humanSeat) return plies - i;
  }
  return 0;
}

export function canUndo<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): boolean {
  // Taking moves back would make the clocks meaningless, so timed rounds have no undo.
  if (roundOutcome(cfg, m) || m.setup.mode === 'watch' || m.clock) return false;
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
  if (roundOutcome(cfg, m)) return m;
  const first =
    cfg.rules.plies(m.round) > 0 ? cfg.rules.moverOfPly(m.round, 0) : cfg.rules.toMove(m.round);
  const round = cfg.rules.restart?.(m.round) ?? cfg.rules.create(first);
  return { ...m, round, recorded: false, clock: clockFor(cfg, m.setup) };
}

export function nextRound<S, A>(cfg: MatchConfig<S, A>, m: MatchState<S>): MatchState<S> {
  const roundNumber = m.roundNumber + 1;
  return {
    ...m,
    round: cfg.rules.create(startingSeat(cfg, m.setup, roundNumber)),
    roundNumber,
    recorded: false,
    clock: clockFor(cfg, m.setup),
    adjudication: null,
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
    (data.speed === 'slow' || data.speed === 'normal' || data.speed === 'fast') &&
    (data.timeControl === undefined ||
      data.timeControl === 'none' ||
      (cfg.timeControls ?? []).some((c) => c.id === data.timeControl))
  );
}

const isTime = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

function isValidClock(data: unknown): data is ClockState | null | undefined {
  if (data === undefined || data === null) return true;
  return (
    isRecord(data) &&
    isTime(data.initialMs) &&
    isTime(data.incrementMs) &&
    Array.isArray(data.remaining) &&
    data.remaining.length === 2 &&
    data.remaining.every(isTime)
  );
}

function isValidAdjudication(data: unknown): data is Adjudication | null | undefined {
  if (data === undefined || data === null) return true;
  return (
    isRecord(data) &&
    (data.winner === 0 || data.winner === 1 || data.winner === null) &&
    (data.reason === 'resign' || data.reason === 'timeout' || data.reason === 'agreement')
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
    typeof data.recorded === 'boolean' &&
    isValidClock(data.clock) &&
    isValidAdjudication(data.adjudication)
  );
}

/** Versioned save spec (schema 1) for a game's match. */
export function matchSaveSpec<S, A>(cfg: MatchConfig<S, A>) {
  return { schema: 1, validate: (data: unknown): data is MatchState<S> => isValidMatch(cfg, data) };
}
