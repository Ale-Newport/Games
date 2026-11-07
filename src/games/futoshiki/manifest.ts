import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'futoshiki',
  number: 110,
  title: { en: 'Futoshiki', es: 'Futoshiki' },
  tagline: {
    en: 'A Latin square with greater-than signs, from 4×4 to 7×7: unique puzzles and hints that teach.',
    es: 'Un cuadrado latino con signos de mayor que, de 4×4 a 7×7: puzles únicos y pistas que enseñan.',
  },
  description: {
    en: 'No digit repeats in a row or column, and every sign between two neighbours points to the smaller one. Puzzles are generated with a unique solution and graded by technique — the signs alone carry most of the logic. Notes, undo, a daily puzzle, explained hints and an AI that solves while you watch.',
    es: 'Ningún número se repite en fila ni columna, y cada signo entre dos vecinas apunta al menor. Los puzles se generan con solución única y se gradúan por técnica: los signos llevan casi toda la lógica. Notas, deshacer, puzle del día, pistas explicadas y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (inequalities)', es: 'Puzle de lógica (desigualdades)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['futoshiki', 'inequality', 'latin square', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'In Order', es: 'En orden' },
      description: { en: 'Solve a futoshiki.', es: 'Resuelve un futoshiki.' },
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
        en: 'Solve a 6×6 futoshiki in under 8 minutes without hints.',
        es: 'Resuelve un futoshiki de 6×6 en menos de 8 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Greater Than', es: 'Mayor que' },
      description: { en: 'Solve a 7×7 futoshiki.', es: 'Resuelve un futoshiki de 7×7.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
