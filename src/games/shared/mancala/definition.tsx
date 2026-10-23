/** Two-player shell definition builder for the mancala games (#061, #062, #064). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { RoundEndEvent, TwoPlayerGameDefinition } from '../two-player/TwoPlayerGame';
import type { MancalaState, MancalaVariant } from './engine';
import { mancalaTwoPlayerRules } from './environment';
import { MANCALA_STRINGS } from './i18n';
import { createMancalaBoard } from './MancalaBoard';

const SOW: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.12, lowpass: 3800 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.07, gain: 0.1, lowpass: 3800 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.14, gain: 0.08, lowpass: 3800 },
];
const CAPTURE: SoundSpec = [
  { wave: 'triangle', freq: 520, freqEnd: 820, duration: 0.16, gain: 0.12 },
];

export interface MancalaGameOptions {
  variant: MancalaVariant;
  env: GameEnvironment<MancalaState, string>;
  agents: AgentPreset<MancalaState, string>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  onRoundEnd?: (event: RoundEndEvent<MancalaState>) => void;
}

export function createMancalaDefinition(
  o: MancalaGameOptions,
): TwoPlayerGameDefinition<MancalaState, string> {
  const v = o.variant;
  return {
    match: {
      rules: mancalaTwoPlayerRules(v),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: 'medium',
      defaultWatch: ['hard', 'medium'],
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...MANCALA_STRINGS.en, ...o.strings.en },
      es: { ...MANCALA_STRINGS.es, ...o.strings.es },
    },
    Board: createMancalaBoard(v),
    SeatIcon: ({ seat, size }) => (
      <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
        <ellipse cx="10" cy="10" rx="8.5" ry="6.5" fill="#5c3a1d" />
        <circle cx={seat === 0 ? 8 : 12} cy="10" r="2.6" fill="#e3a14c" />
        <circle cx={seat === 0 ? 12 : 8} cy="9" r="2" fill="#f2c27a" />
      </svg>
    ),
    wideLayout: true,
    hintAgent: 'medium',
    resignable: true,
    statusInfo: (s, t) => {
      if (s.result) return null;
      const lastMover = s.movers[s.movers.length - 1];
      return lastMover === s.toMove && s.history.length > 0
        ? t('info.again', { seat: t(`seat.${s.toMove}`) })
        : t('info.goal');
    },
    describeAction: (before, a, after, t) => {
      const seat = t(`seat.${before.toMove}`);
      if (a === 'swap') return t('announce.swap', { seat });
      return t('announce.sow', {
        seat,
        n: (Number(a) % v.pits) + 1,
        a: after.stores[0],
        b: after.stores[1],
      });
    },
    actionSound: (after, _a, mover, before) =>
      after.stores[mover] - before.stores[mover] > 1 ? CAPTURE : SOW,
    describeResult: (s, t) =>
      s.result ? t('result.final', { a: s.stores[0], b: s.stores[1] }) : null,
    onRoundEnd: o.onRoundEnd,
  };
}
