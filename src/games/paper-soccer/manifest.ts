import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'paper-soccer',
  number: 69,
  title: { en: 'Paper Soccer', es: 'Fútbol de papel' },
  tagline: {
    en: 'Draw the ball’s path line by line, bounce off old lines, and slip it into the goal.',
    es: 'Traza el camino del balón línea a línea, rebota en las viejas y mételo en la portería.',
  },
  description: {
    en: 'The ball moves one dot at a time in any of eight directions, never along a line already drawn or along the edge. Land on a dot that has been used before, or on the edge, and you bounce and move again. Get the ball into the other goal — and leave your opponent no way out.',
    es: 'El balón avanza de punto en punto en cualquiera de las ocho direcciones, nunca por una línea ya trazada ni por el borde. Si cae en un punto ya usado o en el borde, rebotas y vuelves a mover. Mete el balón en la otra portería y no dejes salida al rival.',
  },
  category: 'strategy',
  genre: { en: 'Pencil and paper', es: 'Lápiz y papel' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['paper soccer', 'pencil and paper', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Back of the Net', es: 'Al fondo de la red' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Playmaker', es: 'Creador de juego' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Golden Boot', es: 'Bota de oro' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'combo',
      title: { en: 'Bank Shot', es: 'A la banda' },
      description: {
        en: 'Score with a turn of five lines or more.',
        es: 'Marca con un turno de cinco líneas o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
