import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'freecell',
  number: 73,
  title: { en: 'FreeCell', es: 'FreeCell' },
  tagline: {
    en: 'Every card face up, four free cells, and nearly every deal can be won.',
    es: 'Todas las cartas a la vista, cuatro celdas libres y casi todas las partidas tienen solución.',
  },
  description: {
    en: 'All 52 cards are dealt face up into eight columns. Use the four free cells to park cards, build down in alternating colors, and bring every suit home from ace to king. Skill, not luck: almost every deal is solvable.',
    es: 'Las 52 cartas se reparten boca arriba en ocho columnas. Usa las cuatro celdas libres para apartar cartas, baja en colores alternos y lleva cada palo a casa del as al rey. Habilidad, no suerte: casi todas las partidas tienen solución.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: null,
  tags: ['freecell', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Free and Clear', es: 'Vía libre' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'quick',
      title: { en: 'Clean Sweep', es: 'Barrido limpio' },
      description: {
        en: 'Solve a deal in under 5 minutes.',
        es: 'Resuelve una partida en menos de 5 minutos.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Unassisted', es: 'Sin ayuda' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
    {
      id: 'two-cells',
      title: { en: 'Half the Cells', es: 'Media celda' },
      description: {
        en: 'Solve a deal never using more than two free cells at once.',
        es: 'Resuelve una partida sin usar nunca más de dos celdas libres a la vez.',
      },
    },
  ],
};
