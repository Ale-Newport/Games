/** Halma on the classic 16 × 16 board, two players with 19 pieces in opposite corner camps. */
import { squareGeometry, type JumpRaceVariant } from '../shared/jump-race/engine';

export { RULES_VERSION, RULESET_ID } from './rules-meta';

export const VARIANT: JumpRaceVariant = {
  id: 'halma',
  shape: 'square',
  geometry: squareGeometry(16, 5),
  plyLimit: 600,
};
