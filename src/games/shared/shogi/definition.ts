/** Two-player shell definition builder for the shogi family (#021–#022). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale, Translator } from '../../../core/i18n';
import type { TimeControl } from '../two-player/match';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import { shogiTwoPlayerRules } from './environment';
import { positionOf, type ShogiState } from './game';
import { SHOGI_STRINGS } from './i18n';
import { createShogiBoard, ShogiSeatIcon } from './ShogiBoard';
import type { ShogiVariant } from './variants';

const MOVE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.035, gain: 0.28, lowpass: 2200 },
  { wave: 'sine', freq: 240, freqEnd: 170, duration: 0.06, gain: 0.14 },
];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.32, lowpass: 2800 },
  { wave: 'sine', freq: 190, freqEnd: 120, duration: 0.09, gain: 0.18 },
];
const DROP: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.03, gain: 0.3, lowpass: 3200 },
  { wave: 'triangle', freq: 520, freqEnd: 420, duration: 0.07, gain: 0.12 },
];
const PROMOTE: SoundSpec = [
  { wave: 'triangle', freq: 600, duration: 0.09, gain: 0.2 },
  { wave: 'triangle', freq: 900, duration: 0.18, delay: 0.08, gain: 0.2 },
];

export const SHOGI_TIME_CONTROLS: readonly TimeControl[] = [
  { id: '5+5', initialMs: 5 * 60_000, incrementMs: 5_000 },
  { id: '10+10', initialMs: 10 * 60_000, incrementMs: 10_000 },
  { id: '20+10', initialMs: 20 * 60_000, incrementMs: 10_000 },
];

export interface ShogiGameOptions {
  variant: ShogiVariant;
  env: GameEnvironment<ShogiState, string>;
  agents: AgentPreset<ShogiState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  badge?: string;
  timeControls?: readonly TimeControl[];
  /** Name of the royal piece for result lines ("king", "lion"). */
  royalName: (t: Translator) => string;
  onRoundEnd?: (event: RoundEndEvent<ShogiState>) => void;
}

export function createShogiDefinition(
  o: ShogiGameOptions,
): TwoPlayerGameDefinition<ShogiState, string> {
  const v = o.variant;
  return {
    match: {
      rules: shogiTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // Sente always moves first; players choose a side.
      fixedFirstSeat: 0,
      timeControls: o.timeControls ?? SHOGI_TIME_CONTROLS,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...SHOGI_STRINGS.en, ...o.strings.en },
      es: { ...SHOGI_STRINGS.es, ...o.strings.es },
    },
    Board: createShogiBoard(v),
    SeatIcon: ShogiSeatIcon,
    badge: o.badge,
    wideLayout: v.rows >= 9,
    hintAgent: o.hintAgent,
    resignable: true,
    describeAction: (before, _a, after, t) =>
      t('announce.move', {
        seat: t(`seat.${before.toMove}`),
        move: after.notation[after.notation.length - 1] ?? '',
      }),
    actionSound: (after) => {
      const n = after.notation[after.notation.length - 1] ?? '';
      if (n.includes('*')) return DROP;
      if (n.endsWith('+')) return PROMOTE;
      return n.includes('x') ? CAPTURE : MOVE;
    },
    statusInfo: (s, t) =>
      !s.result && v.goal === 'checkmate' && positionOf(v, s).inCheck() ? t('info.check') : null,
    describeResult: (s, t) => {
      const r = s.result;
      if (!r) return null;
      if (r.kind === 'draw')
        return t(r.reason === 'repetition' ? 'result.repetition' : 'result.moveLimit');
      const winner = t(`seat.${r.winner}`);
      const loser = t(`seat.${1 - r.winner}`);
      switch (r.reason) {
        case 'checkmate':
          return t('result.checkmate');
        case 'no-moves':
          return t('result.noMoves', { seat: loser });
        case 'capture':
          return t('result.capture', { seat: winner, royal: o.royalName(t) });
        case 'try':
          return t('result.try', { seat: winner, royal: o.royalName(t) });
        case 'perpetual-check':
          return t('result.perpetual', { seat: loser });
      }
    },
    onRoundEnd: o.onRoundEnd,
  };
}
