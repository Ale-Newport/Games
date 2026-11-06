import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'domineering',
  number: 47,
  title: { en: 'Domineering', es: 'Domineering' },
  tagline: {
    en: 'Vertical against horizontal: squeeze your rival off the board.',
    es: 'Vertical contra horizontal: deja sin sitio a tu rival.',
  },
  description: {
    en: 'On an 8×8 grid, one player places dominoes vertically and the other horizontally. Each domino covers two empty cells. Whoever cannot place a domino on their turn loses. Three computer levels with a mobility-reading search.',
    es: 'En una cuadrícula de 8×8, un jugador coloca fichas en vertical y el otro en horizontal. Cada ficha cubre dos casillas vacías. Pierde quien no puede colocar en su turno. Tres niveles de CPU con una búsqueda que lee la movilidad.',
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
  tags: ['domineering', 'dominoes', 'combinatorial', 'partizan'],
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
      title: { en: 'Domineering', es: 'Dominante' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'horizontal-win',
      title: { en: 'Side to Side', es: 'De lado a lado' },
      description: {
        en: 'Win against the computer as the horizontal player.',
        es: 'Gana a la CPU como jugador horizontal.',
      },
    },
    {
      id: 'shutout',
      title: { en: 'Shutout', es: 'Cerrojazo' },
      description: {
        en: 'Win against the computer with 20 dominoes or fewer on the board.',
        es: 'Gana a la CPU con 20 fichas o menos en el tablero.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
