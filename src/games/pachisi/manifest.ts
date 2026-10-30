import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'pachisi',
  number: 146,
  title: { en: 'Pachisi', es: 'Pachisi' },
  tagline: {
    en: "India's cross-and-circle classic: cowrie throws, grace throws to enter, castles, and partners who win together.",
    es: 'El clásico indio de cruz y círculo: tiradas de cauris, tiradas de gracia para entrar, castillos y compañeros que ganan juntos.',
  },
  description: {
    en: 'The royal game of India on the large cross: six cowrie shells give 2 to 6, 10 or 25; the grace throws (6, 10, 25) bring a piece in and throw again. Pieces start in the centre, run down their own arm, round the whole board and back up home. Captures send a piece back to the centre and earn a throw, castles and pairs are safe, and with four players the opposite arms play as partners.',
    es: 'El juego real de la India en la cruz grande: seis cauris dan de 2 a 6, 10 o 25; las tiradas de gracia (6, 10, 25) entran una pieza y repiten. Las piezas salen del centro, bajan por su brazo, rodean todo el tablero y vuelven a casa. Las capturas devuelven la pieza al centro y dan otra tirada, los castillos y las parejas son seguros, y a cuatro los brazos opuestos juegan como compañeros.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Pieces home', es: 'Piezas en casa' } },
  tags: ['dice', 'race', 'traditional', 'multiplayer', 'teams', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Back to the Centre', es: 'De vuelta al centro' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Court Champion', es: 'Campeón de la corte' },
      description: {
        en: 'Win against hard computer players.',
        es: 'Gana contra rivales difíciles.',
      },
    },
    {
      id: 'four',
      title: { en: 'Partners', es: 'Compañeros' },
      description: {
        en: 'Win a four-player game with your partner.',
        es: 'Gana una partida a cuatro con tu compañero.',
      },
    },
    {
      id: 'hunter',
      title: { en: 'Raider', es: 'Asaltante' },
      description: {
        en: 'Win after capturing at least three pieces.',
        es: 'Gana tras capturar al menos tres piezas.',
      },
    },
  ],
};
