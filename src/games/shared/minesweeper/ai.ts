/**
 * Minesweeper agents and the AI environment factory. The environment hides the mines (it is a
 * hidden-information puzzle): each action opens a closed cell; the episode ends cleared or blown up.
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
import {
  countAround,
  deduce,
  isValidMinesState,
  newMines,
  reveal,
  risks,
  type MinesSpec,
  type MinesState,
} from './engine';

export const minesActions = (s: MinesState) =>
  s.status === 'won' || s.status === 'lost'
    ? []
    : s.revealed.flatMap((r, c) => (r ? [] : [`r:${c}`]));

/** Deductions first (from what is visible); otherwise the least risky closed cell. */
export function logicMove(s: MinesState): string {
  if (s.status === 'ready') return `r:${Math.floor(s.rows / 2) * s.cols + Math.floor(s.cols / 2)}`;
  const known = new Set<number>();
  for (let i = 0; i < s.revealed.length; i++) {
    const d = deduce(s.rows, s.cols, s.mineCount, s.revealed, (c) => countAround(s, c), known);
    if (!d) break;
    if (d.safe.length) return `r:${d.safe[0]}`;
    for (const m of d.mines) known.add(m);
  }
  const risk = risks(s);
  let best = -1;
  s.revealed.forEach((r, c) => {
    if (!r && !known.has(c) && (best < 0 || risk[c]! < risk[best]!)) best = c;
  });
  return `r:${best}`;
}

class MinesAgent implements Agent<MinesState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
  ) {}
  selectAction(
    _env: GameEnvironment<MinesState, string>,
    s: MinesState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return logicMove(s);
  }
}

export function minesOutcome(s: MinesState): Outcome | null {
  if (s.status !== 'won' && s.status !== 'lost') return null;
  const opened = s.revealed.filter((r, c) => r && !s.mines[c]).length;
  return {
    returns: [s.status === 'won' ? 1 : 0],
    winners: s.status === 'won' ? [0] : [],
    draw: false,
    scores: [opened],
    reason: s.status,
  };
}

export function createMinesEnv(
  id: string,
  rulesetId: string,
  version: string,
  specs: Record<string, MinesSpec>,
  noGuess: boolean,
): GameEnvironment<MinesState, string, MinesState, { difficulty?: string }> {
  const first = Object.keys(specs)[0]!;
  const make = (difficulty: string, seed: number) =>
    newMines(difficulty, specs[difficulty] ?? specs[first]!, seed >>> 0, noGuess);
  return {
    id,
    version,
    rulesetId,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: true,
      zeroSum: false,
    },
    createInitialState: (config, seed) => make(config?.difficulty ?? first, seed),
    reset: (seed) => make(first, seed),
    getObservation: (s) =>
      s.status === 'won' || s.status === 'lost' ? s : { ...s, mines: s.mines.map(() => false) },
    getLegalActions: (s) => minesActions(s),
    applyAction: (s, a) => {
      if (!minesActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      return reveal(s, Number(a.slice(2)));
    },
    getCurrentPlayer: (s) => (minesOutcome(s) ? NO_PLAYER : 0),
    isTerminal: (s) => minesOutcome(s) !== null,
    getOutcome: minesOutcome,
    getReward: (s) => minesOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidMinesState(parsed, specs, noGuess)) throw new Error('Invalid minesweeper state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}

export const MINES_AGENTS: AgentPreset<MinesState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Opens any closed cell.', es: 'Abre cualquier casilla cerrada.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Deduction', es: 'Deducción' },
    description: {
      en: 'Opens cells the numbers prove safe (single numbers, pairs of numbers, the mine count); when nothing is certain, opens the least risky cell.',
      es: 'Abre las casillas que los números demuestran seguras (números sueltos, parejas de números, el recuento de minas); si nada es seguro, abre la menos arriesgada.',
    },
    create: () => new MinesAgent('logic', 'Deduction'),
  },
];
