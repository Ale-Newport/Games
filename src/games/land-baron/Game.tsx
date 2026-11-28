import type { GameProps } from '../../core/game-engine/types';
import { BaronTable } from './BaronTable';

export function Game({ services }: GameProps) {
  return <BaronTable services={services} />;
}
