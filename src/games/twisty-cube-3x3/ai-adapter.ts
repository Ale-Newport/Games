/** The AI environment: one scramble per episode (config `{ level }`), solved or out of turns. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createCubeEnv, cubeAgents } from '../shared/cube/ai';
import type { CubeState } from '../shared/cube/play';
import { SPECS, solve } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const SOLVER = {
  en: 'Two-phase search (Kociemba): solutions of about 21 turns in a few hundredths of a second, and about as short as the scramble for light ones.',
  es: 'Búsqueda en dos fases (Kociemba): soluciones de unos 21 giros en unas centésimas de segundo, y casi tan cortas como la mezcla en las ligeras.',
};

export const cube3Env = createCubeEnv('twisty-cube-3x3', RULESET_ID, RULES_VERSION, SPECS);

export const bundle: AiBundle<CubeState, string> = {
  env: cube3Env as unknown as AiBundle<CubeState, string>['env'],
  agents: cubeAgents(solve, SOLVER),
};
export default bundle;
