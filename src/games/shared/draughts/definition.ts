/** Two-player shell definition builder for the draughts family (#012–#014). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { createDraughtsBoard, makePieceIcon, type SeatColors } from './DraughtsBoard';
import { isKing, seatOf, type DraughtsState, type DraughtsVariant, type Move } from './engine';
import { draughtsTwoPlayerRules } from './environment';
import { DRAUGHTS_STRINGS } from './i18n';

const SLIDE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.2, lowpass: 1800 },
  { wave: 'sine', freq: 260, freqEnd: 200, duration: 0.08, gain: 0.12 },
];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.25, lowpass: 2600 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.09, gain: 0.2, lowpass: 2600 },
];
const CROWN: SoundSpec = [
  { wave: 'triangle', freq: 660, duration: 0.1, gain: 0.2 },
  { wave: 'triangle', freq: 880, duration: 0.1, delay: 0.09, gain: 0.2 },
  { wave: 'triangle', freq: 1320, duration: 0.22, delay: 0.18, gain: 0.2 },
];

export interface DraughtsGameOptions {
  variant: DraughtsVariant;
  colors: SeatColors;
  env: GameEnvironment<DraughtsState, Move>;
  agents: AgentPreset<DraughtsState, Move>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  onRoundEnd?: (event: RoundEndEvent<DraughtsState>) => void;
}

export function createDraughtsDefinition(
  o: DraughtsGameOptions,
): TwoPlayerGameDefinition<DraughtsState, Move> {
  const v = o.variant;
  return {
    match: {
      rules: draughtsTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // The first-moving color always starts; players choose a side.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...DRAUGHTS_STRINGS.en, ...o.strings.en },
      es: { ...DRAUGHTS_STRINGS.es, ...o.strings.es },
    },
    Board: createDraughtsBoard(v, o.colors),
    SeatIcon: makePieceIcon(o.colors),
    badge: `${v.size}×${v.size}`,
    wideLayout: v.size >= 10,
    hintAgent: o.hintAgent,
    describeAction: (before, m, _after, t) =>
      t('announce.move', {
        seat: t(`seat.${before.toMove}`),
        move: o.env.actionToString?.(m) ?? '',
      }),
    actionSound: (after, m, _mover, before) => {
      const from = m[0]!;
      const to = m[m.length - 1]!;
      const crowned = !isKing(before.board[from]!) && isKing(after.board[to]!);
      if (crowned) return CROWN;
      const pieces = (s: DraughtsState) => s.board.filter((p) => p !== 0).length;
      return pieces(after) < pieces(before) ? CAPTURE : SLIDE;
    },
    statusInfo: (s, t) =>
      s.result
        ? null
        : t('info.pieces', {
            seat0: t('seat.0'),
            seat1: t('seat.1'),
            a: s.board.filter((p) => seatOf(p) === 0).length,
            b: s.board.filter((p) => seatOf(p) === 1).length,
          }),
    describeResult: (s, t) => {
      if (!s.result) return null;
      if (s.result.kind === 'win')
        return t('result.noMoves', { seat: t(`seat.${1 - s.result.winner}`) });
      return t(
        s.result.reason === 'repetition'
          ? 'result.repetition'
          : s.result.reason === 'no-progress'
            ? 'result.noProgress'
            : 'result.endgame',
      );
    },
    onRoundEnd: o.onRoundEnd,
  };
}
