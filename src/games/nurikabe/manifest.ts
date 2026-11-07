import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'nurikabe',
  number: 115,
  title: { en: 'Nurikabe', es: 'Nurikabe' },
  tagline: {
    en: 'Shade the sea around numbered islands: one stream, no pools — generated grids with hints that teach.',
    es: 'Sombrea el mar alrededor de islas numeradas: un solo cauce y sin charcos, con tableros generados y pistas que enseñan.',
  },
  description: {
    en: 'Every island holds one number equal to its size, the sea connects everywhere and never fills a 2×2 block. Grids are generated with exactly one solution, checked to be solvable by reasoning, and the hints explain each step. Undo, a daily puzzle and an AI that solves while you watch.',
    es: 'Cada isla tiene un número igual a su tamaño, el mar llega a todas partes y nunca llena un bloque de 2×2. Los tableros se generan con una única solución, se comprueba que se resuelven razonando y las pistas explican cada paso. Deshacer, puzle del día y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (shading)', es: 'Puzle de lógica (sombreado)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['nurikabe', 'islands', 'shading', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Islander', es: 'Isleño' },
      description: { en: 'Solve a nurikabe.', es: 'Resuelve un nurikabe.' },
    },
    {
      id: 'clean',
      title: { en: 'Clean Sheet', es: 'Hoja limpia' },
      description: {
        en: 'Solve without a mistake or a hint.',
        es: 'Resuelve sin errores ni pistas.',
      },
    },
    {
      id: 'speed',
      title: { en: 'Quick Pencil', es: 'Lápiz rápido' },
      description: {
        en: 'Solve a 7×7 nurikabe in under 5 minutes without hints.',
        es: 'Resuelve un nurikabe de 7×7 en menos de 5 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Open Sea', es: 'Mar abierto' },
      description: { en: 'Solve an 8×8 nurikabe.', es: 'Resuelve un nurikabe de 8×8.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
