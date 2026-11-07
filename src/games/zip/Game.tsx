import type { GameProps } from '../../core/game-engine/types';
import { TrailGame } from './TrailGame';

export function Game({ services }: GameProps) {
  return <TrailGame services={services} />;
}
