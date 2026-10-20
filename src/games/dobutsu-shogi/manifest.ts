import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'dobutsu-shogi',
  number: 22,
  title: { en: 'Animal Shogi 3×4', es: 'Shogi de animales 3×4' },
  tagline: {
    en: 'Lion, giraffe, elephant and chick on a 3×4 board — with drops.',
    es: 'León, jirafa, elefante y pollito en un tablero de 3×4, con lanzamientos.',
  },
  description: {
    en: 'A pocket shogi for all ages: dots show how each animal moves, captured animals come back as drops, and you win by catching the lion or bringing yours safely to the far row.',
    es: 'Un shogi de bolsillo para todas las edades: los puntos muestran cómo se mueve cada animal, los capturados vuelven como lanzamientos y ganas atrapando al león o llevando el tuyo a salvo a la última fila.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['animal shogi', 'mini shogi', 'kids', 'drops', 'shogi de animales'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Little Victory', es: 'Pequeña victoria' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Zookeeper', es: 'Cuidador del zoo' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Lion Tamer', es: 'Domador de leones' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'King of the Savanna', es: 'Rey de la sabana' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'hen',
      title: { en: 'All Grown Up', es: 'Ya es mayor' },
      description: {
        en: 'Promote a chick into a hen against the computer.',
        es: 'Convierte un pollito en gallina contra la CPU.',
      },
    },
    {
      id: 'home-run',
      title: { en: 'Home Run', es: 'Carrera a casa' },
      description: {
        en: 'Win by bringing your lion safely to the far row.',
        es: 'Gana llevando tu león a salvo a la última fila.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Playground', es: 'Patio de recreo' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
