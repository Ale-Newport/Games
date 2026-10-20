/** King of the Hill on the shared chess engine. */
export { RULES_VERSION, RULESET_ID } from './rules-meta';
import { KING_OF_THE_HILL } from '../shared/chess/variants';

export const VARIANT = KING_OF_THE_HILL;
export const HILL = ['d4', 'e4', 'd5', 'e5'] as const;
