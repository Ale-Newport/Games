/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Raid, RaidAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Raid>, RaidAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Raid>, RaidAction>['env'],
  agents: arcadeAgents(DEF, {
    pilot: {
      label: { en: 'Pilot', es: 'Piloto' },
      description: {
        en: 'Steers for the middle of the water ahead without ever crossing an island, heads for depots when fuel runs low, fires at enemies and bridges in its line (sparing depots while it needs fuel), sidesteps close enemies and slows on sharp bends.',
        es: 'Se dirige al centro del agua que tiene delante sin cruzar nunca una isla, va a por depósitos cuando le falta combustible, dispara a enemigos y puentes en su línea (sin tocar los depósitos mientras los necesita), esquiva enemigos cercanos y frena en las curvas cerradas.',
      },
    },
    cruiser: {
      label: { en: 'Cruiser', es: 'Crucero' },
      description: {
        en: 'Follows the middle of the river and never fires.',
        es: 'Sigue el centro del río y nunca dispara.',
      },
    },
  }),
};
export default bundle;
