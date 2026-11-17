/** The AI environment: one match per episode (config `{ options: { size, level, length } }`), one action per 1/60 s step for the red star player; every other disc is a bot. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { SOCCER } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Soccer, SoccerAction } from './sim';

/** Regulation plus a long golden-goal overtime. */
export const env = arcadeEnv(SOCCER, RULES_VERSION, RULESET_ID, 60 * 60 * 12);

export const bundle: AiBundle<ArcadeRun<Soccer>, SoccerAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Soccer>, SoccerAction>['env'],
  agents: arcadeAgents(SOCCER, {
    striker: {
      label: { en: 'Striker', es: 'Delantero' },
      description: {
        en: 'Gets behind the ball on the line to the goal and kicks when it is lined up.',
        es: 'Se coloca detrás del balón en línea con la portería y chuta cuando está alineado.',
      },
    },
  }),
};
export default bundle;
