import type { GameProps } from '../../core/game-engine/types';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { createUpDownDefinition } from '../shared/updown/definition';
import { AGENT_PRESETS, triPeaksEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { LAYOUT } from './rules';

export const TRIPEAKS_GAME = createUpDownDefinition({
  layout: LAYOUT,
  columns: 10,
  stockAt: { col: 3.5, y: 2.65 },
  wasteAt: { col: 5, y: 2.65 },
  env: triPeaksEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (undos === 0 && hints === 0) unlock('clean');
    if (state.stock.length >= 5) unlock('spare');
    // The longest run of plays without drawing.
    let run = 0;
    let best = 0;
    for (const m of state.history) {
      run = m === 'draw' ? 0 : run + 1;
      best = Math.max(best, run);
    }
    if (best >= 10) unlock('long-run');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={TRIPEAKS_GAME} services={services} />;
}
