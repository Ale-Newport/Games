import type { GameProps } from '../../core/game-engine/types';
import { SenetTable } from './SenetTable';

export function Game({ services }: GameProps) {
  return <SenetTable services={services} />;
}
