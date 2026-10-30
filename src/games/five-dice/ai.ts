/**
 * Five Dice players: random, a simple player (keeps its most common face, scores what pays most
 * now) and the planner, which plans each turn exactly for the value of the boxes left.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { DiceGame } from '../shared/scorecard/game';
import { plannedAction, simpleAction } from '../shared/scorecard/planner';
import { FIVE_DICE, FIVE_DICE_PLANNING } from './engine';

class FiveDiceAgent implements Agent<DiceGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strong: boolean,
  ) {}
  selectAction(
    _env: GameEnvironment<DiceGame, string>,
    g: DiceGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.strong
      ? plannedAction(FIVE_DICE, FIVE_DICE_PLANNING, g)
      : simpleAction(FIVE_DICE, g);
  }
}

export const AGENT_PRESETS: AgentPreset<DiceGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Holds and scores at random.', es: 'Guarda y anota al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'simple',
    kind: 'heuristic',
    label: { en: 'Simple', es: 'Sencillo' },
    description: {
      en: 'Keeps its most common face and scores the box that pays most now.',
      es: 'Guarda su cara más repetida y anota la casilla que más paga ahora.',
    },
    create: () => new FiveDiceAgent('simple', 'Simple', false),
  },
  {
    id: 'planner',
    kind: 'search',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Plans every roll of the turn exactly, valuing each box by what it would bring later.',
      es: 'Planifica exactamente cada tirada del turno, valorando cada casilla por lo que daría después.',
    },
    create: () => new FiveDiceAgent('planner', 'Planner', true),
  },
];
