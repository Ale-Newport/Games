import type { GameProps } from '../../core/game-engine/types';
import { ShutTable } from './ShutTable';

export function Game({ services }: GameProps) {
  return <ShutTable services={services} />;
}
