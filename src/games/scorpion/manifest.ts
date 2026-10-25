import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'scorpion',
  number: 81,
  title: { en: 'Scorpion', es: 'Escorpión' },
  tagline: {
    en: 'Build four suits from king to ace, dragging whole tangles of cards with you.',
    es: 'Forma los cuatro palos del rey al as arrastrando marañas enteras de cartas.',
  },
  description: {
    en: 'Seven columns of seven, a few face down, three cards in reserve. Build down by suit; any face-up card moves with everything on it. Complete a king-to-ace run of one suit and it leaves the table — finish all four.',
    es: 'Siete columnas de siete, algunas boca abajo, y tres cartas de reserva. Baja del mismo palo; cualquier carta boca arriba se mueve con todo lo que tiene encima. Completa una escalera del rey al as de un palo y saldrá de la mesa: termina las cuatro.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: null,
  tags: ['scorpion', 'solitaire', 'patience', 'cards'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Sting', es: 'Aguijón' },
      description: { en: 'Solve a deal.', es: 'Resuelve una partida.' },
    },
    {
      id: 'no-reserve',
      title: { en: 'Held in Reserve', es: 'Reserva intacta' },
      description: {
        en: 'Solve a deal without dealing the three reserve cards.',
        es: 'Resuelve una partida sin repartir las tres cartas de reserva.',
      },
    },
    {
      id: 'clean',
      title: { en: 'Desert Patience', es: 'Paciencia del desierto' },
      description: {
        en: 'Solve a deal without undo or hints.',
        es: 'Resuelve una partida sin deshacer ni pistas.',
      },
    },
  ],
};
