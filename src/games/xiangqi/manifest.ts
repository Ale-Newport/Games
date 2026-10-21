import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'xiangqi',
  number: 23,
  title: { en: 'Xiangqi', es: 'Xiangqi' },
  tagline: {
    en: 'Chinese chess: jump with cannons, cross the river, trap the general.',
    es: 'Ajedrez chino: salta con los cañones, cruza el río, atrapa al general.',
  },
  description: {
    en: 'Xiangqi on the 9×10 intersections with palace and river rules, flying generals, repetition with the perpetual-check rule, clocks and four computer levels.',
    es: 'Xiangqi en las intersecciones de 9×10 con las reglas del palacio y del río, generales enfrentados, repetición con la regla del jaque perpetuo, relojes y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['xiangqi', 'chinese chess', 'ajedrez chino', 'board game'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Across the River', es: 'Al otro lado del río' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Palace Guard', es: 'Guardia del palacio' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Field Marshal', es: 'Mariscal de campo' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Grand General', es: 'Gran general' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'cannon-mate',
      title: { en: 'Thunder Cannon', es: 'Cañón atronador' },
      description: {
        en: 'Checkmate the computer with a cannon move.',
        es: 'Da mate a la CPU con una jugada de cañón.',
      },
    },
    {
      id: 'horse-mate',
      title: { en: 'Galloping Mate', es: 'Mate al galope' },
      description: {
        en: 'Checkmate the computer with a horse move.',
        es: 'Da mate a la CPU con una jugada de caballo.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Park Bench', es: 'Banco del parque' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
