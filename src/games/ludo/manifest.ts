import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'ludo',
  number: 145,
  title: { en: 'Ludo', es: 'Ludo' },
  tagline: {
    en: 'The family race game: sixes to get out, captures to send rivals home, and stars to hide on.',
    es: 'El juego de carreras familiar: seises para salir, capturas que devuelven al rival a casa y estrellas donde esconderse.',
  },
  description: {
    en: 'Classic Ludo for two to four players on the cross-shaped board: a six brings a token out and rolls again, landing on a rival sends it back to its yard, start squares and stars are safe, two tokens together cannot be captured, and capturing or reaching home earns another roll. Play against computer players at two levels, with everyone on one device, or watch the AI.',
    es: 'El ludo clásico para dos a cuatro jugadores en el tablero en cruz: un seis saca una ficha y repite tirada, caer sobre un rival lo devuelve a su corral, las salidas y las estrellas son seguras, dos fichas juntas no se pueden comer, y comer o llegar a casa da otra tirada. Juega contra el ordenador en dos niveles, con todos en un dispositivo o mira a la IA.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Tokens home', es: 'Fichas en casa' } },
  tags: ['dice', 'race', 'family', 'multiplayer', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Home Run', es: 'A casa' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Outplayed', es: 'Superados' },
      description: {
        en: 'Win against hard computer players.',
        es: 'Gana contra rivales difíciles.',
      },
    },
    {
      id: 'four',
      title: { en: 'Full Table', es: 'Mesa completa' },
      description: {
        en: 'Win a four-player game against the computer.',
        es: 'Gana una partida a cuatro contra el ordenador.',
      },
    },
    {
      id: 'hunter',
      title: { en: 'Hunter', es: 'Cazador' },
      description: {
        en: 'Win after capturing at least three tokens.',
        es: 'Gana tras comerte al menos tres fichas.',
      },
    },
  ],
};
