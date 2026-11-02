/** The AI environment: one run per episode, one action per 1/60 s step (see `../shared/arcade/environment.ts`). */
import type { AiBundle } from '../../ai/protocols/bundle';
import { arcadeAgents, arcadeEnv, type ArcadeRun } from '../shared/arcade/environment';
import { DEF } from './definition';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import type { Dig, DigAction } from './sim';

/** A 30-minute limit ends runs that never end. */
export const env = arcadeEnv(DEF, RULES_VERSION, RULESET_ID, 60 * 60 * 30);

export const bundle: AiBundle<ArcadeRun<Dig>, DigAction> = {
  env: env as unknown as AiBundle<ArcadeRun<Dig>, DigAction>['env'],
  agents: arcadeAgents(DEF, {
    miner: {
      label: { en: 'Miner', es: 'Minero' },
      description: {
        en: 'On every tick of the cave it tries every sequence of three moves, plays the cave forward to see that nothing falls on it or catches it, and takes the safe one that brings it nearest the next gem or the open exit.',
        es: 'En cada momento de la cueva prueba todas las secuencias de tres pasos, adelanta la cueva para ver que nada le cae encima ni le atrapa y elige la segura que más le acerca a la siguiente gema o a la salida abierta.',
      },
    },
    grabber: {
      label: { en: 'Grabber', es: 'Acaparador' },
      description: {
        en: 'Digs straight for the nearest gem, never checking what might fall or who is waiting.',
        es: 'Excava directo a la gema más cercana sin mirar qué puede caer ni quién espera.',
      },
    },
  }),
};
export default bundle;
