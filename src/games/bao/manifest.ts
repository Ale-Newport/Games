import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bao',
  number: 63,
  title: { en: 'Bao', es: 'Bao' },
  tagline: {
    en: 'The four-row mancala of East Africa: sow, capture across the middle, sow the catch again.',
    es: 'El mancala de cuatro filas de África oriental: siembra, captura en el centro y vuelve a sembrar.',
  },
  description: {
    en: 'Each player owns two rows of eight pits and sows around them in either direction. End a sowing in an occupied front pit facing enemy seeds and you take them, sowing them back in from the end of your front row; land on an occupied pit and you keep sowing. Capturing is compulsory. Empty your opponent’s front row, or leave them no move, to win.',
    es: 'Cada jugador tiene dos filas de ocho casillas y siembra alrededor de ellas en el sentido que elija. Si una siembra termina en una casilla delantera ocupada frente a semillas rivales, te las llevas y las vuelves a sembrar desde el extremo de tu fila delantera; si cae en una casilla ocupada, sigues sembrando. Capturar es obligatorio. Gana quien vacía la fila delantera del rival o le deja sin jugadas.',
  },
  category: 'strategy',
  genre: { en: 'Mancala', es: 'Mancala' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['bao', 'mancala', 'sowing', 'four-row'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Kujifunza', es: 'Kujifunza' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Across the Middle', es: 'A través del centro' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Bao Master', es: 'Maestro del bao' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'harvest',
      title: { en: 'Full Granary', es: 'Granero lleno' },
      description: {
        en: 'Win holding 48 or more of the 64 seeds.',
        es: 'Gana con 48 o más de las 64 semillas.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
