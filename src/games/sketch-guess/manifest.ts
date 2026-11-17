import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'sketch-guess',
  number: 213,
  title: { en: 'Sketch & Guess', es: 'Dibuja y adivina' },
  tagline: {
    en: 'Draw the word, guess the doodle — against bots that draw real human sketches.',
    es: 'Dibuja la palabra, adivina el garabato, contra bots que dibujan bocetos humanos reales.',
  },
  description: {
    en: 'The drawing-and-guessing party game in a room of up to seven bots: on your turn pick a word and draw it while the bots try to recognise it; on theirs, they replay real human doodles stroke by stroke and you race to guess in the chat as letters are revealed. Faster guesses score more, the drawer scores for every guesser, and the podium waits after the last round. English or Spanish words.',
    es: 'El juego de dibujar y adivinar en una sala de hasta siete bots: en tu turno eliges una palabra y la dibujas mientras los bots intentan reconocerla; en el suyo, reproducen garabatos humanos reales trazo a trazo y tú compites por adivinar en el chat mientras se revelan letras. Acertar antes da más puntos, quien dibuja puntúa por cada acierto y el podio espera tras la última ronda. Palabras en inglés o español.',
  },
  category: 'viral',
  genre: { en: 'Drawing / party', es: 'Dibujo / fiesta' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['skribbl', 'pictionary', 'drawing', 'guess', 'party', 'quick draw', 'spanish'],
  achievements: [
    {
      id: 'first-game',
      title: { en: 'Doodler', es: 'Garabateador' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'first-guess',
      title: { en: 'Sharp Eye', es: 'Buen ojo' },
      description: {
        en: 'Be the first to guess a word.',
        es: 'Sé el primero en adivinar una palabra.',
      },
    },
    {
      id: 'artist',
      title: { en: 'Recognisable', es: 'Reconocible' },
      description: {
        en: 'Have every bot guess your drawing.',
        es: 'Haz que todos los bots adivinen tu dibujo.',
      },
    },
    {
      id: 'winner',
      title: { en: 'Top of the Room', es: 'Primero de la sala' },
      description: { en: 'Win a game.', es: 'Gana una partida.' },
    },
    {
      id: 'full-room',
      title: { en: 'Full House', es: 'Sala llena' },
      description: { en: 'Win against seven bots.', es: 'Gana contra siete bots.' },
    },
  ],
};
