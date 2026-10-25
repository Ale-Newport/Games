import type { GameProps } from '../../core/game-engine/types';
import type { SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { CANFIELD } from './definition';
import type { CanfieldState } from './engine';

const DEFINITION: SolitaireDefinition<CanfieldState> = {
  ...CANFIELD,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    if (state.reserve.length === 0) unlock('reserve');
    if (!won) return;
    unlock('first-win');
    if (undos === 0 && hints === 0) unlock('clean');
  },
};

export function Game({ services }: GameProps) {
  return <SolitaireGame def={DEFINITION} services={services} />;
}
