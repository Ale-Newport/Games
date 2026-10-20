import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'chess960',
  number: 16,
  title: { en: 'Chess960', es: 'Ajedrez 960' },
  tagline: {
    en: 'Same rules, shuffled back rank — opening theory stays home.',
    es: 'Las mismas reglas con la fila de atrás barajada: la teoría de aperturas se queda en casa.',
  },
  description: {
    en: 'Fischer random chess: one of 960 legal start positions each round, Chess960 castling, clocks, resignation and four computer levels.',
    es: 'Ajedrez aleatorio de Fischer: una de las 960 posiciones iniciales en cada ronda, enroque 960, relojes, rendición y cuatro niveles de CPU.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 4,
  sessionMinutes: 25,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['chess960', 'fischer random', 'freestyle chess', 'ajedrez aleatorio', 'variant'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Off the Map', es: 'Fuera del mapa' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Improviser', es: 'Improvisador' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Random Expert', es: 'Experto del azar' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'beat-expert',
      title: { en: 'No Theory Needed', es: 'Sin teoría' },
      description: { en: 'Beat Expert.', es: 'Vence al nivel Experto.' },
    },
    {
      id: 'castled-win',
      title: { en: 'Shuffled Castle', es: 'Enroque barajado' },
      description: {
        en: 'Castle and win against the computer.',
        es: 'Enroca y gana contra la CPU.',
      },
    },
    {
      id: 'classical',
      title: { en: 'Number 518', es: 'Número 518' },
      description: {
        en: 'Win from start position 518 — the classical setup (1 in 960).',
        es: 'Gana desde la posición 518, la disposición clásica (1 entre 960).',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Shuffle Night', es: 'Noche de barajar' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
