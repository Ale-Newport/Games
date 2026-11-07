/**
 * Pachisi players: random, a simple rule (a piece in on a grace throw, otherwise the leading piece) and a
 * heuristic that weighs captures, getting out, home, safe squares and danger for every move.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { heuristicMove, simpleMove } from '../shared/cross/heuristic';
import { currentMoves, type RaceState } from '../shared/cross/race';
import { PACHISI_GAME } from './engine';

export function chooseAction(s: RaceState, strong: boolean): string {
  if (s.phase === 'roll') return 'roll';
  const moves = currentMoves(PACHISI_GAME, s);
  const m = strong ? heuristicMove(PACHISI_GAME, s, moves) : simpleMove(moves);
  return m ? `${s.phase === 'bonus' ? 'bonus' : 'move'}:${m.token}` : 'pass';
}

class PachisiAgent implements Agent<RaceState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strong: boolean,
  ) {}
  selectAction(
    _env: GameEnvironment<RaceState, string>,
    s: RaceState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(s, this.strong);
  }
}

export const AGENT_PRESETS: AgentPreset<RaceState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Moves any piece it can.', es: 'Mueve cualquier pieza que pueda.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'simple',
    kind: 'heuristic',
    label: { en: 'Front-runner', es: 'Adelantado' },
    description: {
      en: 'Brings a piece in on a grace throw, otherwise moves its leading piece.',
      es: 'Entra una pieza con una tirada de gracia; si no, mueve la que va primera.',
    },
    create: () => new PachisiAgent('simple', 'Front-runner', false),
  },
  {
    id: 'heuristic',
    kind: 'heuristic',
    label: { en: 'Tactician', es: 'Táctico' },
    description: {
      en: 'Weighs captures, getting out, reaching home, safe squares and the danger of every move.',
      es: 'Valora capturas, salir, llegar a casa, casillas seguras y el peligro de cada jugada.',
    },
    create: () => new PachisiAgent('heuristic', 'Tactician', true),
  },
];
