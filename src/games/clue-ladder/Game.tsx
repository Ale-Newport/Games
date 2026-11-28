import type { GameProps } from '../../core/game-engine/types';
import { LadderGame } from './LadderGame';

export function Game(props: GameProps) {
  return <LadderGame {...props} />;
}
