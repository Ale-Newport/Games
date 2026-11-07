import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'light-cycles',
  number: 190,
  title: { en: 'Neon Trails', es: 'Estelas de neón' },
  tagline: {
    en: 'Race on a grid leaving a wall of light — and box your rivals in.',
    es: 'Corre por una cuadrícula dejando un muro de luz y encierra a tus rivales.',
  },
  description: {
    en: 'A trail-racing game with an original name and look: you and one or three computer racers speed across a grid, each leaving a glowing wall behind. Run into any wall, trail or the edge and you are out; the last racer moving wins the round, and the first to three rounds takes the match. Arrows, the touch pad or point where to turn; the computer racers weigh the room each turn leaves them.',
    es: 'Un juego de carreras de estelas con nombre y aspecto originales: tú y uno o tres corredores del ordenador cruzáis una cuadrícula dejando cada uno un muro de luz detrás. Si chocas con un muro, una estela o el borde, quedas fuera; el último que sigue corriendo gana la ronda, y quien gane tres rondas se lleva la partida. Flechas, el panel táctil o señala hacia dónde girar; los rivales del ordenador valoran el espacio que les deja cada giro.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'versus', 'trails'],
  achievements: [
    {
      id: 'round',
      title: { en: 'Still Moving', es: 'Sigo en marcha' },
      description: { en: 'Win a round.', es: 'Gana una ronda.' },
    },
    {
      id: 'match',
      title: { en: 'Grid Champion', es: 'Campeón de la cuadrícula' },
      description: { en: 'Win a match.', es: 'Gana una partida.' },
    },
    {
      id: 'crowd',
      title: { en: 'Crowded Grid', es: 'Cuadrícula llena' },
      description: {
        en: 'Win a match against three rivals.',
        es: 'Gana una partida contra tres rivales.',
      },
    },
    {
      id: 'perfect',
      title: { en: 'Untouchable', es: 'Intocable' },
      description: {
        en: 'Win a match without losing a round.',
        es: 'Gana una partida sin perder una ronda.',
      },
    },
  ],
};
