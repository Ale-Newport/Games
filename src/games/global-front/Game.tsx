import type { GameProps } from '../../core/game-engine/types';
import { FrontTable } from './FrontTable';

export function Game({ services }: GameProps) {
  return <FrontTable services={services} />;
}
