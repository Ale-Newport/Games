import type { GameProps } from '../../core/game-engine/types';
import { PigTable } from './PigTable';

export function Game({ services }: GameProps) {
  return <PigTable services={services} />;
}
