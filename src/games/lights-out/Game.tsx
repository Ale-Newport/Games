import type { GameProps } from '../../core/game-engine/types';
import { LightsGame } from './LightsGame';

export function Game({ services }: GameProps) {
  return <LightsGame services={services} />;
}
