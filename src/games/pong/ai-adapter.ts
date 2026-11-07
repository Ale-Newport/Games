/** The AI environment: one game per episode (config `{ options: { level, length } }`), one action per 1/60 s step. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { PONG } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Pong, PongAction } from './sim';

/** Long enough for any real game; it stops runs between two paddles that never miss. */
export const env = arcadeEnv(PONG, RULES_VERSION, RULESET_ID, 60 * 60 * 20);

export const bundle: AiBundle<ArcadeRun<Pong>, PongAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Pong>, PongAction>['env'],
  agents: arcadeAgents(PONG, {
    tracker: {
      label: { en: 'Tracker', es: 'Rastreador' },
      description: {
        en: 'Meets the ball where it will cross and strikes it off-centre for an angle.',
        es: 'Espera la pelota donde cruzará y la golpea con el borde para darle ángulo.',
      },
    },
    follower: {
      label: { en: 'Follower', es: 'Seguidor' },
      description: {
        en: 'Follows the ball’s current height.',
        es: 'Sigue la altura actual de la pelota.',
      },
    },
  }),
};
export default bundle;
