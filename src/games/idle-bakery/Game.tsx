import type { GameProps } from '../../core/game-engine/types';
import { BakeryGame } from './BakeryGame';

export function Game(props: GameProps) {
  return <BakeryGame {...props} />;
}
