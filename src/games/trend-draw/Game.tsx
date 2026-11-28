import type { GameProps } from '../../core/game-engine/types';
import { TrendDrawGame } from './TrendDrawGame';

export function Game(props: GameProps) {
  return <TrendDrawGame {...props} />;
}
