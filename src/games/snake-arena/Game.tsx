import type { GameProps } from '../../core/game-engine/types';
import { ArcadeShell } from '../shared/arcade/ArcadeShell';
import { SNAKES } from './definition';

export function Game({ services }: GameProps) {
  return <ArcadeShell services={services} def={SNAKES} />;
}
