import type { GameProps } from '../../core/game-engine/types';
import { PlotGame } from './PlotGame';

export function Game(props: GameProps) {
  return <PlotGame {...props} />;
}
