import type { GameProps } from '../../core/game-engine/types';
import { NumberLineGame } from './NumberLineGame';

export function Game(props: GameProps) {
  return <NumberLineGame {...props} />;
}
