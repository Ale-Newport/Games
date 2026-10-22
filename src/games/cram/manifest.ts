import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'cram',
  number: 48,
  title: { en: 'Cram', es: 'Cram' },
  tagline: {
    en: 'Dominoes any way you like — just make sure you place the last one.',
    es: 'Fichas en cualquier dirección: asegúrate de colocar la última.',
  },
  description: {
    en: 'On a 5×6 grid, both players place dominoes horizontally or vertically on two empty cells. Whoever cannot place a domino loses. A clever symmetry trick wins for the first player — can you find it? Three computer levels.',
    es: 'En una cuadrícula de 5×6, ambos jugadores colocan fichas en horizontal o vertical sobre dos casillas vacías. Pierde quien no puede colocar. Un truco de simetría da la victoria a quien empieza: ¿lo encontrarás? Tres niveles de CPU.',
  },
  category: 'strategy',
  genre: { en: 'Combinatorial game', es: 'Juego combinatorio' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 6,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['cram', 'dominoes', 'combinatorial', 'impartial'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Last Domino', es: 'Última ficha' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Room to Spare', es: 'Sitio de sobra' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Mirror Image', es: 'Imagen especular' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'second-wins',
      title: { en: 'Comeback', es: 'Remontada' },
      description: {
        en: 'Win a round in which the computer moved first.',
        es: 'Gana una ronda en la que empezó la CPU.',
      },
    },
    {
      id: 'quick-squeeze',
      title: { en: 'Quick Squeeze', es: 'Encierro rápido' },
      description: {
        en: 'Win against the computer with 11 dominoes or fewer on the board.',
        es: 'Gana a la CPU con 11 fichas o menos en el tablero.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
