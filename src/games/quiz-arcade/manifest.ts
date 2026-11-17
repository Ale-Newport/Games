import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'quiz-arcade',
  number: 204,
  title: { en: 'Quiz Arcade', es: 'Salón de tests' },
  tagline: {
    en: 'Beat the clock on 18 trivia quizzes: type-ins, hint tables, clickables and picture slideshows.',
    es: 'Gana al reloj en 18 tests de trivia: escribir, tablas con pistas, clic y diapositivas.',
  },
  description: {
    en: 'A trivia quiz site in a cabinet: name all 118 elements from their symbols, every World Cup winner, the Olympian gods, painters by painting and more; click planets and symbols; pick the mammals or the primes; read Roman numerals and name polygons. Answers are accepted the moment you type them, in English or Spanish, with personal bests, a quiz of the day and an AI to watch.',
    es: 'Una web de tests en una recreativa: nombra los 118 elementos por su símbolo, todos los campeones del Mundial, los dioses olímpicos, pintores por cuadro y más; haz clic en planetas y símbolos; elige los mamíferos o los primos; lee números romanos y nombra polígonos. Las respuestas se aceptan nada más escribirlas, en inglés o español, con récords personales, test del día y una IA para mirar.',
  },
  category: 'viral',
  genre: { en: 'Trivia', es: 'Trivia' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Best %', es: 'Mejor %' } },
  tags: ['sporcle', 'quiz', 'trivia', 'elements', 'type-in', 'clickable', 'spanish'],
  achievements: [
    {
      id: 'first-quiz',
      title: { en: 'Contestant', es: 'Concursante' },
      description: { en: 'Finish a quiz.', es: 'Termina un test.' },
    },
    {
      id: 'perfect',
      title: { en: 'Perfect Score', es: 'Puntuación perfecta' },
      description: { en: 'Get 100% on a quiz.', es: 'Saca un 100 % en un test.' },
    },
    {
      id: 'speedy',
      title: { en: 'Quick Draw', es: 'Rápido' },
      description: {
        en: 'Get 100% with half the time left.',
        es: 'Saca un 100 % con la mitad del tiempo.',
      },
    },
    {
      id: 'half-table',
      title: { en: 'Half the Table', es: 'Media tabla' },
      description: { en: 'Name 59 elements in one try.', es: 'Nombra 59 elementos en un intento.' },
    },
    {
      id: 'full-table',
      title: { en: 'Periodic Master', es: 'Maestro periódico' },
      description: { en: 'Name all 118 elements.', es: 'Nombra los 118 elementos.' },
    },
    {
      id: 'explorer',
      title: { en: 'Quiz Explorer', es: 'Explorador de tests' },
      description: { en: 'Finish ten different quizzes.', es: 'Termina diez tests distintos.' },
    },
    {
      id: 'completionist',
      title: { en: 'Completionist', es: 'Completista' },
      description: { en: 'Get 100% on every quiz.', es: 'Saca un 100 % en todos los tests.' },
    },
  ],
};
