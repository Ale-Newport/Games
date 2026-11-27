import type { GameProps } from '../../core/game-engine/types';
import { GraphForecastGame } from './GraphForecastGame';

export function Game(props: GameProps) {
  return <GraphForecastGame {...props} />;
}
