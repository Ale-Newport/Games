import type { GameProps } from '../../core/game-engine/types';
import { MinesGame } from '../shared/minesweeper/MinesGame';
import { SPECS } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <MinesGame
      services={services}
      specs={SPECS}
      noGuess={false}
      strings={STRINGS}
      speedMs={30_000}
    />
  );
}
