/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { SWARM } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Swarm, SwarmAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(SWARM, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Swarm>, SwarmAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Swarm>, SwarmAction>['env'],
  agents: arcadeAgents(SWARM, {
    pilot: {
      label: { en: 'Pilot', es: 'Piloto' },
      description: {
        en: 'Dodges bullets and divers, hunts divers first and fires when lined up.',
        es: 'Esquiva balas y picados, caza primero a los que bajan y dispara cuando está alineado.',
      },
    },
    sweeper: {
      label: { en: 'Sweeper', es: 'Barrendero' },
      description: {
        en: 'Sweeps side to side, firing constantly.',
        es: 'Barre de lado a lado disparando sin parar.',
      },
    },
  }),
};
export default bundle;
