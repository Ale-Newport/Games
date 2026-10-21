import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hex-11x11',
  number: 29,
  title: { en: 'Hex 11×11', es: 'Hex 11×11' },
  tagline: {
    en: 'Connect your two sides — there are no draws.',
    es: 'Une tus dos lados: no hay empates.',
  },
  description: {
    en: 'Hex on a 11×11 rhombus with the swap rule: Red joins top and bottom, Blue joins left and right. Four Monte Carlo computer levels, clocks and resignation.',
    es: 'Hex en un rombo de 11×11 con la regla de intercambio: Rojo une arriba y abajo, Azul izquierda y derecha. Cuatro niveles de CPU Monte Carlo, relojes y rendición.',
  },
  category: 'board',
  genre: { en: 'Connection game', es: 'Juego de conexión' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['hex', 'connection', 'swap rule', 'abstract', '11x11'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Bridge', es: 'Primer puente' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Connector', es: 'Conector' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Ladder Master', es: 'Maestro de escaleras' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Unbreakable', es: 'Irrompible' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'short-path',
      title: { en: 'Straight Line', es: 'Línea recta' },
      description: {
        en: 'Beat the computer using at most 13 stones.',
        es: 'Vence a la CPU usando 13 piedras o menos.',
      },
    },
    {
      id: 'swap-win',
      title: { en: 'Thanks for the Stone', es: 'Gracias por la piedra' },
      description: {
        en: 'Swap as Blue and win against the computer.',
        es: 'Intercambia jugando con azul y gana a la CPU.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Pencil and Paper', es: 'Lápiz y papel' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
