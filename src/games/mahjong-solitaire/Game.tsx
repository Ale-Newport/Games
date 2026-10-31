import type { GameProps } from '../../core/game-engine/types';
import { MahjongTable } from './MahjongTable';

export function Game({ services }: GameProps) {
  return <MahjongTable services={services} />;
}
