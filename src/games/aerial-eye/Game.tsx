import type { GameProps } from '../../core/game-engine/types';
import { AerialGame } from './AerialGame';

export function Game(props: GameProps) {
  return <AerialGame {...props} />;
}
