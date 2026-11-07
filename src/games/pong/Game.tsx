import type { GameProps } from '../../core/game-engine/types';
import { ArcadeShell } from '../shared/arcade/ArcadeShell';
import { PONG } from './definition';

export function Game({ services }: GameProps) {
  return <ArcadeShell services={services} def={PONG} />;
}
