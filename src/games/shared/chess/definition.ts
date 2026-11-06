/** Two-player shell definition builder for the chess family (#015–#020). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { TimeControl } from '../two-player/match';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { ChessSeatIcon, createChessBoard, localizeSan } from './ChessBoard';
import { chessCanWinOnTime, chessTwoPlayerRules } from './environment';
import { positionOf, sideToMove, type ChessState, type ChessVariant } from './game';
import { CHESS_STRINGS } from './i18n';

const MOVE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.22, lowpass: 1500 },
  { wave: 'sine', freq: 210, freqEnd: 150, duration: 0.07, gain: 0.14 },
];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.3, lowpass: 2400 },
  { wave: 'sine', freq: 180, freqEnd: 110, duration: 0.1, gain: 0.18 },
];
const CASTLE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 1500 },
  { wave: 'noise', freq: 0, duration: 0.04, delay: 0.11, gain: 0.2, lowpass: 1500 },
];
const CHECK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.22, lowpass: 1800 },
  { wave: 'triangle', freq: 988, duration: 0.12, delay: 0.03, gain: 0.16 },
];
const PROMOTE: SoundSpec = [
  { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.2 },
  { wave: 'triangle', freq: 990, duration: 0.2, delay: 0.09, gain: 0.2 },
];

export const CHESS_TIME_CONTROLS: readonly TimeControl[] = [
  { id: '3+2', initialMs: 3 * 60_000, incrementMs: 2_000 },
  { id: '5+0', initialMs: 5 * 60_000, incrementMs: 0 },
  { id: '10+5', initialMs: 10 * 60_000, incrementMs: 5_000 },
  { id: '15+10', initialMs: 15 * 60_000, incrementMs: 10_000 },
];

export interface ChessGameOptions {
  variant: ChessVariant;
  env: GameEnvironment<ChessState, string>;
  agents: AgentPreset<ChessState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  badge?: string;
  /** Start-position seed for each new round (Chess960); fixed starts ignore it. */
  seed?: () => number;
  onRoundEnd?: (event: RoundEndEvent<ChessState>) => void;
}

const pieceCount = (fen: string) => fen.split(' ')[0]!.replace(/[^a-zA-Z]/g, '').length;

export function createChessDefinition(
  o: ChessGameOptions,
): TwoPlayerGameDefinition<ChessState, string> {
  const v = o.variant;
  return {
    match: {
      rules: chessTwoPlayerRules(v, o.seed),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // White always moves first; players choose a color.
      fixedFirstSeat: 0,
      timeControls: CHESS_TIME_CONTROLS,
      canWinOnTime: (s, seat) => chessCanWinOnTime(v, s, seat),
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...CHESS_STRINGS.en, ...o.strings.en },
      es: { ...CHESS_STRINGS.es, ...o.strings.es },
    },
    Board: createChessBoard(v),
    SeatIcon: ChessSeatIcon,
    badge: o.badge,
    // Board on the left with clocks, status and controls beside it on wide screens.
    wideLayout: true,
    hintAgent: o.hintAgent,
    resignable: true,
    describeAction: (before, _a, after, t) =>
      t('announce.move', {
        seat: t(`seat.${sideToMove(before)}`),
        move: localizeSan(after.san[after.san.length - 1] ?? '', t),
      }),
    actionSound: (after, action, _mover, before) => {
      const san = after.san[after.san.length - 1] ?? '';
      if (san.includes('=')) return PROMOTE;
      if (san.endsWith('+') || san.endsWith('#')) return CHECK;
      if (action.startsWith('O-O')) return CASTLE;
      return pieceCount(after.fen) < pieceCount(before.fen) ? CAPTURE : MOVE;
    },
    statusInfo: (s, t) => {
      if (s.result) return null;
      if (v.goal === 'three-check')
        return t('info.checks', {
          seat0: t('seat.0'),
          seat1: t('seat.1'),
          a: s.checks[0],
          b: s.checks[1],
        });
      return v.goal !== 'antichess' && positionOf(v, s).inCheck() ? t('info.check') : null;
    },
    describeResult: (s, t) => {
      const r = s.result;
      if (!r) return null;
      if (r.kind === 'draw')
        return t(
          {
            stalemate: 'result.stalemate',
            'fifty-move': 'result.fifty',
            repetition: 'result.repetition',
            'insufficient-material': 'result.insufficient',
          }[r.reason],
        );
      const seat = t(`seat.${r.winner}`);
      if (r.reason === 'hill') return t('result.hill', { seat });
      if (r.reason === 'three-check') return t('result.threeCheck', { seat });
      if (r.reason === 'no-pieces-or-moves') return t('result.noPieces', { seat });
      return t('result.checkmate');
    },
    onRoundEnd: o.onRoundEnd,
  };
}
