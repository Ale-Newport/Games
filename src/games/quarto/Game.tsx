import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { quartoEnv } from './ai-adapter';
import {
  applyQuartoAction,
  createQuartoState,
  isValidQuartoState,
  legalQuartoActions,
  parseAction,
  replayQuarto,
  type QuartoState,
} from './engine';
import { STRINGS } from './i18n';
import { QuartoBoard, pieceLabel } from './QuartoBoard';
import { QuartoPiece } from './QuartoPiece';

const PLACE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.22, lowpass: 1800 },
  { wave: 'sine', freq: 260, freqEnd: 200, duration: 0.07, gain: 0.12 },
];
const GIVE: SoundSpec = [{ wave: 'triangle', freq: 660, freqEnd: 760, duration: 0.08, gain: 0.1 }];

function SeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <span style={{ display: 'grid', width: size + 4, height: size + 4 }}>
      <QuartoPiece piece={seat === 0 ? 1 : 15} />
    </span>
  );
}

export const QUARTO: TwoPlayerGameDefinition<QuartoState, string> = {
  match: {
    rules: {
      create: () => createQuartoState(),
      apply: applyQuartoAction,
      isLegal: (s, a) => typeof a === 'string' && legalQuartoActions(s).includes(a),
      undo: (s, plies) => replayQuarto(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) =>
        s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
      validate: isValidQuartoState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // Player 1 always makes the opening give; players pick a seat instead of alternating.
    fixedFirstSeat: 0,
  },
  env: quartoEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: QuartoBoard,
  SeatIcon,
  hintAgent: 'medium',
  resignable: true,
  describeAction: (before, a, _after, t) => {
    const { cell, give } = parseAction(a)!;
    const seat = t(`seat.${before.toMove}`);
    if (cell < 0) return t('announce.give', { seat, piece: pieceLabel(give, t) });
    if (give < 0) return t('announce.place', { seat, n: cell + 1 });
    return t('announce.placeGive', { seat, n: cell + 1, piece: pieceLabel(give, t) });
  },
  actionSound: (_after, a) => (a.startsWith('give') ? GIVE : PLACE),
  describeResult: (s, t) =>
    s.result ? t(s.result.kind === 'win' ? 'result.quarto' : 'result.full') : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    if (outcome === 'draw' && setup.difficulty === 'hard') unlock('stalemate-hard');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.board.filter((p) => p >= 0).length <= 8) unlock('early-quarto');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={QUARTO} services={services} />;
}
