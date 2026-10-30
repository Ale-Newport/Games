import type { GameProps } from '../../core/game-engine/types';
import { KlotskiGame } from './KlotskiGame';

export function Game({ services }: GameProps) {
  return <KlotskiGame services={services} />;
}
