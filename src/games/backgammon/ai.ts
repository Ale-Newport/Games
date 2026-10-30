/**
 * Backgammon players: random, greedy (the play with the best evaluation right after it) and
 * expectimax (each of the best few plays judged over the opponent's 21 rolls and greedy replies),
 * with doubling decisions from the estimated winning chance.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { expectimaxPlay, greedyPlay, shouldDouble, shouldTake } from './evaluate';
import { actor, canDouble, legalActions, playKey, playsOf, type MatchState } from './match';

export type Strength = 'greedy' | 'expectimax';

export function chooseAction(s: MatchState, strength: Strength): string {
  const side = actor(s);
  switch (s.phase) {
    case 'roll':
      return canDouble(s) && shouldDouble(s.pos, side) ? 'double' : 'roll';
    case 'doubled':
      return shouldTake(s.pos, side) ? 'take' : 'drop';
    case 'move': {
      const plays = playsOf(s);
      if (!plays.length) return 'pass';
      return playKey(
        strength === 'expectimax' ? expectimaxPlay(plays, side) : greedyPlay(plays, side),
      );
    }
    default:
      return legalActions(s)[0]!;
  }
}

class BackgammonAgent implements Agent<MatchState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strength: Strength,
  ) {}
  selectAction(
    _env: GameEnvironment<MatchState, string>,
    s: MatchState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(s, this.strength);
  }
}

export const AGENT_PRESETS: AgentPreset<MatchState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any legal action, cube decisions included.',
      es: 'Cualquier acción legal, también las del cubo.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Voraz' },
    description: {
      en: 'The play that looks best right after it: race, exposed blots, made points, primes, anchors.',
      es: 'La jugada que mejor parece justo después: carrera, fichas expuestas, puntos hechos, primas, anclas.',
    },
    create: () => new BackgammonAgent('greedy', 'Greedy', 'greedy'),
  },
  {
    id: 'expectimax',
    kind: 'search',
    label: { en: 'Expectimax', es: 'Expectimax' },
    description: {
      en: 'Weighs its best plays over all 21 replies of the dice, with the opponent answering greedily.',
      es: 'Pondera sus mejores jugadas sobre las 21 tiradas de respuesta, con el rival respondiendo de forma voraz.',
    },
    create: () => new BackgammonAgent('expectimax', 'Expectimax', 'expectimax'),
  },
];
