import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'mind-reader',
  number: 226,
  title: { en: 'Mind Reader', es: 'Lector de mentes' },
  tagline: {
    en: 'Think of an animal, an object or a legendary character — the seer will guess it.',
    es: 'Piensa en un animal, un objeto o un personaje legendario: el adivino lo descubrirá.',
  },
  description: {
    en: 'A crystal-ball seer asks yes/no questions (with “don’t know” and “probably”) and guesses what you are thinking of. Behind it, a Bayesian reasoner picks the most informative question each time and learns from the games it loses. Three worlds: animals, everyday objects and characters from myth, folk tales and classic books.',
    es: 'Un adivino con bola de cristal hace preguntas de sí o no (con «no lo sé» y «probablemente») y adivina en qué piensas. Detrás hay un razonador bayesiano que elige cada vez la pregunta más informativa y aprende de las partidas que pierde. Tres mundos: animales, objetos cotidianos y personajes de mitos, cuentos y libros clásicos.',
  },
  category: 'viral',
  genre: { en: 'Guessing', es: 'Adivinanzas' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 1,
  sessionMinutes: 4,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Questions asked', es: 'Preguntas hechas' } },
  tags: ['guessing', 'ai', 'twenty-questions', 'learning'],
  achievements: [
    {
      id: 'stumped',
      title: { en: 'Unreadable', es: 'Indescifrable' },
      description: { en: 'Beat the mind reader.', es: 'Gana al lector de mentes.' },
    },
    {
      id: 'open-book',
      title: { en: 'Open Book', es: 'Libro abierto' },
      description: {
        en: 'Get read in 10 questions or fewer.',
        es: 'Deja que te lea en 10 preguntas o menos.',
      },
    },
    {
      id: 'teacher',
      title: { en: 'Teacher', es: 'Maestro' },
      description: {
        en: 'Teach the mind reader five times.',
        es: 'Enseña al lector de mentes cinco veces.',
      },
    },
  ],
};
