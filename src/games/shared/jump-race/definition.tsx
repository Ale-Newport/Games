/** Two-player shell definition builder for the jump-race games (#065–#066). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import {
  jumpPath,
  parseMove,
  targetCamp,
  type JumpRaceState,
  type JumpRaceVariant,
} from './engine';
import { jumpRaceTwoPlayerRules } from './environment';
import { JumpRacePiece, createJumpRaceBoard } from './JumpRaceBoard';
import { JUMP_RACE_STRINGS } from './i18n';

const STEP: SoundSpec = [{ wave: 'triangle', freq: 560, freqEnd: 620, duration: 0.06, gain: 0.1 }];
const HOP: SoundSpec = [
  { wave: 'triangle', freq: 480, freqEnd: 720, duration: 0.07, gain: 0.1 },
  { wave: 'triangle', freq: 560, freqEnd: 840, duration: 0.07, delay: 0.08, gain: 0.09 },
];

export interface JumpRaceGameOptions {
  variant: JumpRaceVariant;
  env: GameEnvironment<JumpRaceState, string>;
  agents: AgentPreset<JumpRaceState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<JumpRaceState>) => void;
}

/** Pieces of `seat` already in the camp it must fill. */
export function arrived(v: JumpRaceVariant, s: JumpRaceState, seat: 0 | 1): number {
  return targetCamp(v, seat).filter((c) => s.board[c] === seat + 1).length;
}

export function createJumpRaceDefinition(
  o: JumpRaceGameOptions,
): TwoPlayerGameDefinition<JumpRaceState, string> {
  const v = o.variant;
  const names = v.geometry.names;
  return {
    match: {
      rules: jumpRaceTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...JUMP_RACE_STRINGS.en, ...o.strings.en },
      es: { ...JUMP_RACE_STRINGS.es, ...o.strings.es },
    },
    Board: createJumpRaceBoard(v),
    SeatIcon: ({ seat, size }) => (
      <svg width={size + 2} height={size + 2} viewBox="-0.5 -0.5 1 1" aria-hidden="true">
        <JumpRacePiece seat={seat as 0 | 1} r={0.42} />
      </svg>
    ),
    wideLayout: true,
    hintAgent: 'medium',
    resignable: true,
    statusInfo: (s, t) =>
      s.result
        ? null
        : t('info.progress', {
            a: arrived(v, s, 0),
            b: arrived(v, s, 1),
            n: v.geometry.camps[0].length,
          }),
    describeAction: (before, a, _after, t) => {
      const [f, to] = parseMove(a);
      const seat = t(`seat.${before.toMove}`);
      const path = jumpPath(v, before.board, f, to);
      const step = v.geometry.neighbors.some((d) => d[f] === to);
      if (step) return t('announce.step', { seat, from: names[f]!, to: names[to]! });
      const n = path.length - 1;
      return t('announce.jump', { seat, from: names[f]!, to: names[to]!, n, s: n > 1 ? 's' : '' });
    },
    actionSound: (_after, a, _mover, before) => {
      const [f, to] = parseMove(a);
      return v.geometry.neighbors.some((d) => d[f] === to) || !before ? STEP : HOP;
    },
    describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
    onRoundEnd: o.onRoundEnd,
  };
}
