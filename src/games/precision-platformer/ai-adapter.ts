/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Hop, HopAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Hop>, HopAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Hop>, HopAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Searches the next seven moves of six steps (run, jump, wait or dash five ways), keeping the 40 best positions, for the way that shortens the open path to the door without dying.',
        es: 'Busca entre los siete siguientes movimientos de seis pasos (correr, saltar, esperar o hacer dash en cinco direcciones), con las 40 mejores posiciones, el camino que más acorta la ruta libre a la puerta sin morir.',
      },
    },
    hopper: {
      label: { en: 'Hopper', es: 'Saltarín' },
      description: {
        en: 'Runs at the door and jumps at spikes, gaps and walls just ahead; it never dashes or wall-jumps.',
        es: 'Corre hacia la puerta y salta ante pinchos, huecos y paredes; nunca hace dash ni rebota en las paredes.',
      },
    },
  }),
};
export default bundle;
