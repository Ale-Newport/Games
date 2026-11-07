import type { GameProps } from '../../core/game-engine/types';
import { RaceTable } from '../shared/cross/RaceTable';
import { heuristicMove, simpleMove } from '../shared/cross/heuristic';
import { STRINGS } from './i18n';
import { LUDO_GAME } from './engine';

export function Game({ services }: GameProps) {
  return (
    <RaceTable
      services={services}
      game={LUDO_GAME}
      prefix="ld"
      strings={STRINGS}
      hardMove={heuristicMove}
      easyMove={simpleMove}
    />
  );
}
