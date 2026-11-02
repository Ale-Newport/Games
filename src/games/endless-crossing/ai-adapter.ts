/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import type { CrossAction, Crossing } from '../shared/crossing/sim';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Crossing>, CrossAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Crossing>, CrossAction>['env'],
  agents: arcadeAgents(DEF, {
    lookahead: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches the next six hops or waits (keeping the 40 most promising positions at each depth) for the way that gains the most ground safely.',
        es: 'Busca entre los seis siguientes saltos o esperas (con las 40 posiciones más prometedoras en cada nivel) el camino que más avanza sin riesgo.',
      },
    },
    hopper: {
      label: { en: 'Hopper', es: 'Saltarín' },
      description: {
        en: 'Hops forward when it would survive the landing for a moment; otherwise waits or sidesteps.',
        es: 'Salta hacia delante si sobreviviría un momento al aterrizar; si no, espera o se aparta.',
      },
    },
  }),
};
export default bundle;
