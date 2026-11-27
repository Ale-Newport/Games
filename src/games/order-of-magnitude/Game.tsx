import type { GameProps } from '../../core/game-engine/types';
import { OrderOfMagnitudeGame } from './OrderOfMagnitudeGame';

export function Game(props: GameProps) {
  return <OrderOfMagnitudeGame {...props} />;
}
