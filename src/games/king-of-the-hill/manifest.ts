import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'king-of-the-hill',
  number: 18,
  title: { en: 'King of the Hill Chess', es: 'Ajedrez rey de la colina' },
  tagline: {
    en: 'Mate the king — or march yours to the center first.',
    es: 'Da mate al rey o lleva el tuyo al centro antes.',
  },
  description: {
    en: 'Standard chess with a second way to win: bring your king safely to d4, e4, d5 or e5. Clocks, resignation and four computer levels that know the race.',
    es: 'Ajedrez estándar con una segunda forma de ganar: lleva tu rey a salvo a d4, e4, d5 o e5. Relojes, rendición y cuatro niveles de CPU que conocen la carrera.',
  },
  category: 'board',
  genre: { en: 'Chess variant', es: 'Variante de ajedrez' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['king of the hill', 'koth', 'chess variant', 'rey de la colina'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Climber', es: 'Escalador' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Hillside', es: 'Ladera' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Ridge Walker', es: 'Caminante de crestas' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'Peak Performance', es: 'En la cima' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'summit',
      title: { en: 'Summit', es: 'Cumbre' },
      description: {
        en: 'Win by bringing your king to the hill.',
        es: 'Gana llevando tu rey a la colina.',
      },
    },
    {
      id: 'old-school',
      title: { en: 'Old School', es: 'A la antigua' },
      description: {
        en: 'Win King of the Hill by checkmate instead.',
        es: 'Gana al rey de la colina por jaque mate.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Hill Party', es: 'Fiesta en la colina' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
