import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'fox-and-geese',
  number: 57,
  title: { en: 'Fox and Geese', es: 'El zorro y los gansos' },
  tagline: {
    en: 'A medieval hunt on a cross-shaped board: corner the fox, or eat the geese.',
    es: 'Una caza medieval en un tablero en cruz: acorrala al zorro o cómete a los gansos.',
  },
  description: {
    en: 'Thirteen geese, who may never step back, try to pen in a lone fox on a 33-point cross. The fox jumps geese to capture them, several in a row if he can; eight captures win for him. Play either side.',
    es: 'Trece gansos, que nunca pueden retroceder, intentan encerrar a un zorro solitario en una cruz de 33 puntos. El zorro salta sobre los gansos para capturarlos, varios seguidos si puede; con ocho capturas gana. Juega con cualquier bando.',
  },
  category: 'strategy',
  genre: { en: 'Hunt game', es: 'Juego de caza' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['fox and geese', 'hunt', 'medieval', 'asymmetric'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Penned In', es: 'Encerrado' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Flock Leader', es: 'Líder de la bandada' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Master of the Hunt', es: 'Maestro de la caza' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'prey-win',
      title: { en: 'Clever Geese', es: 'Gansos listos' },
      description: {
        en: 'Win against the computer as the geese.',
        es: 'Gana a la CPU con los gansos.',
      },
    },
    {
      id: 'hunter-win',
      title: { en: 'Sly Fox', es: 'Zorro astuto' },
      description: {
        en: 'Win against the computer as the fox.',
        es: 'Gana a la CPU con el zorro.',
      },
    },
    {
      id: 'no-losses',
      title: { en: 'Not a Feather Lost', es: 'Ni una pluma' },
      description: {
        en: 'Win as the geese without losing a goose.',
        es: 'Gana con los gansos sin perder ninguno.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
