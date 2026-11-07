/** The AI environment: one scramble per episode (config `{ level }`), solved or out of turns. */
import type { AiBundle } from '../../ai/protocols/bundle';
import { createCubeEnv, cubeAgents } from '../shared/cube/ai';
import type { CubeState } from '../shared/cube/play';
import { SPECS, solve } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const SOLVER = {
  en: 'Iterative deepening with exact corner tables: always the fewest turns.',
  es: 'Profundización iterativa con tablas exactas de esquinas: siempre el mínimo de giros.',
};

export const cube2Env = createCubeEnv('twisty-cube-2x2', RULESET_ID, RULES_VERSION, SPECS);

export const bundle: AiBundle<CubeState, string> = {
  env: cube2Env as unknown as AiBundle<CubeState, string>['env'],
  agents: cubeAgents(solve, SOLVER),
  exactOracleId: 'solver',
};
export default bundle;
