import type { GameProps } from '../../core/game-engine/types';
import { SummitTable } from './SummitTable';

export function Game({ services }: GameProps) {
  return <SummitTable services={services} />;
}
