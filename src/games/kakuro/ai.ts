/**
 * Kakuro agents: a random filler, the technique solver (singles, hidden singles and run
 * combinations, guessing the fewest-candidate cell only when stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import {
  ALL,
  digitsOf,
  settle,
  solveKakuro,
  startMasks,
  stepsToPlacement,
  type KakuroState,
} from './engine';

/** Digits each empty cell may take without repeating a digit in its runs. */
export function openDigits(s: KakuroState): number[] {
  const masks = startMasks(s.puzzle, s.values);
  settle(s.puzzle, s.values, masks);
  return masks;
}

export function kakuroActions(s: KakuroState): string[] {
  if (s.solved) return [];
  const masks = openDigits(s);
  const out: string[] = [];
  for (let c = 0; c < masks.length; c++) {
    if (!s.puzzle.white[c] || s.values[c]) continue;
    if (!masks[c]) return [];
    for (const d of digitsOf(masks[c]!)) out.push(`${c}:${d}`);
  }
  return out;
}

export function logicMove(s: KakuroState): string {
  const place = stepsToPlacement(s.puzzle, s.values)?.at(-1)?.place;
  if (place) return `${place.cell}:${place.digit}`;
  const masks = openDigits(s);
  let best = -1;
  let size = 99;
  for (let c = 0; c < masks.length; c++) {
    if (!s.puzzle.white[c] || s.values[c]) continue;
    const k = digitsOf(masks[c]!).length;
    if (k < size) {
      size = k;
      best = c;
    }
  }
  return `${best}:${digitsOf(masks[best]! || ALL)[0]}`;
}

export function solverMove(s: KakuroState): string {
  const r = solveKakuro(s.puzzle, s.values, { limit: 1 });
  const solution =
    r.solutions[0] ?? solveKakuro(s.puzzle, s.puzzle.given, { limit: 1 }).solutions[0]!;
  const cell = s.puzzle.white.findIndex((w, c) => w && !s.values[c]);
  return `${cell}:${solution[cell]}`;
}

class KakuroAgent implements Agent<KakuroState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: KakuroState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<KakuroState, string>,
    s: KakuroState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<KakuroState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any digit not yet in the cell’s runs.',
      es: 'Cualquier número que aún no esté en los tramos de la casilla.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Technique solver', es: 'Solucionador por técnicas' },
    description: {
      en: 'Solves like a person: run combinations, singles and hidden singles.',
      es: 'Resuelve como una persona: combinaciones de tramo, únicos y únicos ocultos.',
    },
    create: () => new KakuroAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Propagation over the run combinations plus search: always finds the solution.',
      es: 'Propagación sobre las combinaciones de los tramos y búsqueda: siempre la encuentra.',
    },
    create: () => new KakuroAgent('solver', 'Exact solver', solverMove),
  },
];
