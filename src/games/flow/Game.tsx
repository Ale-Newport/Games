import type { GameProps } from '../../core/game-engine/types';
import { LinkGame } from './LinkGame';

export function Game({ services }: GameProps) {
  return <LinkGame services={services} />;
}
