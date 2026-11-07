import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'nonogram',
  number: 112,
  title: { en: 'Nonogram', es: 'Nonograma' },
  tagline: {
    en: 'Paint by numbers: random boards up to 15×15 and a gallery of original pictures, all solvable line by line.',
    es: 'Pinta con números: tableros aleatorios hasta 15×15 y una galería de dibujos originales, todos resolubles línea a línea.',
  },
  description: {
    en: 'The clues around the grid list the runs of filled cells in each row and column; fill and cross cells until the picture appears. Random boards are generated and repaired until the line solver finishes them, and ten original pictures wait in the gallery. Drag to paint, explained hints, undo, a daily puzzle and an AI that paints while you watch.',
    es: 'Las pistas alrededor de la cuadrícula indican los tramos de casillas pintadas de cada fila y columna; pinta y tacha hasta que aparezca el dibujo. Los tableros aleatorios se generan y corrigen hasta que el solucionador por líneas los termina, y en la galería esperan diez dibujos originales. Pintar arrastrando, pistas explicadas, deshacer, puzle del día y una IA que pinta mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Picture logic', es: 'Lógica de dibujos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['nonogram', 'picross', 'griddlers', 'picture', 'logic', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Painted', es: 'Pintado' },
      description: { en: 'Solve a nonogram.', es: 'Resuelve un nonograma.' },
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
        en: 'Solve a random 10×10 nonogram in under 5 minutes without hints.',
        es: 'Resuelve un nonograma aleatorio de 10×10 en menos de 5 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Big Canvas', es: 'Lienzo grande' },
      description: { en: 'Solve a 15×15 nonogram.', es: 'Resuelve un nonograma de 15×15.' },
    },
    {
      id: 'picture',
      title: { en: 'Revealed', es: 'Revelado' },
      description: {
        en: 'Solve a picture from the gallery.',
        es: 'Resuelve un dibujo de la galería.',
      },
    },
    {
      id: 'gallery',
      title: { en: 'Curator', es: 'Conservador' },
      description: {
        en: 'Solve every picture in the gallery.',
        es: 'Resuelve todos los dibujos de la galería.',
      },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el puzle del día.' },
    },
  ],
};
