import type { GameProps } from '../../core/game-engine/types';
import { ArcadeShell } from '../shared/arcade/ArcadeShell';
import { DEF } from './definition';
import styles from './Game.module.css';

export function Game({ services }: GameProps) {
  return (
    <div className={styles.shell}>
      <ArcadeShell services={services} def={DEF} />
    </div>
  );
}
