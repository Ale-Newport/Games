import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'category-letters',
  number: 203,
  title: { en: 'Category Letters', es: 'Letras y categorías' },
  tagline: {
    en: 'One letter, twelve categories, two minutes — and only original answers score.',
    es: 'Una letra, doce categorías, dos minutos, y solo puntúan las respuestas originales.',
  },
  description: {
    en: 'The classic category-list word game: roll the letter die, fill 6, 9 or 12 categories before the timer runs out, then compare lists — repeated answers cancel out, unknown ones go to a vote. Play against up to five bots, with up to four people sharing one device, over 1, 3 or 5 rounds, in English or Spanish, with an optional alliteration bonus.',
    es: 'El clásico juego de listas por categorías: tira el dado de letras, rellena 6, 9 o 12 categorías antes de que acabe el tiempo y compara listas: las respuestas repetidas se anulan y las desconocidas se votan. Juega contra hasta cinco bots, con hasta cuatro personas en un mismo dispositivo, a 1, 3 o 5 rondas, en inglés o español, con bonus opcional de aliteración.',
  },
  category: 'viral',
  genre: { en: 'Word / party', es: 'Palabras / fiesta' },
  players: { min: 1, max: 4 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: [
    'scattergories',
    'categories',
    'words',
    'party',
    'stop',
    'tutti frutti',
    'basta',
    'spanish',
  ],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Top of the List', es: 'Primero de la lista' },
      description: { en: 'Beat the bots in a game.', es: 'Gana a los bots en una partida.' },
    },
    {
      id: 'beat-sharp',
      title: { en: 'Sharper Still', es: 'Más listo aún' },
      description: { en: 'Beat sharp bots.', es: 'Gana a los bots listos.' },
    },
    {
      id: 'full-list',
      title: { en: 'Clean Sheet', es: 'Hoja perfecta' },
      description: {
        en: 'Score in all twelve categories of a round.',
        es: 'Puntúa en las doce categorías de una ronda.',
      },
    },
    {
      id: 'alliterator',
      title: { en: 'Alliterator', es: 'Aliterador' },
      description: {
        en: 'Score three points with one answer using the alliteration bonus.',
        es: 'Consigue tres puntos con una respuesta gracias a la aliteración.',
      },
    },
    {
      id: 'hard-letter',
      title: { en: 'Tough Letter', es: 'Letra dura' },
      description: {
        en: 'Score six answers on a hard letter (K, Q, X, Y, Z or Ñ).',
        es: 'Puntúa seis respuestas con una letra difícil (K, Q, X, Y, Z o Ñ).',
      },
    },
    {
      id: 'table',
      title: { en: 'Full Table', es: 'Mesa completa' },
      description: {
        en: 'Finish a game with two or more people on one device.',
        es: 'Termina una partida con dos o más personas en un dispositivo.',
      },
    },
  ],
};
