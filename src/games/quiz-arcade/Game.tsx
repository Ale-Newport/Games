import type { GameProps } from '../../core/game-engine/types';
import { foundCount, total, type Quiz, type QuizState } from '../shared/quiz/engine';
import { QuizGame, type QuizGameDef } from '../shared/quiz/QuizGame';
import { QUIZZES } from './quizzes';

export function arcadeAchievements(
  q: Quiz,
  s: QuizState,
  unlock: (id: string) => void,
  bests: Record<string, number>,
) {
  unlock('first-quiz');
  if (s.status === 'won') {
    unlock('perfect');
    if (s.elapsedMs <= (q.seconds * 1000) / 2) unlock('speedy');
  }
  if (q.id === 'elements' && foundCount(q, s) >= 59) unlock('half-table');
  if (q.id === 'elements' && foundCount(q, s) === total(q)) unlock('full-table');
  if (Object.keys(bests).length >= 10) unlock('explorer');
  if (QUIZZES.every((x) => (bests[x.id] ?? 0) === 100)) unlock('completionist');
}

export const ARCADE: QuizGameDef = {
  quizzes: QUIZZES,
  strings: {
    en: {
      title: 'Quiz Arcade',
      'menu.subtitle':
        'Timed trivia quizzes in every format: type every answer you know, fill hint tables, click the right tiles, pick them all, or name the slides.',
    },
    es: {
      title: 'Salón de tests',
      'menu.subtitle':
        'Tests de trivia contrarreloj en todos los formatos: escribe todas las respuestas que sepas, completa tablas con pistas, haz clic en las casillas correctas, elígelas todas o nombra las diapositivas.',
    },
  },
  categories: {
    science: { en: 'Science', es: 'Ciencia' },
    geography: { en: 'Geography', es: 'Geografía' },
    history: { en: 'History', es: 'Historia' },
    culture: { en: 'Arts & culture', es: 'Arte y cultura' },
    sport: { en: 'Sport', es: 'Deporte' },
    maths: { en: 'Numbers', es: 'Números' },
    nature: { en: 'Nature', es: 'Naturaleza' },
  },
  onFinish: arcadeAchievements,
};

export function Game({ services }: GameProps) {
  return <QuizGame def={ARCADE} services={services} />;
}
