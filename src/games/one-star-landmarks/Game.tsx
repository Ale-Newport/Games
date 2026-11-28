import type { GameProps } from '../../core/game-engine/types';
import { OneStarGame } from './OneStarGame';

export function Game(props: GameProps) {
  return <OneStarGame {...props} />;
}
