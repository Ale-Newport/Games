import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sim',
  number: 49,
  title: { en: 'Sim', es: 'Sim' },
  tagline: {
    en: 'Six points, fifteen lines, and a triangle you must not draw.',
    es: 'Seis puntos, quince líneas y un triángulo que no debes dibujar.',
  },
  description: {
    en: 'Take turns coloring the lines that join six points. Whoever completes a triangle in their own color loses — and with six points someone always must. Hard plays perfectly with an exact solver.',
    es: 'Colorea por turnos las líneas que unen seis puntos. Quien completa un triángulo de su color pierde, y con seis puntos alguien siempre acaba haciéndolo. Difícil juega perfecto con un solucionador exacto.',
  },
  category: 'strategy',
  genre: { en: 'Mathematical game', es: 'Juego matemático' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['sim', 'ramsey', 'graph', 'math'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Triangle-Free', es: 'Sin triángulos' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Safe Lines', es: 'Líneas seguras' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Ramsey’s Theorem', es: 'Teorema de Ramsey' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'first-mover',
      title: { en: 'Against the Odds', es: 'Contra pronóstico' },
      description: {
        en: 'Win a round in which you moved first (the second player wins with perfect play).',
        es: 'Gana una ronda en la que empezaste tú (con juego perfecto gana el segundo).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
