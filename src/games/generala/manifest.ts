import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'generala',
  number: 150,
  title: { en: 'Generala', es: 'Generala' },
  tagline: {
    en: 'Three rolls, eleven boxes, served hands worth more — and a served generala wins on the spot.',
    es: 'Tres tiradas, once casillas, las servidas valen más y una generala servida gana en el acto.',
  },
  description: {
    en: 'The scorecard dice game played across Argentina, Uruguay and beyond: five dice, three rolls a turn, the six numbers, straight, full house, four of a kind, generala and double generala, with 5 extra points for hands served on the first roll and an instant win for a served generala. Play solo, against computer players that plan each turn exactly, or with friends on one device.',
    es: 'El juego de dados con hoja que se juega en Argentina, Uruguay y más allá: cinco dados, tres tiradas por turno, los seis números, escalera, full, póker, generala y doble generala, con 5 puntos más por las jugadas servidas y victoria inmediata con una generala servida. Juega solo, contra rivales que planifican cada turno con exactitud o con amigos en un dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Dice game', es: 'Juego de dados' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['dice', 'scorecard', 'traditional', 'solo', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Card Filled', es: 'Planilla llena' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'served',
      title: { en: 'Served!', es: '¡Servida!' },
      description: {
        en: 'Win at once with a served generala.',
        es: 'Gana al instante con una generala servida.',
      },
    },
    {
      id: 'score250',
      title: { en: 'Big Card', es: 'Gran planilla' },
      description: { en: 'Score 250 points or more.', es: 'Consigue 250 puntos o más.' },
    },
    {
      id: 'beat',
      title: { en: 'Beat the Planner', es: 'Vence al planificador' },
      description: {
        en: 'Win a game against the computer.',
        es: 'Gana una partida contra el ordenador.',
      },
    },
  ],
};
