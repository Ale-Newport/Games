import type { GameProps } from '../../core/game-engine/types';
import { SizeSenseGame } from './SizeSenseGame';

export function Game(props: GameProps) {
  return <SizeSenseGame {...props} />;
}
