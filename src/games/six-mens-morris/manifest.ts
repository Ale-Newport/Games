import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'six-mens-morris',
  number: 32,
  title: { en: "Six Men's Morris", es: 'Molino de seis' },
  tagline: {
    en: 'Mills on a smaller board, no flying.',
    es: 'Molinos en un tablero menor, sin vuelo.',
  },
  description: {
    en: "Six Men's Morris with placement and movement phases, mills that remove an opponent piece, draws by repetition, and three computer levels.",
    es: 'Molino de seis con fases de colocación y movimiento, molinos que retiran una ficha rival, tablas por repetición y tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['six mens morris', 'mill', 'molino', 'merels'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Mill', es: 'Primer molino' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Millwright', es: 'Maestro molinero' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Grinder', es: 'Muela de piedra' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'flawless',
      title: { en: 'Flawless', es: 'Sin bajas' },
      description: {
        en: 'Beat the computer without losing a piece.',
        es: 'Vence a la CPU sin perder ninguna ficha.',
      },
    },
    {
      id: 'miller',
      title: { en: 'Miller', es: 'Molinero' },
      description: {
        en: 'Close 5 mills in one game against the computer.',
        es: 'Cierra 5 molinos en una partida contra la CPU.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Village Green', es: 'Plaza del pueblo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
