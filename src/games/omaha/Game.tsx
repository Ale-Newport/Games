import type { GameProps } from '../../core/game-engine/types';
import { PokerTable } from '../shared/poker/PokerTable';
import { VARIANT } from './rules';

export function Game({ services }: GameProps) {
  return <PokerTable variant={VARIANT} services={services} />;
}
