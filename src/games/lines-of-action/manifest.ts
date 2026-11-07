import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'lines-of-action',
  number: 68,
  title: { en: 'Lines of Action', es: 'Líneas de acción' },
  tagline: {
    en: 'Move exactly as far as the line is full — and pull all your pieces into one group.',
    es: 'Avanza exactamente tantas casillas como piezas tenga la línea y reúne todas tus fichas.',
  },
  description: {
    en: 'A piece moves in a straight line exactly as many squares as there are pieces on that line. Jump your own pieces, capture by landing on the opponent’s, and be the first to connect all your pieces into a single group.',
    es: 'Una ficha se mueve en línea recta exactamente tantas casillas como piezas haya en esa línea. Salta tus propias fichas, captura cayendo sobre las del rival y sé el primero en unir todas tus fichas en un solo grupo.',
  },
  category: 'strategy',
  genre: { en: 'Connection', es: 'Conexión' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['lines of action', 'connection', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'All Together', es: 'Todos juntos' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'In Line', es: 'En línea' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Line Master', es: 'Maestro de las líneas' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'unbroken',
      title: { en: 'Unbroken', es: 'Intacto' },
      description: {
        en: 'Win without losing a single piece.',
        es: 'Gana sin perder ni una ficha.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
