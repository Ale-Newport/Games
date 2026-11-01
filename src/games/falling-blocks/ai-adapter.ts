/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import type { Blocks } from '../shared/blocks/sim';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

/** A 30-minute limit ends runs that never top out. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Blocks>, string> = {
  env: env as unknown as AiBundle<ArcadeRun<Blocks>, string>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Scores every reachable placement with published board weights (height, lines, transitions, holes, wells) and keys the best one in.',
        es: 'Puntúa cada colocación alcanzable con pesos publicados (altura, líneas, transiciones, huecos, pozos) y teclea la mejor.',
      },
    },
    dropper: {
      label: { en: 'Dropper', es: 'Soltador' },
      description: {
        en: 'Drops each piece where it appears.',
        es: 'Suelta cada pieza donde aparece.',
      },
    },
  }),
};
export default bundle;
