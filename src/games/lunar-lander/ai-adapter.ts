/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Lander, LanderAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Lander>, LanderAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Lander>, LanderAction>['env'],
  agents: arcadeAgents(DEF, {
    pilot: {
      label: { en: 'Pilot', es: 'Piloto' },
      description: {
        en: 'Picks the best pad within reach, steers its drift towards it by tilting, keeps its fall to a rate that shrinks with height and stands upright for the last few metres.',
        es: 'Elige la mejor plataforma a su alcance, dirige la deriva inclinándose, mantiene una caída cada vez más lenta al acercarse y se endereza en los últimos metros.',
      },
    },
    braker: {
      label: { en: 'Braker', es: 'Frenador' },
      description: {
        en: 'Stays upright and only brakes its fall, landing wherever it comes down.',
        es: 'Se mantiene recto y solo frena la caída, aterrizando donde caiga.',
      },
    },
  }),
};
export default bundle;
