import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { positionOf } from '../shared/chess/game';
import { EMPTY } from '../shared/chess/position';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { antichessEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

const count = (placement: string, re: RegExp) => (placement.match(re) ?? []).length;

export const ANTICHESS_GAME = createChessDefinition({
  variant: VARIANT,
  env: antichessEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  info: (s, t) => {
    const placement = s.fen.split(' ')[0]!;
    const pieces = t('info.pieces', {
      seat0: t('seat.0'),
      seat1: t('seat.1'),
      a: count(placement, /[PNBRQK]/g),
      b: count(placement, /[pnbrqk]/g),
    });
    if (s.result) return pieces;
    const mustCapture = positionOf(VARIANT, s)
      .legalMoves()
      .some((m) => m.captured !== EMPTY);
    return mustCapture ? `${pieces} · ${t('info.mustCapture')}` : pieces;
  },
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    const f = feats(round, setup.humanSeat);
    if (f.kingPromotion) unlock('king-promotion');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (f.blockedWin) unlock('blocked-win');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ANTICHESS_GAME} services={services} />;
}
