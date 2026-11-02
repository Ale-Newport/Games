/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { PlatAction, Trail } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Trail>, PlatAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Trail>, PlatAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches the next six moves of eight steps (run, jump, wait or back off), keeping the 24 most promising, for the way furthest along the level that stays alive.',
        es: 'Busca entre los seis siguientes movimientos de ocho pasos (correr, saltar, esperar o retroceder), con los 24 más prometedores, el camino que más avanza sin morir.',
      },
    },
    runner: {
      label: { en: 'Runner', es: 'Corredor' },
      description: {
        en: 'Holds right and jumps at walls, gaps and beetles just ahead.',
        es: 'Mantiene la derecha y salta ante paredes, huecos y escarabajos cercanos.',
      },
    },
  }),
};
export default bundle;
