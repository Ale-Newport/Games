import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'ataxx',
  number: 37,
  title: { en: 'Ataxx', es: 'Ataxx' },
  tagline: {
    en: 'Clone, jump and convert the board to your color.',
    es: 'Clona, salta y convierte el tablero a tu color.',
  },
  description: {
    en: 'On a 7×7 board, grow by cloning to a neighboring cell or leap two cells away, converting every adjacent enemy piece. The most pieces at the end wins. Three computer levels.',
    es: 'En un tablero de 7×7, crece clonando a una casilla vecina o salta dos casillas, convirtiendo cada pieza rival adyacente. Gana quien tenga más piezas al final. Tres niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['ataxx', 'infection', 'clone', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Spreading Out', es: 'Expansión' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Contagious', es: 'Contagioso' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Takeover', es: 'Toma total' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'wipeout',
      title: { en: 'Wipeout', es: 'Barrido' },
      description: {
        en: 'Win by converting every enemy piece.',
        es: 'Gana convirtiendo todas las piezas rivales.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
