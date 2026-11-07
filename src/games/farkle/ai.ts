/**
 * Farkle players: random, a simple player (keeps every scoring die, banks at 300 or with two dice
 * or fewer left) and the planner, which plays each turn by dynamic programming over the dice left
 * and the points at stake (banking whenever the expected value of rolling on is lower), with the
 * opening rule and the final round taken into account.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { TARGET, scoringChoices, turnTables } from './engine';
import { canBank, legalActions, rollCounts, type FarkleGame } from './match';

let tables: ReturnType<typeof turnTables> | null = null;
const getTables = () => (tables ??= turnTables());

/** Expected final value of rolling `n` dice (0 = hot dice, six) with `stake` points at stake. */
function rollValue(n: number, stake: number): number {
  const t = getTables();
  const step = Math.round(stake / 50);
  if (step >= t.steps) return stake;
  return t.roll[n === 0 ? 6 : n]![step]!;
}

export function plannedAction(g: FarkleGame): string {
  if (g.phase !== 'choose') return legalActions(g)[0]!;
  const n = g.dice!.length;
  let best = '';
  let score = -Infinity;
  for (const ch of scoringChoices(rollCounts(g)!)) {
    const code = ch.keep.join('');
    const stake = g.stake + ch.points;
    const left = n - ch.keep.reduce((a, b) => a + b, 0);
    const bankOk = canBank(g, stake);
    // Reaching the target ends the race: bank it.
    // In the final round, the last player to move wins outright by banking past the leader.
    const lastChance = g.finalFrom !== null && (g.turn + 1) % g.players === g.finalFrom;
    const wins =
      bankOk && ((g.scores[g.turn]! + stake >= TARGET && g.finalFrom === null) || lastChance);
    const bank = bankOk ? stake + (wins ? 100_000 : 0) : -Infinity;
    const roll = rollValue(left, stake);
    if (bank >= roll && bank > score) {
      score = bank;
      best = `keep:${code}:bank`;
    } else if (roll > score) {
      score = roll;
      best = `keep:${code}:roll`;
    }
  }
  return best || legalActions(g)[0]!;
}

export function simpleAction(g: FarkleGame): string {
  if (g.phase !== 'choose') return legalActions(g)[0]!;
  const choices = scoringChoices(rollCounts(g)!);
  const all = choices.reduce((a, b) => (b.points > a.points ? b : a));
  const stake = g.stake + all.points;
  const left = g.dice!.length - all.keep.reduce((a, b) => a + b, 0);
  const bankOk = canBank(g, stake);
  return `keep:${all.keep.join('')}:${bankOk && left > 0 && (stake >= 300 || left <= 2) ? 'bank' : 'roll'}`;
}

class FarkleAgent implements Agent<FarkleGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: FarkleGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<FarkleGame, string>,
    g: FarkleGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

export const AGENT_PRESETS: AgentPreset<FarkleGame, string>[] = [
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
    label: { en: 'Cautious', es: 'Prudente' },
    description: {
      en: 'Keeps every scoring die and banks at 300, or with two dice or fewer left.',
      es: 'Guarda todos los dados que puntúan y se planta con 300 o con dos dados o menos.',
    },
    create: () => new FarkleAgent('simple', 'Cautious', simpleAction),
  },
  {
    id: 'planner',
    kind: 'solver',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Banks or rolls on by the expected value of each choice, from dynamic programming over dice left and points at stake.',
      es: 'Se planta o sigue según el valor esperado de cada elección, por programación dinámica sobre dados restantes y puntos en juego.',
    },
    create: () => new FarkleAgent('planner', 'Planner', plannedAction),
  },
];
