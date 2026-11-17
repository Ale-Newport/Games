import type { GameProps } from '../../core/game-engine/types';
import { MindReaderGame } from './MindReaderGame';

export function Game(props: GameProps) {
  return <MindReaderGame {...props} />;
}
