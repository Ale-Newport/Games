import type { GameProps } from '../../core/game-engine/types';
import { ScorecardTable } from '../shared/scorecard/ScorecardTable';
import { GENERALA, GENERALA_PLANNING } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <ScorecardTable
      services={services}
      rules={GENERALA}
      planning={GENERALA_PLANNING}
      prefix="gn"
      strings={STRINGS}
      onFinished={(g, { won, vsComputer, total, unlock }) => {
        unlock('first');
        if (g.instant === 0) unlock('served');
        if (total >= 250) unlock('score250');
        if (won && vsComputer) unlock('beat');
      }}
    />
  );
}
