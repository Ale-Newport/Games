import type { GameProps } from '../../core/game-engine/types';
import { SlitherGame } from './SlitherGame';

export function Game({ services }: GameProps) {
  return <SlitherGame services={services} />;
}
