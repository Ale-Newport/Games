/**
 * Number Trios agents: a random shift, a corner keeper (down, left, right, then up only when
 * forced), and expectimax search over where the shown tile enters and which tiles follow.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import { DIRS, bestMove, shift, type Dir } from './engine';
import { LEVELS, type TriosGameState } from './play';

/** A cap so that episodes end even when the board keeps going. */
export const MOVE_LIMIT = 5000;

export function triosActions(s: TriosGameState): Dir[] {
  if (s.over || s.moves >= MOVE_LIMIT) return [];
  const size = LEVELS[s.level]!.size;
  return DIRS.filter((d) => shift(s.board, size, d).moved.length > 0);
}

export function cornerMove(s: TriosGameState): Dir {
  const size = LEVELS[s.level]!.size;
  for (const d of ['down', 'left', 'right', 'up'] as Dir[])
    if (shift(s.board, size, d).moved.length) return d;
  return 'down';
}

export const searchMove = (s: TriosGameState, depth = 2): Dir =>
  bestMove(s.board, s.next, LEVELS[s.level]!, depth) ?? cornerMove(s);

class TriosAgent implements Agent<TriosGameState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: TriosGameState) => Dir,
  ) {}
  selectAction(_env: unknown, s: TriosGameState, _player: number, _ctx: DecisionContext): string {
    return this.pick(s);
  }
}

export function triosAgents(): AgentPreset<TriosGameState, string>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Shifts any way that moves something.',
        es: 'Desplaza hacia cualquier lado que mueva algo.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'corner',
      kind: 'heuristic',
      label: { en: 'Corner keeper', es: 'Guardián de esquina' },
      description: {
        en: 'The hand strategy: down, then left, then right, and up only when forced.',
        es: 'La estrategia a mano: abajo, luego izquierda, luego derecha y arriba solo si no queda otra.',
      },
      create: () => new TriosAgent('corner', 'Corner keeper', cornerMove),
    },
    {
      id: 'expectimax',
      kind: 'search',
      label: { en: 'Expectimax', es: 'Expectimax' },
      description: {
        en: 'Looks two moves ahead: where the shown tile can enter, then every tile that may follow, valuing empty cells, ready pairs and ordered lines.',
        es: 'Mira dos jugadas por delante: dónde puede entrar la ficha anunciada y luego cada ficha que puede seguir, valorando casillas vacías, parejas listas y líneas ordenadas.',
      },
      create: () => new TriosAgent('expectimax', 'Expectimax', (s) => searchMove(s)),
    },
  ];
}
