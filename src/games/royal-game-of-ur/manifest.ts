import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'royal-game-of-ur',
  number: 143,
  title: { en: 'Royal Game of Ur', es: 'Juego Real de Ur' },
  tagline: {
    en: 'The oldest playable board game: race seven pieces past captures, with rosettes for another throw.',
    es: 'El juego de tablero jugable más antiguo: corre con siete piezas entre capturas, con rosetas que dan otra tirada.',
  },
  description: {
    en: "The race game found in the royal tombs of Ur, with Irving Finkel's reconstructed rules: pyramid dice from 0 to 4, seven pieces a side, captures on the shared middle row, rosettes that give another throw, and a safe central rosette. Play the computer at two strengths — greedy, or an expectiminimax search over every throw — or a friend on the same device.",
    es: 'El juego de carrera hallado en las tumbas reales de Ur, con las reglas reconstruidas por Irving Finkel: dados piramidales de 0 a 4, siete piezas por bando, capturas en la fila central compartida, rosetas que dan otra tirada y una roseta central segura. Juega contra el ordenador en dos niveles —voraz, o una búsqueda expectiminimax sobre cada tirada— o contra alguien en el mismo dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pieces ahead', es: 'Piezas de ventaja' } },
  tags: ['dice', 'race', 'ancient', 'two-player', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Royal Victory', es: 'Victoria real' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Scribe of Ur', es: 'Escriba de Ur' },
      description: { en: 'Beat the hard computer.', es: 'Vence al ordenador difícil.' },
    },
    {
      id: 'shutout',
      title: { en: 'Seven to None', es: 'Siete a cero' },
      description: {
        en: 'Win before the computer bears off a single piece.',
        es: 'Gana antes de que el ordenador saque una sola pieza.',
      },
    },
    {
      id: 'raider',
      title: { en: 'Raider', es: 'Asaltante' },
      description: {
        en: 'Win after capturing at least three pieces.',
        es: 'Gana tras capturar al menos tres piezas.',
      },
    },
  ],
};
