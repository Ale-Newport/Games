import type { GameProps } from '../../core/game-engine/types';
import { foundCount, total, type Quiz, type QuizState } from '../shared/quiz/engine';
import { QuizGame, type QuizGameDef } from '../shared/quiz/QuizGame';
import { QUIZZES } from './quizzes';

export function worldAchievements(
  q: Quiz,
  s: QuizState,
  unlock: (id: string) => void,
  bests: Record<string, number>,
) {
  unlock('first-quiz');
  if (s.status === 'won') unlock('perfect');
  if (q.id === 'countries-world' && foundCount(q, s) >= 100) unlock('hundred');
  if (q.id === 'countries-world' && foundCount(q, s) === total(q)) unlock('whole-world');
  if (q.id === 'flags-world' && foundCount(q, s) === total(q)) unlock('flag-master');
  if (q.format === 'map-click' && s.status === 'won' && s.wrong === 0) unlock('sharp-shooter');
  const continents = ['eu', 'as', 'af', 'na', 'sa', 'oc'].every(
    (c) => bests[`countries-${c}`] === 100,
  );
  if (continents) unlock('six-continents');
}

export const WORLD: QuizGameDef = {
  quizzes: QUIZZES,
  strings: {
    en: {
      title: 'World Quiz',
      'menu.subtitle':
        'Geography quizzes against the clock: type every country onto the map, click them by name, and name capitals and flags.',
    },
    es: {
      title: 'Test del mundo',
      'menu.subtitle':
        'Tests de geografía contrarreloj: escribe todos los países sobre el mapa, haz clic en ellos por su nombre y nombra capitales y banderas.',
    },
  },
  categories: {
    countries: { en: 'Countries on the map', es: 'Países en el mapa' },
    map: { en: 'Click the map', es: 'Clic en el mapa' },
    capitals: { en: 'Capitals', es: 'Capitales' },
    flags: { en: 'Flags', es: 'Banderas' },
    rankings: { en: 'Rankings', es: 'Clasificaciones' },
  },
  onFinish: worldAchievements,
};

export function Game({ services }: GameProps) {
  return <QuizGame def={WORLD} services={services} />;
}
