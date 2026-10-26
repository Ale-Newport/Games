import type { GameProps } from '../../core/game-engine/types';
import { BridgeGame } from './BridgeGame';

export function Game({ services }: GameProps) {
  return <BridgeGame services={services} />;
}
