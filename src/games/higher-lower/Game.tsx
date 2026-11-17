import type { GameProps } from '../../core/game-engine/types';
import { HigherLowerGame } from './HigherLowerGame';

export function Game(props: GameProps) {
  return <HigherLowerGame {...props} />;
}
