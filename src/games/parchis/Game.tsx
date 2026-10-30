import type { GameProps } from '../../core/game-engine/types';
import { RaceTable } from '../shared/cross/RaceTable';
import { heuristicMove, simpleMove } from '../shared/cross/heuristic';
import { PARCHIS_GAME } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <RaceTable
      services={services}
      game={PARCHIS_GAME}
      prefix="pq"
      strings={STRINGS}
      hardMove={heuristicMove}
      easyMove={simpleMove}
    />
  );
}
