import type { GameProps } from '../../core/game-engine/types';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { FREECELL } from './definition';

const DEFINITION = {
  ...FREECELL,
  onEnd: ({
    won,
    state,
    timeMs,
    undos,
    hints,
    unlock,
  }: Parameters<NonNullable<typeof FREECELL.onEnd>>[0]) => {
    if (!won) return;
    unlock('first-win');
    if (timeMs < 5 * 60_000) unlock('quick');
    if (undos === 0 && hints === 0) unlock('clean');
    // Never more than two free cells in use at once.
    let most = 0;
    let s = FREECELL.deal(state.seed);
    for (const m of state.history) {
      s = FREECELL.apply(s, m);
      most = Math.max(most, s.cells.filter((c) => c !== -1).length);
    }
    if (most <= 2) unlock('two-cells');
  },
};

export function Game({ services }: GameProps) {
  return <SolitaireGame def={DEFINITION} services={services} />;
}
