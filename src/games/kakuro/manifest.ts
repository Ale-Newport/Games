import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'kakuro',
  number: 108,
  title: { en: 'Kakuro', es: 'Kakuro' },
  tagline: {
    en: 'A crossword of sums: generated puzzles with a unique solution, a combinations helper and hints that teach.',
    es: 'Un crucigrama de sumas: tableros generados con solución única, ayuda de combinaciones y pistas que enseñan.',
  },
  description: {
    en: 'Fill the white cells with 1–9 so every run adds up to its clue without repeating a digit. Boards are generated with a symmetric layout and checked to have exactly one solution reachable by reasoning; the combinations still open for the selected runs are shown as you play. Notes, undo, a daily puzzle, explained hints and an AI that solves while you watch.',
    es: 'Rellena las casillas blancas con 1–9 para que cada tramo sume su pista sin repetir números. Los tableros se generan con un diseño simétrico y se comprueba que tienen una única solución a la que se llega razonando; mientras juegas ves las combinaciones que siguen abiertas. Notas, deshacer, kakuro del día, pistas explicadas y una IA que resuelve mientras miras.',
  },
  category: 'puzzle',
  genre: { en: 'Logic puzzle (sums)', es: 'Puzle de lógica (sumas)' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Time', es: 'Tiempo' }, lowerIsBetter: true },
  tags: ['kakuro', 'cross sums', 'logic', 'numbers', 'daily'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Summed Up', es: 'Bien sumado' },
      description: { en: 'Solve a kakuro.', es: 'Resuelve un kakuro.' },
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
        en: 'Solve a Medium kakuro in under 10 minutes without hints.',
        es: 'Resuelve un kakuro medio en menos de 10 minutos sin pistas.',
      },
    },
    {
      id: 'hardest',
      title: { en: 'Cross Sums', es: 'Sumas cruzadas' },
      description: { en: 'Solve a Hard kakuro.', es: 'Resuelve un kakuro difícil.' },
    },
    {
      id: 'daily',
      title: { en: 'Daily Habit', es: 'Hábito diario' },
      description: { en: "Solve today's puzzle.", es: 'Resuelve el kakuro del día.' },
    },
  ],
};
