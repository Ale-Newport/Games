import type { GameProps } from '../../core/game-engine/types';
import { UrTable } from './UrTable';

export function Game({ services }: GameProps) {
  return <UrTable services={services} />;
}
