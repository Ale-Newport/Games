import type { GameProps } from '../../core/game-engine/types';
import { EightsGame } from './EightsGame';

export function Game({ services }: GameProps) {
  return <EightsGame services={services} />;
}
