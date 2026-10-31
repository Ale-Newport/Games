/**
 * Summit Rush players: random, a cautious player (stops after two climbs) and the strategist,
 * which picks the climb that gains the most weighted progress while placing as few new climbers as
 * it can, and stops by the rule of 28 — or sooner when the exact chance of a bust is high, or when
 * stopping wins.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import {
  CLIMBERS,
  HEIGHT,
  STEP_WEIGHT,
  TO_WIN,
  bustChance,
  legalActions,
  options,
  turnWorth,
  type SummitGame,
} from './engine';

/** Columns the player to move would hold after stopping now. */
function wouldClaim(g: SummitGame): number {
  const held = Object.values(g.claimed).filter((p) => p === g.turn).length;
  const fresh = Object.entries(g.climbers).filter(([c, at]) => at >= HEIGHT[Number(c)]!).length;
  return held + fresh;
}

export function strategistAction(g: SummitGame): string {
  if (g.phase === 'roll') {
    if (!Object.keys(g.climbers).length) return 'roll';
    if (wouldClaim(g) >= TO_WIN) return 'stop';
    const worth = turnWorth(g);
    if (worth >= 28) return 'stop';
    // With every climber placed the risk is known exactly: stop on a bad bet.
    if (Object.keys(g.climbers).length === CLIMBERS && bustChance(g) * worth > 9) return 'stop';
    return 'roll';
  }
  if (g.phase !== 'choose') return legalActions(g)[0]!;
  let best = '';
  let score = -Infinity;
  for (const sums of options(g)) {
    let v = 0;
    const placed = new Set(Object.keys(g.climbers).map(Number));
    for (const s of sums) {
      v += STEP_WEIGHT[s]!;
      if (!placed.has(s)) {
        v -= 5;
        placed.add(s);
      }
      const at = (g.climbers[s] ?? g.marks[g.turn]![s] ?? 0) + sums.filter((x) => x === s).length;
      if (at >= HEIGHT[s]!) v += 15;
    }
    if (v > score) {
      score = v;
      best = `climb:${sums.join(',')}`;
    }
  }
  return best;
}

export function cautiousAction(g: SummitGame): string {
  if (g.phase === 'roll')
    return Object.keys(g.climbers).length >= 2 || wouldClaim(g) >= TO_WIN ? 'stop' : 'roll';
  return legalActions(g)[0]!;
}

class SummitAgent implements Agent<SummitGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: SummitGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<SummitGame, string>,
    g: SummitGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

export const AGENT_PRESETS: AgentPreset<SummitGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal choice.', es: 'Cualquier elección legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'cautious',
    kind: 'heuristic',
    label: { en: 'Cautious', es: 'Prudente' },
    description: {
      en: 'Climbs with the first pairing and stops once two climbers are out.',
      es: 'Sube con la primera pareja y se para con dos escaladores fuera.',
    },
    create: () => new SummitAgent('cautious', 'Cautious', cautiousAction),
  },
  {
    id: 'strategist',
    kind: 'heuristic',
    label: { en: 'Strategist', es: 'Estratega' },
    description: {
      en: 'Weighs each climb by column, places few climbers, and stops by the rule of 28 or the exact chance of a bust.',
      es: 'Valora cada subida según la columna, coloca pocos escaladores y se para con la regla del 28 o la probabilidad exacta de fallar.',
    },
    create: () => new SummitAgent('strategist', 'Strategist', strategistAction),
  },
];
