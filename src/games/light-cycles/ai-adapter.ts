/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { TrailAction, Trails } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Trails>, TrailAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Trails>, TrailAction>['env'],
  agents: arcadeAgents(DEF, {
    strategist: {
      label: { en: 'Strategist', es: 'Estratega' },
      description: {
        en: 'Weighs every turn by the room it would leave and, among roomy turns, by the cells it would reach before any rival; it keeps off cells a rival could also enter next.',
        es: 'Valora cada giro por el espacio que le dejaría y, entre los amplios, por las casillas a las que llegaría antes que ningún rival; evita las casillas a las que un rival también podría entrar.',
      },
    },
    cruiser: {
      label: { en: 'Cruiser', es: 'Crucero' },
      description: {
        en: 'Keeps straight until the way ahead is blocked, then turns to the roomier side.',
        es: 'Sigue recto hasta que se le bloquea el paso y entonces gira hacia el lado con más espacio.',
      },
    },
  }),
};
export default bundle;
