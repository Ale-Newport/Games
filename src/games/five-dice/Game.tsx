import type { GameProps } from '../../core/game-engine/types';
import { ScorecardTable } from '../shared/scorecard/ScorecardTable';
import { FIVE_DICE, FIVE_DICE_PLANNING } from './engine';
import { STRINGS } from './i18n';

export function Game({ services }: GameProps) {
  return (
    <ScorecardTable
      services={services}
      rules={FIVE_DICE}
      planning={FIVE_DICE_PLANNING}
      prefix="fd"
      strings={STRINGS}
      onFinished={(g, { won, vsComputer, total, unlock }) => {
        unlock('first');
        if (total >= 250) unlock('score250');
        if (g.cards[0]!.fiveKind === 50) unlock('fiveKind');
        if (won && vsComputer) unlock('beat');
      }}
    />
  );
}
