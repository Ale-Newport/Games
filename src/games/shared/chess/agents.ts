/** Computer opponents for the chess family: one search engine, four strength levels. */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { ChessState, ChessVariant } from './game';
import { ChessSearchAgent } from './search';

export interface ChessLevels {
  easy: { depth: number; randomness: number };
  medium: { depth: number; timeLimitMs: number };
  hard: { depth: number; timeLimitMs: number };
  expert: { depth: number; timeLimitMs: number };
}

export const DEFAULT_CHESS_LEVELS: ChessLevels = {
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 2, timeLimitMs: 400 },
  hard: { depth: 4, timeLimitMs: 900 },
  expert: { depth: 30, timeLimitMs: 1600 },
};

export function chessPresets(
  v: ChessVariant,
  levels: ChessLevels = DEFAULT_CHESS_LEVELS,
): AgentPreset<ChessState, string>[] {
  const search = (id: string, label: string, depth: number, timeLimitMs?: number, randomness = 0) =>
    new ChessSearchAgent(v, { id, label, maxDepth: depth, timeLimitMs, randomness });
  const { easy, medium, hard, expert } = levels;
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any legal move at random.',
        es: 'Juega cualquier jugada legal al azar.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Looks ${easy.depth} ply ahead and resolves captures; a random move ${Math.round(easy.randomness * 100)}% of the time.`,
        es: `Mira ${easy.depth} jugada por delante y resuelve capturas; jugada al azar el ${Math.round(easy.randomness * 100)}% de las veces.`,
      },
      create: () => search('easy', 'Easy', easy.depth, undefined, easy.randomness),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${medium.depth} plies with capture search and positional tables.`,
        es: `Alfa-beta a ${medium.depth} jugadas con búsqueda de capturas y tablas posicionales.`,
      },
      create: () => search('medium', 'Medium', medium.depth, medium.timeLimitMs),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative deepening to ${hard.depth} plies (${hard.timeLimitMs} ms) with a transposition table.`,
        es: `Profundización iterativa hasta ${hard.depth} jugadas (${hard.timeLimitMs} ms) con tabla de transposición.`,
      },
      create: () => search('hard', 'Hard', hard.depth, hard.timeLimitMs),
    },
    {
      id: 'expert',
      kind: 'search',
      label: { en: 'Expert', es: 'Experto' },
      description: {
        en: `Searches as deep as ${expert.timeLimitMs} ms allow, with killer moves and a transposition table.`,
        es: `Busca tan hondo como permiten ${expert.timeLimitMs} ms, con jugadas asesinas y tabla de transposición.`,
      },
      create: () => search('expert', 'Expert', expert.depth, expert.timeLimitMs),
    },
  ];
}
