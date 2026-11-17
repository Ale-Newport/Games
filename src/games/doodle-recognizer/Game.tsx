import type { GameProps } from '../../core/game-engine/types';
import { DoodleGame } from './DoodleGame';

export function Game(props: GameProps) {
  return <DoodleGame {...props} />;
}
