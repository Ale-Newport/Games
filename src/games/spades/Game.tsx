import type { GameProps } from '../../core/game-engine/types';
import { SpadesGame } from './SpadesGame';

export function Game({ services }: GameProps) {
  return <SpadesGame services={services} />;
}
