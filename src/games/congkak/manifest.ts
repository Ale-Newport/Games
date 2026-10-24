import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'congkak',
  number: 64,
  title: { en: 'Congkak', es: 'Congkak' },
  tagline: {
    en: 'The Malay relay-sowing mancala: long chains, big swings.',
    es: 'El mancala malayo de siembra encadenada: cadenas largas y grandes vuelcos.',
  },
  description: {
    en: 'Seven houses a side and seven seeds in each. Sow counter-clockwise through your own store; if your last seed lands in a house that already had seeds, pick them all up and keep sowing. End in your store to go again, or in an empty house of yours to capture across. Most seeds wins.',
    es: 'Siete casas por lado y siete semillas en cada una. Siembra en sentido antihorario pasando por tu almacén; si tu última semilla cae en una casa que ya tenía semillas, tómalas todas y sigue sembrando. Si acabas en tu almacén vuelves a jugar; en una casa vacía tuya, capturas enfrente. Gana quien reúne más.',
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
  tags: ['congkak', 'malaysia', 'mancala', 'relay sowing'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Village Champion', es: 'Campeón del pueblo' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Long Chain', es: 'Cadena larga' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of Congkak', es: 'Maestro del congkak' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'big-store',
      title: { en: 'Overflowing Store', es: 'Almacén rebosante' },
      description: {
        en: 'Win with 60 or more seeds in your store.',
        es: 'Gana con 60 semillas o más en tu almacén.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
