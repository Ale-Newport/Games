import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'oware',
  number: 62,
  title: { en: 'Oware', es: 'Oware' },
  tagline: {
    en: 'The West African sowing game of twos and threes, played the Abapa way.',
    es: 'El juego de siembra de África occidental de los doses y treses, a la manera abapa.',
  },
  description: {
    en: 'Sow the seeds of one of your six pits counter-clockwise. If your last seed makes an opponent’s pit hold two or three, you capture it and any such pits just before it. You must always leave your opponent something to play. Capture 25 seeds to win.',
    es: 'Siembra las semillas de una de tus seis casillas en sentido antihorario. Si tu última semilla deja una casilla rival con dos o tres, la capturas, y también las anteriores que queden igual. Siempre debes dejar al rival algo que jugar. Captura 25 semillas para ganar.',
  },
  category: 'strategy',
  genre: { en: 'Mancala', es: 'Mancala' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['oware', 'abapa', 'mancala', 'sowing'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Two or Three', es: 'Dos o tres' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Feeding Time', es: 'Hora de comer' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of Abapa', es: 'Maestro del abapa' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'big-store',
      title: { en: 'Grand Harvest', es: 'Gran cosecha' },
      description: {
        en: 'Win with 30 or more seeds captured.',
        es: 'Gana con 30 semillas capturadas o más.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
