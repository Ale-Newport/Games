import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'narde',
  number: 142,
  title: { en: 'Narde', es: 'Narde' },
  tagline: {
    en: 'Long narde: race the same way round, block with single checkers, and never close six points in a row.',
    es: 'Narde largo: corre en el mismo sentido, bloquea con fichas sueltas y nunca cierres seis puntos seguidos.',
  },
  description: {
    en: 'The long variant of the old Persian race game, played across the Caucasus and Central Asia. Both sides start with all fifteen checkers on their head and travel the same way round; a single checker holds a point, only one checker leaves the head each turn, and six closed points in a row are allowed only if an opponent is already past them. Matches to 1, 3 or 5 points with oin and mars, against a greedy or an expectimax computer or a friend on the same device.',
    es: 'La variante larga del antiguo juego de carrera persa, que se juega en el Cáucaso y Asia Central. Los dos bandos empiezan con sus quince fichas en la cabeza y van en el mismo sentido; una ficha sola ocupa un punto, solo sale una ficha de la cabeza por turno y seis puntos cerrados seguidos solo se permiten si el rival ya está más allá. Encuentros a 1, 3 o 5 puntos con oin y mars, contra un ordenador voraz o expectimax o contra alguien en el mismo dispositivo.',
  },
  category: 'dice',
  genre: { en: 'Race game', es: 'Juego de carrera' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 3,
  sessionMinutes: 15,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Match margin', es: 'Margen del encuentro' } },
  tags: ['dice', 'race', 'traditional', 'two-player', 'vs-ai'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Home and Away', es: 'Ida y vuelta' },
      description: {
        en: 'Win a match against the computer.',
        es: 'Gana un encuentro contra el ordenador.',
      },
    },
    {
      id: 'mars',
      title: { en: 'Mars!', es: '¡Mars!' },
      description: {
        en: 'Win a game by mars against the computer.',
        es: 'Gana una partida con mars contra el ordenador.',
      },
    },
    {
      id: 'hard',
      title: { en: 'Master of the Long Road', es: 'Maestro del camino largo' },
      description: {
        en: 'Win a match against the hard computer.',
        es: 'Gana un encuentro contra el ordenador difícil.',
      },
    },
    {
      id: 'long',
      title: { en: 'Five-Point Match', es: 'Encuentro a cinco' },
      description: {
        en: 'Win a 5-point match against the computer.',
        es: 'Gana un encuentro a 5 puntos contra el ordenador.',
      },
    },
  ],
};
