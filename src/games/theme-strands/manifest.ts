import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'theme-strands',
  number: 210,
  title: { en: 'Theme Strands', es: 'Hebras temáticas' },
  tagline: {
    en: 'Trace the theme words through a grid of letters — and find the spangram that spans it.',
    es: 'Traza las palabras del tema en una cuadrícula de letras y encuentra la palabra puente.',
  },
  description: {
    en: 'The daily theme word search: a 6×8 grid of letters hides theme words that use every letter exactly once, plus one spangram that touches two opposite sides. Trace words by dragging or tapping; other real words fill a hint meter. Original themes in English and Spanish, generated grids, a share line and a dictionary-search AI.',
    es: 'La sopa de letras temática diaria: una cuadrícula de 6×8 esconde palabras del tema que usan cada letra exactamente una vez, y una palabra puente que toca dos lados opuestos. Traza palabras arrastrando o tocando; otras palabras reales llenan el medidor de pistas. Temas originales en inglés y español, cuadrículas generadas, línea para compartir y una IA que busca con diccionario.',
  },
  category: 'viral',
  genre: { en: 'Word search', es: 'Sopa de letras' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Hints used', es: 'Pistas usadas' }, lowerIsBetter: true },
  tags: ['strands', 'word search', 'theme', 'daily', 'spangram', 'spanish'],
  achievements: [
    {
      id: 'first-solve',
      title: { en: 'Untangled', es: 'Desenredado' },
      description: {
        en: 'Find every theme word of a puzzle.',
        es: 'Encuentra todas las palabras de un puzle.',
      },
    },
    {
      id: 'no-hints',
      title: { en: 'No Help Needed', es: 'Sin ayuda' },
      description: { en: 'Solve a puzzle without hints.', es: 'Resuelve un puzle sin pistas.' },
    },
    {
      id: 'spangram-first',
      title: { en: 'Bridge First', es: 'Primero el puente' },
      description: {
        en: 'Find the spangram before any other word.',
        es: 'Encuentra la palabra puente antes que ninguna otra.',
      },
    },
    {
      id: 'ten',
      title: { en: 'Strand Collector', es: 'Coleccionista de hebras' },
      description: { en: 'Solve ten puzzles.', es: 'Resuelve diez puzles.' },
    },
  ],
};
