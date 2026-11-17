import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'caption-battle',
  number: 216,
  title: { en: 'Caption Battle', es: 'Batalla de frases' },
  tagline: {
    en: 'Same picture, everyone’s caption — then rate them all from one to five stars.',
    es: 'La misma imagen, la frase de cada uno; luego puntúalas de una a cinco estrellas.',
  },
  description: {
    en: 'The meme-captioning party game: every round all players write a caption for the same original illustrated picture (with a live preview), then rate every other meme with one to five stars. The best meme of the round gets a bonus. Up to four people pass one device; bots caption from their own joke banks and rate by their (declared) taste. English or Spanish.',
    es: 'El juego de poner texto a memes: cada ronda todos escriben una frase para la misma ilustración original (con vista previa) y puntúan los demás memes de una a cinco estrellas. El mejor meme de la ronda gana un extra. Hasta cuatro personas en un dispositivo; los bots usan su propio banco de chistes y puntúan según su gusto (declarado). En inglés o español.',
  },
  category: 'viral',
  genre: { en: 'Party', es: 'Fiesta' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Stars', es: 'Estrellas' } },
  tags: ['make it meme', 'meme', 'caption', 'party', 'funny', 'spanish'],
  achievements: [
    {
      id: 'first-battle',
      title: { en: 'Meme Rookie', es: 'Novato del meme' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'round-winner',
      title: { en: 'Crowd Pleaser', es: 'Gusta al público' },
      description: { en: 'Win a round.', es: 'Gana una ronda.' },
    },
    {
      id: 'five-stars',
      title: { en: 'Five Stars', es: 'Cinco estrellas' },
      description: {
        en: 'Get five stars from every other player in a round.',
        es: 'Recibe cinco estrellas de todos los demás en una ronda.',
      },
    },
    {
      id: 'champion',
      title: { en: 'Meme Champion', es: 'Campeón del meme' },
      description: { en: 'Finish with the most stars.', es: 'Termina con más estrellas.' },
    },
  ],
};
