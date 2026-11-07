import type { GameProps } from '../../core/game-engine/types';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { createUpDownDefinition } from '../shared/updown/definition';
import { AGENT_PRESETS, golfEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { LAYOUT } from './rules';

export const GOLF_GAME = createUpDownDefinition({
  layout: LAYOUT,
  columns: 7,
  stockAt: { col: 2, y: 2.45 },
  wasteAt: { col: 4, y: 2.45 },
  env: golfEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (state.score <= -1) unlock('birdie');
    if (state.score <= -5) unlock('eagle');
    if (undos === 0 && hints === 0) unlock('clean');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={GOLF_GAME} services={services} />;
}
