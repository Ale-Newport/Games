import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'maze-chase-advanced',
  number: 177,
  title: { en: 'Shifting Mazes', es: 'Laberintos cambiantes' },
  tagline: {
    en: 'The maze chase with four mazes, restless sentinels and a gem on the move.',
    es: 'La persecución con cuatro laberintos, centinelas inquietos y una gema en marcha.',
  },
  description: {
    en: 'The advanced maze chase: four generated mazes that change every two levels, sentinels that sometimes take an unexpected turn at a junction, and a bonus gem that enters through the tunnel and wanders the corridors. Same rover, seeds and power cells as Maze Chase; arrow keys or the touch pad, and an AI to watch.',
    es: 'La persecución avanzada: cuatro laberintos generados que cambian cada dos niveles, centinelas que a veces toman un giro inesperado en un cruce y una gema de bonificación que entra por el túnel y recorre los pasillos. El mismo robot, semillas y celdas de energía que en Persecución en el laberinto; flechas o panel táctil, y una IA para mirar.',
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
      id: 'gem',
      title: { en: 'Gem Hunter', es: 'Cazagemas' },
      description: { en: 'Catch the wandering gem.', es: 'Atrapa la gema errante.' },
    },
    {
      id: 'mazes',
      title: { en: 'New Ground', es: 'Terreno nuevo' },
      description: {
        en: 'Reach the second maze (level 3).',
        es: 'Llega al segundo laberinto (nivel 3).',
      },
    },
    {
      id: 'score',
      title: { en: 'High Scorer', es: 'Gran puntuación' },
      description: { en: 'Score 20 000 points.', es: 'Consigue 20 000 puntos.' },
    },
  ],
};
