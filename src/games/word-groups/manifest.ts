import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'word-groups',
  number: 208,
  title: { en: 'Word Groups', es: 'Grupos de palabras' },
  tagline: {
    en: 'Sixteen words, four secret groups, four mistakes. Watch out for red herrings.',
    es: 'Dieciséis palabras, cuatro grupos secretos, cuatro errores. Cuidado con los señuelos.',
  },
  description: {
    en: 'The daily grouping puzzle: split sixteen words into four groups of four, from the straightforward yellow group to the devious purple one. Words that seem to fit two groups are the trap; “one away” tells you when you are close. Original puzzles in English and Spanish, a daily puzzle, every puzzle replayable, a share grid and an AI that groups by meaning.',
    es: 'El puzle diario de agrupar: separa dieciséis palabras en cuatro grupos de cuatro, del amarillo directo al morado retorcido. Las palabras que parecen encajar en dos grupos son la trampa; «te falta una» avisa cuando estás cerca. Puzles originales en inglés y en español, puzle diario, todos los puzles rejugables, cuadrícula para compartir y una IA que agrupa por significado.',
  },
  category: 'viral',
  genre: { en: 'Word puzzle', es: 'Puzle de palabras' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Mistakes left', es: 'Errores restantes' } },
  tags: ['connections', 'groups', 'words', 'daily', 'categories', 'spanish'],
  achievements: [
    {
      id: 'first-solve',
      title: { en: 'Connected', es: 'Conectado' },
      description: { en: 'Solve a puzzle.', es: 'Resuelve un puzle.' },
    },
    {
      id: 'flawless',
      title: { en: 'Flawless', es: 'Impecable' },
      description: { en: 'Solve without a mistake.', es: 'Resuelve sin errores.' },
    },
    {
      id: 'purple-first',
      title: { en: 'Purple Prose', es: 'Morado primero' },
      description: { en: 'Find the purple group first.', es: 'Encuentra primero el grupo morado.' },
    },
    {
      id: 'reverse-rainbow',
      title: { en: 'Reverse Rainbow', es: 'Arcoíris al revés' },
      description: {
        en: 'Solve purple, blue, green, then yellow.',
        es: 'Resuelve morado, azul, verde y amarillo, en ese orden.',
      },
    },
    {
      id: 'ten',
      title: { en: 'Ten Puzzles', es: 'Diez puzles' },
      description: { en: 'Solve ten different puzzles.', es: 'Resuelve diez puzles distintos.' },
    },
  ],
};
