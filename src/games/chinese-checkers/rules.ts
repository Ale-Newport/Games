/** Chinese Checkers on the 121-hole star, two players with ten marbles in opposite points. */
import { starGeometry, type JumpRaceVariant } from '../shared/jump-race/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';

export const VARIANT: JumpRaceVariant = {
  id: 'chinese-checkers',
  shape: 'star',
  geometry: starGeometry(),
  plyLimit: 400,
};
