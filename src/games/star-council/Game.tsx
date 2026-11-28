import type { GameProps } from '../../core/game-engine/types';
import { StarTable } from './StarTable';

export function Game({ services }: GameProps) {
  return <StarTable services={services} />;
}
