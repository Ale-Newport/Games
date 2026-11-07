/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import type { Snake, SnakeAction } from '../shared/snake/sim';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Snake>, SnakeAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Snake>, SnakeAction>['env'],
  agents: arcadeAgents(DEF, {
    pathfinder: {
      label: { en: 'Pathfinder', es: 'Buscacaminos' },
      description: {
        en: 'Takes the shortest path to the fruit when it could still reach its tail afterwards; otherwise follows its tail.',
        es: 'Va por el camino más corto a la fruta si después aún puede alcanzar su cola; si no, sigue su cola.',
      },
    },
    greedy: {
      label: { en: 'Greedy', es: 'Glotón' },
      description: {
        en: 'Heads straight for the apple, avoiding only the next cell’s dangers.',
        es: 'Va derecho a la manzana y solo evita peligros en la casilla siguiente.',
      },
    },
  }),
};
export default bundle;
