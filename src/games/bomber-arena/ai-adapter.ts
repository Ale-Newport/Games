/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Arena, BlastAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Arena>, BlastAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Arena>, BlastAction>['env'],
  agents: arcadeAgents(DEF, {
    tactician: {
      label: { en: 'Tactician', es: 'Táctico' },
      description: {
        en: 'Flees any cell that will burn by a route that is not burning, drops a bomb by a crate or a rival in line only when it can still get to safety, and otherwise heads for power-ups, crates and rivals.',
        es: 'Huye de toda casilla que vaya a arder por un camino que no arde, pone una bomba junto a una caja o un rival en línea solo si aún puede ponerse a salvo, y si no va a por mejoras, cajas y rivales.',
      },
    },
    rookie: {
      label: { en: 'Rookie', es: 'Novato' },
      description: {
        en: 'Wanders and drops bombs at random, but still runs from flames.',
        es: 'Deambula y pone bombas al azar, aunque huye de las llamas.',
      },
    },
  }),
};
export default bundle;
