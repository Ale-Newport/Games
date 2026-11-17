import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'syllable-bomb',
  number: 217,
  title: { en: 'Syllable Bomb', es: 'Bomba de sílabas' },
  tagline: {
    en: 'Type a word with the letters on the bomb before it blows — the fuse never resets.',
    es: 'Escribe una palabra con las letras de la bomba antes de que estalle: la mecha nunca se reinicia.',
  },
  description: {
    en: 'The word bomb party game: a bomb with a hidden fuse passes round the table, and whoever holds it must type an unused dictionary word containing its prompt letters. Lose a life when it explodes, earn one back by using every bonus letter, outlast up to six bots with their own speed and vocabulary. 217,000 English words, four prompt difficulties.',
    es: 'El juego de la bomba de palabras: una bomba con mecha oculta pasa por la mesa y quien la tiene debe escribir una palabra del diccionario, sin repetir, que contenga sus letras. Pierdes una vida si estalla y recuperas una usando todas las letras extra; sobrevive a hasta seis bots con su propia velocidad y vocabulario. 217 000 palabras en inglés y cuatro dificultades.',
  },
  category: 'viral',
  genre: { en: 'Word / party', es: 'Palabras / fiesta' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 6,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Words', es: 'Palabras' } },
  tags: ['bombparty', 'bomb', 'words', 'typing', 'syllable', 'party'],
  achievements: [
    {
      id: 'survivor',
      title: { en: 'Last One Standing', es: 'El último en pie' },
      description: { en: 'Outlast every bot.', es: 'Sobrevive a todos los bots.' },
    },
    {
      id: 'big-room',
      title: { en: 'Packed Table', es: 'Mesa llena' },
      description: { en: 'Win against five or more bots.', es: 'Gana contra cinco o más bots.' },
    },
    {
      id: 'hard-win',
      title: { en: 'Defuser', es: 'Artificiero' },
      description: { en: 'Win with hard prompts.', es: 'Gana con sílabas difíciles.' },
    },
    {
      id: 'long-word',
      title: { en: 'Mouthful', es: 'Trabalenguas' },
      description: {
        en: 'Play a word of twelve letters or more.',
        es: 'Juega una palabra de doce letras o más.',
      },
    },
    {
      id: 'bonus-life',
      title: { en: 'Alphabet Soup', es: 'Sopa de letras' },
      description: {
        en: 'Use every bonus letter to win a life.',
        es: 'Usa todas las letras extra para ganar una vida.',
      },
    },
  ],
};
