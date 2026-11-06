import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'three-mens-morris',
  number: 31,
  title: { en: "Three Men's Morris", es: 'Molino de tres' },
  tagline: { en: 'Tic-tac-toe that keeps moving.', es: 'Un tres en raya que no se detiene.' },
  description: {
    en: "Three Men's Morris with placement and movement phases, lines of three that win at once, draws by repetition, and three computer levels.",
    es: 'Molino de tres con fases de colocación y movimiento, líneas de tres que ganan al instante, tablas por repetición y tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['three mens morris', 'mill', 'molino', 'small board'],
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
      id: 'quick-line',
      title: { en: 'Quick Line', es: 'Línea rápida' },
      description: {
        en: 'Beat the computer during the placement phase.',
        es: 'Vence a la CPU durante la colocación.',
      },
    },
    {
      id: 'slide-win',
      title: { en: 'Sliding Win', es: 'Victoria deslizante' },
      description: {
        en: 'Beat the computer by sliding a piece into line.',
        es: 'Vence a la CPU deslizando una ficha hasta hacer línea.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Village Green', es: 'Plaza del pueblo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
