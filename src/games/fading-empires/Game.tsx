import type { GameProps } from '../../core/game-engine/types';
import { FadingTable } from './FadingTable';

export function Game({ services }: GameProps) {
  return <FadingTable services={services} />;
}
