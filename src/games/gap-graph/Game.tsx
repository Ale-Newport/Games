import type { GameProps } from '../../core/game-engine/types';
import { GapGraphGame } from './GapGraphGame';

export function Game(props: GameProps) {
  return <GapGraphGame {...props} />;
}
