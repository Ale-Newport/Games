/** Shut the Box players: random, the simple rule (fewest and highest tiles) and the solved game. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { bestShut, oneDieAllowed, simpleShut, solve } from './engine';
import { legalActions, throwTotal, type ShutGame } from './match';

export function chooseAction(g: ShutGame, strong: boolean): string {
  if (g.phase === 'roll')
    return strong && oneDieAllowed(g.box) && solve().useOne[g.box] ? 'roll:1' : 'roll:2';
  const m = strong ? bestShut(g.box, throwTotal(g)) : simpleShut(g.box, throwTotal(g));
  return m === null ? legalActions(g)[0]! : `shut:${m}`;
}

class ShutAgent implements Agent<ShutGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strong: boolean,
  ) {}
  selectAction(
    _env: GameEnvironment<ShutGame, string>,
    g: ShutGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(g, this.strong);
  }
}

export const AGENT_PRESETS: AgentPreset<ShutGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal choice.', es: 'Cualquier elección legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'simple',
    kind: 'heuristic',
    label: { en: 'Big tiles first', es: 'Primero las altas' },
    description: {
      en: 'Shuts the fewest tiles it can, the highest first.',
      es: 'Cierra las menos fichas posibles, primero las más altas.',
    },
    create: () => new ShutAgent('simple', 'Big tiles first', false),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Perfect', es: 'Perfecto' },
    description: {
      en: 'The solved game: dynamic programming over all 512 boxes for the lowest expected score.',
      es: 'El juego resuelto: programación dinámica sobre las 512 cajas para la menor puntuación esperada.',
    },
    create: () => new ShutAgent('solver', 'Perfect', true),
  },
];
