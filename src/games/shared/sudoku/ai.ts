/**
 * Sudoku agents and the AI environment factory. The environment is a single-seat puzzle: each
 * action places a digit that agrees with the placed digits (`cell:digit`); it ends solved, or stuck
 * when an empty cell has no candidate left.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import { candidates, digitsOf, popcount } from './grid';
import { stepsToPlacement } from './logic';
import {
  geoOf,
  isValidSudokuState,
  newSudoku,
  placeDigit,
  rulesOf,
  type SudokuState,
  type SudokuVariant,
} from './play';
import { solveSudoku } from './solver';

export interface SudokuConfig {
  difficulty?: string;
}

export function sudokuActions(v: SudokuVariant, s: SudokuState): string[] {
  if (s.solved) return [];
  const cands = candidates(geoOf(v), s.values);
  const out: string[] = [];
  for (let c = 0; c < cands.length; c++) {
    if (s.values[c]) continue;
    if (!cands[c]) return [];
    for (const d of digitsOf(cands[c]!)) out.push(`${c}:${d}`);
  }
  return out;
}

/** The technique solver's move: the next logical placement, or a guess when the logic is stuck. */
export function logicMove(v: SudokuVariant, s: SudokuState): string {
  const steps = stepsToPlacement(geoOf(v), s.values, rulesOf(geoOf(v), s).steps);
  const place = steps?.at(-1)?.place;
  if (place) return `${place.cell}:${place.digit}`;
  const cands = candidates(geoOf(v), s.values);
  let best = -1;
  for (let c = 0; c < cands.length; c++)
    if (!s.values[c] && (best < 0 || popcount(cands[c]!) < popcount(cands[best]!))) best = c;
  return `${best}:${digitsOf(cands[best]!)[0]}`;
}

/** The exact solver's move: the first empty cell's digit in the (unique) solution of the puzzle. */
export function solverMove(v: SudokuVariant, s: SudokuState): string {
  const geo = geoOf(v);
  const solved =
    solveSudoku(geo, s.values, { limit: 1, extra: rulesOf(geo, s).extra }).solution ??
    solveSudoku(geo, s.puzzle, { limit: 1, extra: rulesOf(geo, s).extra }).solution!;
  const cell = s.values.findIndex((x) => !x);
  return `${cell}:${solved[cell]}`;
}

class SudokuAgent implements Agent<SudokuState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly variant: SudokuVariant,
    private readonly move: (v: SudokuVariant, s: SudokuState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<SudokuState, string>,
    s: SudokuState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(this.variant, s);
  }
}

export function sudokuOutcome(v: SudokuVariant, s: SudokuState): Outcome | null {
  if (!s.solved && sudokuActions(v, s).length) return null;
  const correct = s.values.filter((x, c) => x && !s.puzzle[c] && x === s.solution[c]).length;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [correct],
    reason: s.solved ? 'solved' : 'stuck',
  };
}

export function createSudokuEnv(
  v: SudokuVariant,
  gameId: string,
  version: string,
): GameEnvironment<SudokuState, string, SudokuState, SudokuConfig> {
  const first = Object.keys(v.difficulties)[0]!;
  return {
    id: gameId,
    version,
    rulesetId: v.id,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: (config, seed) => newSudoku(v, config?.difficulty ?? first, seed >>> 0),
    reset: (seed) => newSudoku(v, first, seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => sudokuActions(v, s),
    applyAction: (s, a) => {
      if (!sudokuActions(v, s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      const [cell, digit] = a.split(':').map(Number) as [number, number];
      return placeDigit(v, s, cell, digit, { autoNotes: false });
    },
    getCurrentPlayer: (s) => (sudokuOutcome(v, s) ? NO_PLAYER : 0),
    isTerminal: (s) => sudokuOutcome(v, s) !== null,
    getOutcome: (s) => sudokuOutcome(v, s),
    getReward: (s) => sudokuOutcome(v, s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidSudokuState(v, parsed)) throw new Error('Invalid sudoku state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}

export function sudokuAgents(v: SudokuVariant): AgentPreset<SudokuState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Any digit that fits the placed ones.',
        es: 'Cualquier número que encaje con los colocados.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'logic',
      kind: 'heuristic',
      label: { en: 'Technique solver', es: 'Solucionador por técnicas' },
      description: {
        en: 'Solves like a person: singles, locked candidates, pairs, triples, X-Wing, Y-Wing, Swordfish; guesses only when stuck.',
        es: 'Resuelve como una persona: únicos, candidatos bloqueados, pares, tríos, X-Wing, Y-Wing, pez espada; solo adivina si se atasca.',
      },
      create: () => new SudokuAgent('logic', 'Technique solver', v, logicMove),
    },
    {
      id: 'solver',
      kind: 'solver',
      label: { en: 'Exact solver', es: 'Solucionador exacto' },
      description: {
        en: 'Propagation and backtracking search: always finds the solution.',
        es: 'Propagación y búsqueda con vuelta atrás: siempre encuentra la solución.',
      },
      create: () => new SudokuAgent('solver', 'Exact solver', v, solverMove),
    },
  ];
}
