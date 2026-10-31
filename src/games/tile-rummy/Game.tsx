import type { GameProps } from '../../core/game-engine/types';
import { RummyTable } from './RummyTable';

export function Game({ services }: GameProps) {
  return <RummyTable services={services} />;
}
