import type { GameProps } from '../../core/game-engine/types';
import { ClosestCallGame } from './ClosestCallGame';

export function Game(props: GameProps) {
  return <ClosestCallGame {...props} />;
}
