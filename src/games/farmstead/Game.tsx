import type { GameProps } from '../../core/game-engine/types';
import { FarmTable } from './FarmTable';

export function Game({ services }: GameProps) {
  return <FarmTable services={services} />;
}
