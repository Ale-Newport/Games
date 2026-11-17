import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'peg-solitaire',
  number: 128,
  title: { en: 'Peg Solitaire', es: 'Solitario de clavijas' },
  tagline: {
    en: 'Jump pegs off the board until one is left — on eight boards, from the English cross to the hexagon.',
    es: 'Salta clavijas hasta que quede una: en ocho tableros, de la cruz inglesa al hexágono.',
  },
  description: {
    en: 'The classic jumping puzzle on eight boards: English, European, German, asymmetric 3-3-2-2, diamond, two triangles and a hexagon. Tap a peg and a highlighted hole, undo freely, and ask for hints from a solver that searches for a way to a single peg — or tells you when none is left.',
    es: 'El clásico puzle de saltos en ocho tableros: inglés, europeo, alemán, asimétrico 3-3-2-2, diamante, dos triángulos y un hexágono. Toca una clavija y un hueco resaltado, deshaz cuando quieras y pide pistas a un solucionador que busca el camino hasta una sola clavija, o te avisa cuando ya no hay ninguno.',
  },
  category: 'puzzle',
  genre: { en: 'Jumping', es: 'Saltos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pegs left', es: 'Clavijas' }, lowerIsBetter: true },
  tags: ['pegs', 'solitaire', 'classic', 'logic', 'board'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Last Peg Standing', es: 'La última clavija' },
      description: {
        en: 'Finish any board with one peg.',
        es: 'Termina cualquier tablero con una clavija.',
      },
    },
    {
      id: 'centre',
      title: { en: 'Dead Centre', es: 'En el centro' },
      description: {
        en: 'Finish the English board with the last peg in the centre.',
        es: 'Termina el tablero inglés con la última clavija en el centro.',
      },
    },
    {
      id: 'european',
      title: { en: 'Continental', es: 'Continental' },
      description: { en: 'Finish the European board.', es: 'Termina el tablero europeo.' },
    },
    {
      id: 'clean',
      title: { en: 'No Second Thoughts', es: 'Sin vuelta atrás' },
      description: {
        en: 'Finish a board without undoing or hints.',
        es: 'Termina un tablero sin deshacer ni pedir pistas.',
      },
    },
  ],
};
