import type { GameProps } from '../../core/game-engine/types';
import { PriceGame } from './PriceGame';

export function Game(props: GameProps) {
  return <PriceGame {...props} />;
}
