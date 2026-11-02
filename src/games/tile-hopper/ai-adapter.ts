/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { CubeAction, Cubes } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Cubes>, CubeAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Cubes>, CubeAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches the pyramid for the nearest unfinished cube by a path the balls and the spring cannot reach in time, lures the spring off with a disc when it is close, and grabs green balls.',
        es: 'Busca el cubo sin terminar más cercano por un camino al que no lleguen a tiempo las bolas ni el muelle, usa un disco para engañar al muelle cuando está cerca y coge las bolas verdes.',
      },
    },
    eager: {
      label: { en: 'Eager', es: 'Impaciente' },
      description: {
        en: 'Hops towards the nearest unfinished cube, paying no attention to anything else.',
        es: 'Salta hacia el cubo sin terminar más cercano sin prestar atención a nada más.',
      },
    },
  }),
};
export default bundle;
