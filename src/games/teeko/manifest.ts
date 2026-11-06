import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'teeko',
  number: 36,
  title: { en: 'Teeko', es: 'Teeko' },
  tagline: {
    en: 'Four markers, a 5×5 board: line or square wins.',
    es: 'Cuatro fichas en un 5×5: gana la línea o el cuadrado.',
  },
  description: {
    en: 'Drop four markers each, then slide them one step in any direction: four in a row or a 2×2 square wins. Three computer levels; with perfect play the game is a draw.',
    es: 'Coloca cuatro fichas por jugador y luego deslízalas un paso en cualquier dirección: cuatro en línea o un cuadrado de 2×2 gana. Tres niveles de CPU; con juego perfecto es tablas.',
  },
  category: 'board',
  genre: { en: 'Abstract strategy', es: 'Estrategia abstracta' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['teeko', 'four in a row', 'square', 'abstract'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'First Square', es: 'Primer cuadrado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Marker Mover', es: 'Mueveficas' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Teeko Master', es: 'Maestro de Teeko' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'drop-win',
      title: { en: 'Won on the Drop', es: 'Victoria al colocar' },
      description: {
        en: 'Win during the drop phase.',
        es: 'Gana durante la fase de colocación.',
      },
    },
    {
      id: 'hold-hard',
      title: { en: 'Perfect Defense', es: 'Defensa perfecta' },
      description: { en: 'Draw against Hard.', es: 'Empata contra el nivel Difícil.' },
    },
    {
      id: 'hot-seat',
      title: { en: 'Parlor Game', es: 'Juego de salón' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
