import type { GameProps } from '../../core/game-engine/types';
import { HashiGame } from './HashiGame';

export function Game({ services }: GameProps) {
  return <HashiGame services={services} />;
}
