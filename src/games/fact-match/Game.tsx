import type { GameProps } from '../../core/game-engine/types';
import { FactMatchGame } from './FactMatchGame';

export function Game(props: GameProps) {
  return <FactMatchGame {...props} />;
}
