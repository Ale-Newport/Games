import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'snakes-and-ladders',
  number: 148,
  title: { en: 'Snakes and Ladders', es: 'Serpientes y escaleras' },
  tagline: {
    en: 'The ancient race of luck — plus a Choice variant where two dice and a good plan make the difference.',
    es: 'La antigua carrera de suerte, más una variante de Elección en la que dos dados y un buen plan marcan la diferencia.',
  },
  description: {
    en: 'Snakes and Ladders on a board of its own: nine ladders, ten snakes, and an exact throw to finish. The classic game is pure chance; the Choice variant throws two dice each turn and lets you move by either, and its computer player plans with an exact value iteration of the expected turns to 100. Two to four players against the computer or on one device.',
    es: 'Serpientes y escaleras en un tablero propio: nueve escaleras, diez serpientes y tirada exacta para terminar. El juego clásico es puro azar; la variante de Elección tira dos dados por turno y deja mover con cualquiera, y su jugador artificial planifica con una iteración de valor exacta de los turnos esperados hasta el 100. De dos a cuatro jugadores contra el ordenador o en un dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Square', es: 'Casilla' } },
  tags: ['dice', 'race', 'family', 'kids', 'multiplayer'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Top of the Board', es: 'En lo más alto' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
    {
      id: 'choice',
      title: { en: 'Good Judgement', es: 'Buen criterio' },
      description: {
        en: 'Win a Choice game against the computer.',
        es: 'Gana una partida de Elección contra el ordenador.',
      },
    },
    {
      id: 'charmed',
      title: { en: 'Snake Charmer', es: 'Encantador de serpientes' },
      description: {
        en: 'Win without sliding down a single snake.',
        es: 'Gana sin bajar por ninguna serpiente.',
      },
    },
    {
      id: 'four',
      title: { en: 'Full House', es: 'Casa llena' },
      description: {
        en: 'Win a four-player game against the computer.',
        es: 'Gana una partida a cuatro contra el ordenador.',
      },
    },
  ],
};
