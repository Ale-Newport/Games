/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import type { BrickAction, Bricks } from '../shared/bricks/sim';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

/** A 30-minute limit ends runs that stall. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Bricks>, BrickAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Bricks>, BrickAction>['env'],
  agents: arcadeAgents(DEF, {
    planner: {
      label: { en: 'Planner', es: 'Planificador' },
      description: {
        en: 'Meets the falling ball off-centre to steer it at the bricks; catches capsules and fires the laser.',
        es: 'Recibe la pelota con el borde para dirigirla a los ladrillos; atrapa cápsulas y dispara el láser.',
      },
    },
    follower: {
      label: { en: 'Follower', es: 'Seguidor' },
      description: { en: 'Follows the lowest ball.', es: 'Sigue a la pelota más baja.' },
    },
  }),
};
export default bundle;
