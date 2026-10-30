import type { GameProps } from '../../core/game-engine/types';
import { RaceTable } from '../shared/cross/RaceTable';
import { heuristicMove, simpleMove } from '../shared/cross/heuristic';
import { Cowries } from './Cowries';
import { PACHISI_GAME } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <RaceTable
      services={services}
      game={PACHISI_GAME}
      prefix="pc"
      strings={STRINGS}
      hardMove={heuristicMove}
      easyMove={simpleMove}
      renderThrow={(s) => <Cowries faces={s.faces} value={s.phase === 'bonus' ? null : s.die} />}
    />
  );
}
