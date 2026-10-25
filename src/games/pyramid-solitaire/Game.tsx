import type { GameProps } from '../../core/game-engine/types';
import type { SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { PYRAMID } from './definition';
import type { PyramidState } from './engine';

const DEFINITION: SolitaireDefinition<PyramidState> = {
  ...PYRAMID,
  onEnd: ({ won, state, timeMs, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (state.recycles === 0) unlock('one-pass');
    if (undos === 0 && hints === 0) unlock('clean');
    if (timeMs < 3 * 60_000) unlock('quick');
  },
};

export function Game({ services }: GameProps) {
  return <SolitaireGame def={DEFINITION} services={services} />;
}
