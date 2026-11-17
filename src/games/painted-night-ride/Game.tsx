import type { GameProps } from '../../core/game-engine/types';
import { NightGame } from './NightGame';

export function Game(props: GameProps) {
  return <NightGame {...props} />;
}
