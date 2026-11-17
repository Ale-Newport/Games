import type { GameProps } from '../../core/game-engine/types';
import { CraftGame } from './CraftGame';

export function Game(props: GameProps) {
  return <CraftGame {...props} />;
}
