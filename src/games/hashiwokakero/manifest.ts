import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'hashiwokakero',
  number: 114,
  title: { en: 'Bridges (Hashiwokakero)', es: 'Puentes (Hashiwokakero)' },
  tagline: {
    en: 'Link every island with straight bridges, one or two at a time: generated seas from 7×7 to 13×13.',
    es: 'Une todas las islas con puentes rectos, de uno en uno o de dos en dos: mares generados de 7×7 a 13×13.',
  },
  description: {
    en: 'Each island wants as many bridges as its number; bridges run straight, at most two per pair, never cross, and must connect everything. Seas are generated with exactly one solution, checked to be solvable by reasoning, and the hints name the technique. Undo, a daily puzzle and an AI that builds while you watch.',
    es: 'Cada isla quiere tantos puentes como su número; los puentes van rectos, como mucho dos por pareja, no se cruzan y deben unirlo todo. Los mares se generan con una única solución, se comprueba que se resuelven razonando y las pistas nombran la técnica. Deshacer, puzle del día y una IA que construye mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Connection logic', es: 'Lógica de conexiones' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['hashiwokakero', 'bridges', 'islands', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Bridge Builder', es: 'Constructor de puentes' },
      description: { en: 'Solve a bridges puzzle.', es: 'Resuelve un puzle de puentes.' },
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
        en: 'Solve an 11×11 sea in under 5 minutes without hints.',
        es: 'Resuelve un mar de 11×11 en menos de 5 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Archipelago', es: 'Archipiélago' },
      description: { en: 'Solve a 13×13 sea.', es: 'Resuelve un mar de 13×13.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
