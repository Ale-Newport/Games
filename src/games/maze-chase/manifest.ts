import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'maze-chase',
  number: 176,
  title: { en: 'Maze Chase', es: 'Persecución en el laberinto' },
  tagline: {
    en: 'Clear the maze of seeds before the sentinels corner you.',
    es: 'Vacía el laberinto de semillas antes de que los centinelas te acorralen.',
  },
  description: {
    en: 'A maze chase with original art: steer a little rover through one maze, level after level, eating every seed while four sentinels — each with its own way of hunting — close in. Power cells turn them blue for a few seconds so you can catch them for 200, 400, 800 and 1600. Arrow keys or the touch pad; watch an AI that weighs food against danger.',
    es: 'Una persecución en un laberinto con arte original: guía un pequeño robot por un laberinto, nivel tras nivel, comiendo todas las semillas mientras cuatro centinelas, cada uno con su forma de cazar, te cercan. Las celdas de energía los vuelven azules unos segundos y puedes atraparlos por 200, 400, 800 y 1600. Flechas o panel táctil; mira jugar a una IA que sopesa comida y peligro.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'maze', 'chase'],
  achievements: [
    {
      id: 'hunt',
      title: { en: 'Turning the Tables', es: 'Las tornas cambian' },
      description: { en: 'Catch a blue sentinel.', es: 'Atrapa a un centinela azul.' },
    },
    {
      id: 'combo',
      title: { en: 'Clean Sweep', es: 'Barrida completa' },
      description: {
        en: 'Catch all four sentinels with one power cell.',
        es: 'Atrapa a los cuatro centinelas con una sola celda de energía.',
      },
    },
    {
      id: 'clear',
      title: { en: 'Maze Cleared', es: 'Laberinto despejado' },
      description: { en: 'Clear a maze of seeds.', es: 'Vacía un laberinto de semillas.' },
    },
    {
      id: 'score',
      title: { en: 'High Scorer', es: 'Gran puntuación' },
      description: { en: 'Score 10 000 points.', es: 'Consigue 10 000 puntos.' },
    },
  ],
};
